#!/usr/bin/env python3
"""
Web Search for TMT Legal Intelligence

Placeholder script for websearch sources. Currently websearch sources
are expected to be processed by Claude's WebSearch tool manually.

This script exists to satisfy the executor's requirements but does not
actually perform web searches (which require API keys and services).

Usage:
    python websearch.py --tier=1              # Identify websearch sources for Tier 1
    python websearch.py --source=source_id    # Identify specific websearch source
"""

import argparse
import json
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path

# Setup paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
SOURCES_CONFIG_DIR = PROJECT_ROOT / "sources" / "config"
OUTPUT_DIR = PROJECT_ROOT / "sources" / "downloaded"

# Ensure directories exist
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

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
                    # Filter for websearch sources only
                    websearch_sources = [
                        s for s in config.get("sources", [])
                        if s.get("method") == "websearch" and s.get("enabled", True)
                    ]
                    # If source_id specified, filter to that source only
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
    parser.add_argument("--output", type=str, help="Output file path")
    args = parser.parse_args()

    # Determine which tiers to check
    if args.tier:
        tiers = [args.tier]
    elif args.source:
        # When checking a specific source, check all tiers
        tiers = [1, 2, 3, 4, 5]
    else:
        tiers = [1]  # Default to Tier 1

    if args.source:
        logger.info(f"Identifying websearch source: {args.source}")
    else:
        logger.info(f"Identifying websearch sources for tier(s): {tiers}")

    # Load sources
    sources = load_websearch_sources(tiers, source_id=args.source)
    if not sources:
        if args.source:
            logger.warning(f"Source '{args.source}' not found or not a websearch source")
        else:
            logger.warning("No websearch sources found for specified tiers")

        # Write empty output
        output_path = Path(args.output) if args.output else OUTPUT_DIR / "new_items.json"
        output = {
            "fetched_at": datetime.now(timezone.utc).isoformat(),
            "tiers": tiers,
            "items": [],
            "websearch_pending": []
        }

        # Try to merge with existing new_items.json
        if output_path.exists():
            try:
                with open(output_path) as f:
                    existing = json.load(f)
                existing["websearch_pending"] = []
                with open(output_path, "w") as f:
                    json.dump(existing, f, indent=2)
            except (json.JSONDecodeError, IOError):
                with open(output_path, "w") as f:
                    json.dump(output, f, indent=2)
        else:
            with open(output_path, "w") as f:
                json.dump(output, f, indent=2)

        return

    logger.info(f"Found {len(sources)} websearch sources")
    logger.info("=" * 50)
    logger.info("NOTICE: WebSearch sources require manual processing with Claude's WebSearch tool.")
    logger.info("These sources cannot be automatically fetched due to search API requirements.")
    logger.info("=" * 50)

    for source in sources:
        logger.info(f"  - {source.get('name', source.get('id'))}")
        if source.get('search_query'):
            logger.info(f"    Query: {source['search_query']}")

    # Create output indicating these sources need manual processing
    output_path = Path(args.output) if args.output else OUTPUT_DIR / "new_items.json"

    # Create informational feed items for websearch sources
    feed_items = []
    for source in sources:
        feed_items.append({
            "url": source.get("url", ""),
            "title": f"Check: {source.get('name', source['id'])}",
            "snippet": f"WebSearch source - use search query: {source.get('search_query', 'manual search required')}",
            "source_id": source["id"],
            "source_name": source.get("name", source["id"]),
            "published": datetime.now(timezone.utc).isoformat(),
            "focus_areas": source.get("focus_areas", ["all"])
        })

    output = {
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "tiers": tiers,
        "items": feed_items,
        "websearch_pending": [s["id"] for s in sources],
        "websearch_sources": [
            {
                "id": s["id"],
                "name": s.get("name", s["id"]),
                "search_query": s.get("search_query", ""),
                "url": s.get("url", "")
            }
            for s in sources
        ]
    }

    # Try to merge with existing new_items.json
    if output_path.exists():
        try:
            with open(output_path) as f:
                existing = json.load(f)
            # Merge items and websearch info
            existing_items = existing.get("items", [])
            existing_items.extend(output["items"])
            existing["items"] = existing_items
            existing["websearch_pending"] = output["websearch_pending"]
            existing["websearch_sources"] = output["websearch_sources"]
            with open(output_path, "w") as f:
                json.dump(existing, f, indent=2)
            logger.info(f"Updated websearch info with {len(output['items'])} items in: {output_path}")
        except (json.JSONDecodeError, IOError):
            with open(output_path, "w") as f:
                json.dump(output, f, indent=2)
            logger.info(f"Created output: {output_path}")
    else:
        with open(output_path, "w") as f:
            json.dump(output, f, indent=2)
        logger.info(f"Created output: {output_path}")


if __name__ == "__main__":
    main()
