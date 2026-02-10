#!/usr/bin/env python3
"""
Page Monitor for TMT Legal Intelligence

Monitors configured web pages for changes using content hashing.
Stores hashes and detected changes directly in tmt_intelligence.db.

Usage:
    python monitor_pages.py --tier=1              # Monitor Tier 1 webfetch sources
    python monitor_pages.py --source=source_id    # Monitor specific webfetch source
    python monitor_pages.py --tier=1 --dry-run    # Preview without saving
    python monitor_pages.py --all                 # Monitor all tiers
"""

import argparse
import hashlib
import json
import logging
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urljoin

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Error: Required packages not installed.")
    print("Run: pip install requests beautifulsoup4")
    sys.exit(1)

import db

# Setup paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
SOURCES_CONFIG_DIR = PROJECT_ROOT / "sources" / "config"

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)

# Request settings
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5"
}
TIMEOUT = 30


def content_hash(text: str) -> str:
    """Generate SHA256 hash of content."""
    normalized = " ".join(text.split())
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:32]


def extract_main_content(html: str, url: str) -> str:
    """Extract main content from HTML, ignoring navigation/footer."""
    soup = BeautifulSoup(html, "html.parser")

    for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
        tag.decompose()

    main = soup.find("main") or soup.find("article") or soup.find("div", {"class": "content"})
    if main:
        text = main.get_text(separator=" ", strip=True)
    else:
        text = soup.get_text(separator=" ", strip=True)

    return text


def extract_links(html: str, base_url: str) -> list[dict]:
    """Extract notable links from the page."""
    soup = BeautifulSoup(html, "html.parser")
    links = []

    main_area = soup.find("main") or soup.find("article") or soup.find("div", {"class": "content"}) or soup

    for a in main_area.find_all("a", href=True)[:20]:
        href = a.get("href", "")
        text = a.get_text(strip=True)

        if not text or len(text) < 5:
            continue
        if any(x in text.lower() for x in ["home", "about", "contact", "privacy", "terms"]):
            continue

        full_url = urljoin(base_url, href)
        links.append({"text": text[:100], "url": full_url})

    return links


def load_source_configs(tiers: list[int], source_id: str = None) -> list[dict]:
    """Load source configurations for specified tiers."""
    tier_dirs = {
        1: "tier1-critical",
        2: "tier2-high",
        3: "tier3-standard",
        4: "tier4-regular",
        5: "tier5-periodic"
    }

    sources = []
    for tier in tiers:
        tier_dir = SOURCES_CONFIG_DIR / tier_dirs.get(tier, "")
        if not tier_dir.exists():
            logger.warning(f"Tier {tier} directory not found: {tier_dir}")
            continue

        for config_file in tier_dir.glob("*.json"):
            try:
                with open(config_file) as f:
                    config = json.load(f)
                    webfetch_sources = [
                        s for s in config.get("sources", [])
                        if s.get("method") == "webfetch" and s.get("enabled", True)
                    ]
                    if source_id:
                        webfetch_sources = [s for s in webfetch_sources if s.get("id") == source_id]
                    for source in webfetch_sources:
                        source["tier"] = tier
                    sources.extend(webfetch_sources)
            except (json.JSONDecodeError, KeyError) as e:
                logger.error(f"Error loading {config_file}: {e}")

    return sources


def check_single_page(source: dict, url: str, section_name: str, conn) -> dict:
    """Check a single page for changes using DB-stored hashes."""
    source_id = source.get("id", "unknown")

    result = {
        "source_id": source_id,
        "source_name": source.get("name", source_id),
        "section": section_name,
        "url": url,
        "success": False,
        "change_detected": False,
        "new_hash": None,
        "notable_links": [],
        "error": None,
        "last_checked": datetime.now(timezone.utc).isoformat(),
        "focus_areas": source.get("focus_areas", []),
    }

    try:
        logger.info(f"Checking: {source_id} - {section_name}")
        response = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
        response.raise_for_status()

        content = extract_main_content(response.text, url)
        new_hash = content_hash(content)
        result["new_hash"] = new_hash

        old_hash = db.get_page_hash(conn, source_id, section_name)

        if old_hash is None:
            logger.info(f"  First check - storing initial hash")
            result["change_detected"] = False
        elif old_hash != new_hash:
            logger.info(f"  CHANGE DETECTED!")
            result["change_detected"] = True
            result["notable_links"] = extract_links(response.text, url)
        else:
            logger.info(f"  No change")

        result["success"] = True

    except requests.RequestException as e:
        result["error"] = str(e)
        logger.error(f"  Error checking {source_id}: {e}")

    return result


def monitor_source(source: dict, conn) -> list[dict]:
    """Monitor all sections of a single source."""
    results = []

    sections = source.get("sections", [])
    if sections:
        for section in sections:
            section_url = section.get("url", section.get("path", ""))
            section_name = section.get("name", "main")

            if section_url.startswith("/"):
                section_url = source.get("url", "").rstrip("/") + section_url

            if section_url:
                result = check_single_page(source, section_url, section_name, conn)
                results.append(result)
                time.sleep(1)
    else:
        main_url = source.get("url", "")
        if main_url:
            result = check_single_page(source, main_url, "main", conn)
            results.append(result)

    return results


def main():
    parser = argparse.ArgumentParser(description="Monitor web pages for changes")
    parser.add_argument("--tier", type=int, choices=[1, 2, 3, 4, 5], help="Tier to monitor (1-5)")
    parser.add_argument("--all", action="store_true", help="Monitor all tiers")
    parser.add_argument("--source", type=str, help="Monitor specific source by ID")
    parser.add_argument("--dry-run", action="store_true", help="Preview without saving hashes")
    args = parser.parse_args()

    if args.all:
        tiers = [1, 2, 3, 4, 5]
    elif args.tier:
        tiers = [args.tier]
    elif args.source:
        tiers = [1, 2, 3, 4, 5]
    else:
        tiers = [1]

    if args.source:
        logger.info(f"Monitoring specific source: {args.source}")
    else:
        logger.info(f"Monitoring pages for tier(s): {tiers}")

    sources = load_source_configs(tiers, source_id=args.source)
    if not sources:
        if args.source:
            logger.warning(f"Source '{args.source}' not found or not a webfetch source")
        else:
            logger.warning("No webfetch sources found for specified tiers")
        return

    logger.info(f"Found {len(sources)} webfetch sources to monitor")

    conn = db.get_connection()

    # Monitor all sources
    all_results = []
    for i, source in enumerate(sources):
        results = monitor_source(source, conn)
        all_results.extend(results)
        if i < len(sources) - 1:
            time.sleep(2)

    # Update DB with results
    changes = []
    stats = {
        "total_pages": len(all_results),
        "successful": 0,
        "failed": 0,
        "changes_detected": 0
    }

    for r in all_results:
        source_id = r["source_id"]

        if r.get("success"):
            stats["successful"] += 1

            # Update hash in DB
            if not args.dry_run and r.get("new_hash"):
                db.set_page_hash(conn, source_id, r["section"], r["new_hash"])
                db.update_source_last_fetch(conn, source_id)

            if r.get("change_detected"):
                stats["changes_detected"] += 1
                changes.append(r)

                # Insert detected changes as items
                if not args.dry_run:
                    for link in r.get("notable_links", []):
                        db.insert_item(
                            conn,
                            url=link["url"],
                            title=link["text"],
                            snippet=f"Found on {r['source_name']} - {r['section']}",
                            source_id=source_id,
                            published=r["last_checked"],
                            focus_areas=r.get("focus_areas"),
                        )

                    if not r.get("notable_links"):
                        db.insert_item(
                            conn,
                            url=r["url"],
                            title=f"Updated: {r['source_name']} - {r['section']}",
                            snippet="Page content has been updated. Check the source for details.",
                            source_id=source_id,
                            published=r["last_checked"],
                            focus_areas=r.get("focus_areas"),
                        )
        else:
            stats["failed"] += 1
            if not args.dry_run and r.get("error"):
                db.record_source_error(conn, source_id, r["error"])

    if not args.dry_run:
        conn.commit()
    conn.close()

    # Summary
    if args.dry_run:
        logger.info("=== DRY RUN - No changes written ===")
    logger.info("=" * 50)
    logger.info(f"Monitoring complete!")
    logger.info(f"  Pages checked: {stats['total_pages']}")
    logger.info(f"  Successful: {stats['successful']}")
    logger.info(f"  Failed: {stats['failed']}")
    logger.info(f"  CHANGES DETECTED: {stats['changes_detected']}")

    if changes:
        logger.info("\nPages with changes:")
        for change in changes:
            logger.info(f"  - {change['source_name']} ({change['section']})")


if __name__ == "__main__":
    main()
