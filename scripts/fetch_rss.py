#!/usr/bin/env python3
"""
RSS Feed Fetcher for TMT Legal Intelligence

Fetches RSS feeds from configured sources, tracks seen items in SQLite,
and outputs new items to a JSON file for Claude to process.

Usage:
    python fetch_rss.py --tier=1              # Fetch Tier 1 RSS sources
    python fetch_rss.py --tier=1 --dry-run    # Preview without saving
    python fetch_rss.py --all                 # Fetch all tiers with RSS
"""

import argparse
import hashlib
import json
import logging
import os
import sqlite3
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
STATE_DIR = PROJECT_ROOT / "sources" / "state"
OUTPUT_DIR = PROJECT_ROOT / "sources" / "downloaded"

# Ensure directories exist
STATE_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Database path
DB_PATH = STATE_DIR / "seen_items.db"

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)


def init_database() -> sqlite3.Connection:
    """Initialize SQLite database for tracking seen items."""
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS seen_items (
            url TEXT PRIMARY KEY,
            title TEXT,
            source_id TEXT,
            content_hash TEXT,
            first_seen TEXT,
            published TEXT
        )
    """)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_source_id ON seen_items(source_id)
    """)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_first_seen ON seen_items(first_seen)
    """)
    conn.commit()
    return conn


def content_hash(text: str) -> str:
    """Generate SHA256 hash of content for deduplication."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


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
                    # Filter for RSS sources only
                    rss_sources = [
                        s for s in config.get("sources", [])
                        if s.get("method") == "rss" and s.get("enabled", True)
                    ]
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
                # Basic HTML stripping
                import re
                summary = re.sub(r"<[^>]+>", "", summary)
                summary = summary[:300] + "..." if len(summary) > 300 else summary

            result["items"].append({
                "title": title,
                "url": link,
                "published": published,
                "snippet": summary,
                "focus_areas": source.get("focus_areas", [])
            })

        result["success"] = True
        logger.info(f"  Found {len(result['items'])} items from {source_id}")

    except Exception as e:
        result["error"] = str(e)
        logger.error(f"  Error fetching {source_id}: {e}")

    return result


def filter_new_items(conn: sqlite3.Connection, items: list[dict], source_id: str) -> list[dict]:
    """Filter out items that have already been seen."""
    new_items = []
    cursor = conn.cursor()

    for item in items:
        url = item.get("url", "")
        if not url:
            continue

        cursor.execute("SELECT url FROM seen_items WHERE url = ?", (url,))
        if cursor.fetchone() is None:
            new_items.append(item)

    return new_items


def mark_items_seen(conn: sqlite3.Connection, items: list[dict], source_id: str):
    """Mark items as seen in the database."""
    now = datetime.now(timezone.utc).isoformat()

    for item in items:
        url = item.get("url", "")
        if not url:
            continue

        try:
            conn.execute("""
                INSERT OR IGNORE INTO seen_items (url, title, source_id, content_hash, first_seen, published)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                url,
                item.get("title", ""),
                source_id,
                content_hash(item.get("title", "") + item.get("snippet", "")),
                now,
                item.get("published", "")
            ))
        except sqlite3.Error as e:
            logger.error(f"Database error marking item seen: {e}")

    conn.commit()


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
    parser.add_argument("--dry-run", action="store_true", help="Preview without saving to database")
    parser.add_argument("--output", type=str, help="Output file path (default: new_items.json)")
    args = parser.parse_args()

    # Determine which tiers to fetch
    if args.all:
        tiers = [1, 2, 3, 4, 5]
    elif args.tier:
        tiers = [args.tier]
    else:
        tiers = [1]  # Default to Tier 1

    logger.info(f"Fetching RSS feeds for tier(s): {tiers}")

    # Load sources
    sources = load_source_configs(tiers)
    if not sources:
        logger.warning("No RSS sources found for specified tiers")
        return

    logger.info(f"Found {len(sources)} RSS sources to fetch")

    # Initialize database
    conn = init_database()

    # Fetch all feeds
    results = fetch_all_feeds(sources)

    # Process results and filter new items
    all_new_items = []
    fetch_stats = {
        "total_sources": len(sources),
        "successful": 0,
        "failed": 0,
        "total_items": 0,
        "new_items": 0
    }

    for result in results:
        if result["success"]:
            fetch_stats["successful"] += 1
            fetch_stats["total_items"] += len(result["items"])

            # Filter to new items only
            new_items = filter_new_items(conn, result["items"], result["source_id"])
            fetch_stats["new_items"] += len(new_items)

            for item in new_items:
                item["source_id"] = result["source_id"]
                item["source_name"] = result["source_name"]
                item["method"] = "rss"
                all_new_items.append(item)

            # Mark as seen (unless dry run)
            if not args.dry_run:
                mark_items_seen(conn, new_items, result["source_id"])
        else:
            fetch_stats["failed"] += 1
            logger.warning(f"Failed: {result['source_id']} - {result['error']}")

    conn.close()

    # Generate output
    output = {
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "tiers": tiers,
        "stats": fetch_stats,
        "new_items_count": len(all_new_items),
        "items": all_new_items,
        "page_changes": [],  # Will be populated by monitor_pages.py
        "websearch_pending": []  # Sources that need Claude's WebSearch
    }

    # Identify websearch sources for this tier (for Claude to process)
    for tier in tiers:
        tier_dirs = {1: "tier1-critical", 2: "tier2-high", 3: "tier3-standard", 4: "tier4-regular", 5: "tier5-periodic"}
        tier_dir = SOURCES_CONFIG_DIR / tier_dirs.get(tier, "")
        if tier_dir.exists():
            for config_file in tier_dir.glob("*.json"):
                try:
                    with open(config_file) as f:
                        config = json.load(f)
                        websearch_sources = [
                            s["id"] for s in config.get("sources", [])
                            if s.get("method") == "websearch" and s.get("enabled", True)
                        ]
                        output["websearch_pending"].extend(websearch_sources)
                except Exception:
                    pass

    # Write output
    output_path = Path(args.output) if args.output else OUTPUT_DIR / "new_items.json"

    if args.dry_run:
        logger.info("=== DRY RUN - Not saving to database ===")
        print(json.dumps(output, indent=2))
    else:
        with open(output_path, "w") as f:
            json.dump(output, f, indent=2)
        logger.info(f"Output saved to: {output_path}")

    # Summary
    logger.info("=" * 50)
    logger.info(f"Fetch complete!")
    logger.info(f"  Sources checked: {fetch_stats['total_sources']}")
    logger.info(f"  Successful: {fetch_stats['successful']}")
    logger.info(f"  Failed: {fetch_stats['failed']}")
    logger.info(f"  Total items found: {fetch_stats['total_items']}")
    logger.info(f"  NEW items: {fetch_stats['new_items']}")


if __name__ == "__main__":
    main()
