#!/usr/bin/env python3
"""
RSS Feed Fetcher for TMT Legal Intelligence

Fetches RSS feeds from configured sources and writes items directly
to tmt_intelligence.db via the shared db module.

Usage:
    python fetch_rss.py --tier=1              # Fetch Tier 1 RSS sources
    python fetch_rss.py --source=source_id    # Fetch specific RSS source
    python fetch_rss.py --tier=1 --dry-run    # Preview without saving
    python fetch_rss.py --all                 # Fetch all tiers with RSS
"""

import argparse
import hashlib
import json
import logging
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    import feedparser
    import requests
except ImportError:
    print("Error: Required packages not installed. Run: pip install feedparser requests")
    sys.exit(1)

import db

# Request settings
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) TMT-Legal-Intelligence/1.0",
    "Accept": "application/rss+xml, application/xml, text/xml, */*"
}
REQUEST_TIMEOUT = 30

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


def content_hash(text: str) -> str:
    """Generate SHA256 hash of content for deduplication."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


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
                    # Filter for RSS sources only
                    rss_sources = [
                        s for s in config.get("sources", [])
                        if s.get("method") == "rss" and s.get("enabled", True)
                    ]
                    # If source_id specified, filter to that source only
                    if source_id:
                        rss_sources = [s for s in rss_sources if s.get("id") == source_id]
                    for source in rss_sources:
                        source["tier"] = tier
                    sources.extend(rss_sources)
            except (json.JSONDecodeError, KeyError) as e:
                logger.error(f"Error loading {config_file}: {e}")

    return sources


def fetch_single_feed(source: dict) -> dict[str, Any]:
    """Fetch a single RSS feed and return parsed items."""
    source_id = source.get("id", "unknown")
    rss_url = source.get("rss", source.get("url"))
    filter_keywords = source.get("filter_keywords", [])

    result = {
        "source_id": source_id,
        "source_name": source.get("name", source_id),
        "url": rss_url,
        "success": False,
        "items": [],
        "error": None
    }

    try:
        logger.info(f"Fetching: {source_id} ({rss_url})")

        # Use requests library for better SSL handling (especially on macOS)
        response = requests.get(rss_url, headers=HEADERS, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()

        # Parse the fetched content with feedparser
        feed = feedparser.parse(response.content)

        if feed.bozo and not feed.entries:
            result["error"] = f"Feed error: {feed.bozo_exception}"
            return result

        for entry in feed.entries:
            title = entry.get("title", "")
            link = entry.get("link", "")
            summary = entry.get("summary", entry.get("description", ""))
            published = entry.get("published", entry.get("updated", ""))

            # Apply keyword filter if specified
            if filter_keywords:
                text_to_search = f"{title} {summary}".lower()
                if not any(kw.lower() in text_to_search for kw in filter_keywords):
                    continue

            # Clean up summary (remove HTML, truncate)
            if summary:
                summary = re.sub(r"<[^>]+>", "", summary)
                summary = summary[:300] + "..." if len(summary) > 300 else summary

            # Normalize published date to ISO format
            published_iso = ""
            if published:
                try:
                    from email.utils import parsedate_to_datetime
                    published_iso = parsedate_to_datetime(published).isoformat()
                except Exception:
                    try:
                        from dateutil.parser import parse as dateparse
                        published_iso = dateparse(published).isoformat()
                    except Exception:
                        published_iso = published

            result["items"].append({
                "title": title,
                "url": link,
                "published": published_iso,
                "snippet": summary,
                "focus_areas": source.get("focus_areas", []),
                "content_hash": content_hash(title + (summary or "")),
            })

        result["success"] = True
        logger.info(f"  Found {len(result['items'])} items from {source_id}")

    except Exception as e:
        result["error"] = str(e)
        logger.error(f"  Error fetching {source_id}: {e}")

    return result


def fetch_all_feeds(sources: list[dict], max_workers: int = 5, delay: float = 1.0) -> list[dict]:
    """Fetch all RSS feeds with rate limiting."""
    results = []

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {}
        for i, source in enumerate(sources):
            # Stagger submissions to avoid hammering servers
            if i > 0:
                time.sleep(delay / max_workers)
            futures[executor.submit(fetch_single_feed, source)] = source

        for future in as_completed(futures):
            result = future.result()
            results.append(result)

    return results


def main():
    parser = argparse.ArgumentParser(description="Fetch RSS feeds for TMT Legal Intelligence")
    parser.add_argument("--tier", type=int, choices=[1, 2, 3, 4, 5], help="Tier to fetch (1-5)")
    parser.add_argument("--all", action="store_true", help="Fetch all tiers")
    parser.add_argument("--source", type=str, help="Fetch specific source by ID")
    parser.add_argument("--dry-run", action="store_true", help="Preview without saving to database")
    args = parser.parse_args()

    # Determine which tiers to fetch
    if args.all:
        tiers = [1, 2, 3, 4, 5]
    elif args.tier:
        tiers = [args.tier]
    elif args.source:
        tiers = [1, 2, 3, 4, 5]
    else:
        tiers = [1]  # Default to Tier 1

    if args.source:
        logger.info(f"Fetching specific RSS source: {args.source}")
    else:
        logger.info(f"Fetching RSS feeds for tier(s): {tiers}")

    # Load sources
    sources = load_source_configs(tiers, source_id=args.source)
    if not sources:
        if args.source:
            logger.warning(f"Source '{args.source}' not found or not an RSS source")
        else:
            logger.warning("No RSS sources found for specified tiers")
        return

    logger.info(f"Found {len(sources)} RSS sources to fetch")

    # Fetch all feeds
    results = fetch_all_feeds(sources)

    # Open DB connection
    conn = db.get_connection()

    # Process results
    fetch_stats = {
        "total_sources": len(sources),
        "successful": 0,
        "failed": 0,
        "total_items": 0,
        "new_items": 0
    }

    for result in results:
        source_id = result["source_id"]

        if result["success"]:
            fetch_stats["successful"] += 1
            fetch_stats["total_items"] += len(result["items"])

            new_count = 0
            for item in result["items"]:
                url = item.get("url", "")
                if not url:
                    continue

                if args.dry_run:
                    if not db.item_exists(conn, url):
                        new_count += 1
                    continue

                if not db.item_exists(conn, url):
                    db.insert_item(
                        conn,
                        url=url,
                        title=item.get("title", ""),
                        snippet=item.get("snippet", ""),
                        source_id=source_id,
                        published=item.get("published", ""),
                        focus_areas=item.get("focus_areas"),
                        content_hash=item.get("content_hash"),
                    )
                    new_count += 1

            fetch_stats["new_items"] += new_count

            if not args.dry_run:
                db.update_source_last_fetch(conn, source_id)
                db.clear_source_error(conn, source_id)
                conn.commit()
        else:
            fetch_stats["failed"] += 1
            logger.warning(f"Failed: {source_id} - {result['error']}")
            if not args.dry_run:
                db.record_source_error(conn, source_id, result["error"] or "Unknown error")
                conn.commit()

    conn.close()

    # Summary
    if args.dry_run:
        logger.info("=== DRY RUN - No changes written ===")
    logger.info("=" * 50)
    logger.info(f"Fetch complete!")
    logger.info(f"  Sources checked: {fetch_stats['total_sources']}")
    logger.info(f"  Successful: {fetch_stats['successful']}")
    logger.info(f"  Failed: {fetch_stats['failed']}")
    logger.info(f"  Total items found: {fetch_stats['total_items']}")
    logger.info(f"  NEW items: {fetch_stats['new_items']}")


if __name__ == "__main__":
    main()
