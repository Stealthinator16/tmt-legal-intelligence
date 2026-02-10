#!/usr/bin/env python3
"""
Web Search for TMT Legal Intelligence

Placeholder script for websearch sources. Websearch sources are processed
by Claude's WebSearch tool manually. This script populates the
websearch_queue table so the dashboard can show pending sources.

Usage:
    python websearch.py --tier=1              # Queue websearch sources for Tier 1
    python websearch.py --source=source_id    # Queue specific websearch source
"""

import argparse
import json
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path

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


def load_websearch_sources(tiers: list[int], source_id: str = None) -> list[dict]:
    """Load websearch source configurations for specified tiers."""
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
                    websearch_sources = [
                        s for s in config.get("sources", [])
                        if s.get("method") == "websearch" and s.get("enabled", True)
                    ]
                    if source_id:
                        websearch_sources = [s for s in websearch_sources if s.get("id") == source_id]
                    for source in websearch_sources:
                        source["tier"] = tier
                    sources.extend(websearch_sources)
            except (json.JSONDecodeError, KeyError) as e:
                logger.error(f"Error loading {config_file}: {e}")

    return sources


def main():
    parser = argparse.ArgumentParser(description="Web search source handler")
    parser.add_argument("--tier", type=int, choices=[1, 2, 3, 4, 5], help="Tier to check (1-5)")
    parser.add_argument("--source", type=str, help="Specific source ID to check")
    args = parser.parse_args()

    if args.tier:
        tiers = [args.tier]
    elif args.source:
        tiers = [1, 2, 3, 4, 5]
    else:
        tiers = [1]

    if args.source:
        logger.info(f"Identifying websearch source: {args.source}")
    else:
        logger.info(f"Identifying websearch sources for tier(s): {tiers}")

    sources = load_websearch_sources(tiers, source_id=args.source)
    if not sources:
        if args.source:
            logger.warning(f"Source '{args.source}' not found or not a websearch source")
        else:
            logger.warning("No websearch sources found for specified tiers")
        return

    logger.info(f"Found {len(sources)} websearch sources")
    logger.info("=" * 50)
    logger.info("NOTICE: WebSearch sources require manual processing with Claude's WebSearch tool.")
    logger.info("=" * 50)

    conn = db.get_connection()
    for source in sources:
        logger.info(f"  - {source.get('name', source.get('id'))}")
        if source.get("search_query"):
            logger.info(f"    Query: {source['search_query']}")

        # Add to websearch queue
        conn.execute(
            "INSERT OR IGNORE INTO websearch_queue (source_id) VALUES (?)",
            (source["id"],),
        )

    conn.commit()
    conn.close()
    logger.info(f"Queued {len(sources)} sources for manual WebSearch processing")


if __name__ == "__main__":
    main()
