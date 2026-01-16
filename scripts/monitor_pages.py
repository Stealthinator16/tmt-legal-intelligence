#!/usr/bin/env python3
"""
Page Monitor for TMT Legal Intelligence

Monitors configured web pages for changes using content hashing.
Detects when pages have been updated and flags them for Claude to review.

Usage:
    python monitor_pages.py --tier=1              # Monitor Tier 1 webfetch sources
    python monitor_pages.py --tier=1 --dry-run    # Preview without saving
    python monitor_pages.py --all                 # Monitor all tiers
"""

import argparse
import hashlib
import json
import logging
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Error: Required packages not installed.")
    print("Run: pip install requests beautifulsoup4")
    sys.exit(1)

# Setup paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
SOURCES_CONFIG_DIR = PROJECT_ROOT / "sources" / "config"
STATE_DIR = PROJECT_ROOT / "sources" / "state"
OUTPUT_DIR = PROJECT_ROOT / "sources" / "downloaded"

# Ensure directories exist
STATE_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# State file for page hashes
HASHES_FILE = STATE_DIR / "page_hashes.json"

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


def load_page_hashes() -> dict:
    """Load previously stored page hashes."""
    if HASHES_FILE.exists():
        try:
            with open(HASHES_FILE) as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return {}
    return {}


def save_page_hashes(hashes: dict):
    """Save page hashes to state file."""
    with open(HASHES_FILE, "w") as f:
        json.dump(hashes, f, indent=2)


def content_hash(text: str) -> str:
    """Generate SHA256 hash of content."""
    # Normalize whitespace before hashing
    normalized = " ".join(text.split())
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:32]


def extract_main_content(html: str, url: str) -> str:
    """Extract main content from HTML, ignoring navigation/footer."""
    soup = BeautifulSoup(html, "html.parser")

    # Remove script, style, nav, footer elements
    for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
        tag.decompose()

    # Try to find main content area
    main = soup.find("main") or soup.find("article") or soup.find("div", {"class": "content"})
    if main:
        text = main.get_text(separator=" ", strip=True)
    else:
        text = soup.get_text(separator=" ", strip=True)

    return text


def extract_links(html: str, base_url: str) -> list[dict]:
    """Extract notable links from the page."""
    from urllib.parse import urljoin

    soup = BeautifulSoup(html, "html.parser")
    links = []

    # Look for links in main content areas
    main_area = soup.find("main") or soup.find("article") or soup.find("div", {"class": "content"}) or soup

    for a in main_area.find_all("a", href=True)[:20]:  # Limit to first 20 links
        href = a.get("href", "")
        text = a.get_text(strip=True)

        if not text or len(text) < 5:
            continue

        # Skip navigation/footer links
        if any(x in text.lower() for x in ["home", "about", "contact", "privacy", "terms"]):
            continue

        full_url = urljoin(base_url, href)
        links.append({
            "text": text[:100],
            "url": full_url
        })

    return links


def load_source_configs(tiers: list[int]) -> list[dict]:
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
                    # Filter for webfetch sources only
                    webfetch_sources = [
                        s for s in config.get("sources", [])
                        if s.get("method") == "webfetch" and s.get("enabled", True)
                    ]
                    for source in webfetch_sources:
                        source["tier"] = tier
                    sources.extend(webfetch_sources)
            except (json.JSONDecodeError, KeyError) as e:
                logger.error(f"Error loading {config_file}: {e}")

    return sources


def check_single_page(source: dict, url: str, section_name: str, stored_hashes: dict) -> dict:
    """Check a single page for changes."""
    source_id = source.get("id", "unknown")
    hash_key = f"{source_id}:{section_name}"

    result = {
        "source_id": source_id,
        "source_name": source.get("name", source_id),
        "section": section_name,
        "url": url,
        "success": False,
        "change_detected": False,
        "new_hash": None,
        "old_hash": stored_hashes.get(hash_key),
        "notable_links": [],
        "error": None,
        "last_checked": datetime.now(timezone.utc).isoformat()
    }

    try:
        logger.info(f"Checking: {source_id} - {section_name}")
        response = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
        response.raise_for_status()

        # Extract main content and hash it
        content = extract_main_content(response.text, url)
        new_hash = content_hash(content)
        result["new_hash"] = new_hash

        # Compare with stored hash
        old_hash = stored_hashes.get(hash_key)
        if old_hash is None:
            logger.info(f"  First check - storing initial hash")
            result["change_detected"] = False  # First time, not a "change"
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


def monitor_source(source: dict, stored_hashes: dict) -> list[dict]:
    """Monitor all sections of a single source."""
    results = []
    source_id = source.get("id", "unknown")

    # Get URLs to check
    sections = source.get("sections", [])
    if sections:
        for section in sections:
            section_url = section.get("url", section.get("path", ""))
            section_name = section.get("name", "main")

            # Build full URL if path is relative
            if section_url.startswith("/"):
                section_url = source.get("url", "").rstrip("/") + section_url

            if section_url:
                result = check_single_page(source, section_url, section_name, stored_hashes)
                results.append(result)
                time.sleep(1)  # Rate limiting between sections
    else:
        # Just check main URL
        main_url = source.get("url", "")
        if main_url:
            result = check_single_page(source, main_url, "main", stored_hashes)
            results.append(result)

    return results


def monitor_all_sources(sources: list[dict], stored_hashes: dict, max_workers: int = 3) -> list[dict]:
    """Monitor all sources with rate limiting."""
    all_results = []

    # Process sources sequentially to respect rate limits
    # (We could parallelize, but government sites often have strict limits)
    for i, source in enumerate(sources):
        results = monitor_source(source, stored_hashes)
        all_results.extend(results)

        # Delay between sources
        if i < len(sources) - 1:
            time.sleep(2)

    return all_results


def main():
    parser = argparse.ArgumentParser(description="Monitor web pages for changes")
    parser.add_argument("--tier", type=int, choices=[1, 2, 3, 4, 5], help="Tier to monitor (1-5)")
    parser.add_argument("--all", action="store_true", help="Monitor all tiers")
    parser.add_argument("--dry-run", action="store_true", help="Preview without saving hashes")
    parser.add_argument("--output", type=str, help="Output file path")
    args = parser.parse_args()

    # Determine which tiers to check
    if args.all:
        tiers = [1, 2, 3, 4, 5]
    elif args.tier:
        tiers = [args.tier]
    else:
        tiers = [1]  # Default to Tier 1

    logger.info(f"Monitoring pages for tier(s): {tiers}")

    # Load sources
    sources = load_source_configs(tiers)
    if not sources:
        logger.warning("No webfetch sources found for specified tiers")
        return

    logger.info(f"Found {len(sources)} webfetch sources to monitor")

    # Load stored hashes
    stored_hashes = load_page_hashes()
    logger.info(f"Loaded {len(stored_hashes)} stored page hashes")

    # Monitor all sources
    results = monitor_all_sources(sources, stored_hashes)

    # Prepare output
    changes = [r for r in results if r.get("change_detected")]
    stats = {
        "total_pages": len(results),
        "successful": len([r for r in results if r.get("success")]),
        "failed": len([r for r in results if not r.get("success")]),
        "changes_detected": len(changes)
    }

    output = {
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "tiers": tiers,
        "stats": stats,
        "page_changes": [
            {
                "source_id": r["source_id"],
                "source_name": r["source_name"],
                "section": r["section"],
                "url": r["url"],
                "change_detected": r["change_detected"],
                "notable_links": r.get("notable_links", []),
                "last_checked": r["last_checked"]
            }
            for r in results if r.get("change_detected")
        ],
        "errors": [
            {
                "source_id": r["source_id"],
                "url": r["url"],
                "error": r["error"]
            }
            for r in results if r.get("error")
        ]
    }

    # Update stored hashes (unless dry run)
    if not args.dry_run:
        for result in results:
            if result.get("success") and result.get("new_hash"):
                hash_key = f"{result['source_id']}:{result['section']}"
                stored_hashes[hash_key] = result["new_hash"]
        save_page_hashes(stored_hashes)
        logger.info(f"Updated page hashes saved to {HASHES_FILE}")

    # Write output or merge with existing new_items.json
    output_path = Path(args.output) if args.output else OUTPUT_DIR / "new_items.json"

    if args.dry_run:
        logger.info("=== DRY RUN - Not saving hashes ===")
        print(json.dumps(output, indent=2))
    else:
        # Try to merge with existing new_items.json
        if output_path.exists():
            try:
                with open(output_path) as f:
                    existing = json.load(f)
                # Merge page_changes into existing
                existing["page_changes"] = output["page_changes"]
                existing["page_monitor_stats"] = stats
                with open(output_path, "w") as f:
                    json.dump(existing, f, indent=2)
                logger.info(f"Merged page changes into: {output_path}")
            except (json.JSONDecodeError, IOError):
                # Write standalone output
                with open(output_path, "w") as f:
                    json.dump(output, f, indent=2)
        else:
            with open(output_path, "w") as f:
                json.dump(output, f, indent=2)
            logger.info(f"Output saved to: {output_path}")

    # Summary
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
