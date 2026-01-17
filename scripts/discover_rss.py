#!/usr/bin/env python3
"""
RSS Feed Discovery Script
Automatically discovers RSS feeds for all sources by checking common patterns.
"""

import json
import os
import re
import sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urljoin, urlparse
import requests
from bs4 import BeautifulSoup
import feedparser

# Common RSS feed URL patterns to try
RSS_PATTERNS = [
    '/feed/',
    '/feed',
    '/rss/',
    '/rss',
    '/rss.xml',
    '/feed.xml',
    '/atom.xml',
    '/feeds/posts/default',
    '/blog/feed/',
    '/news/feed/',
    '/?feed=rss2',
    '/index.xml',
]

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) RSS Feed Discovery Bot'
}

REQUEST_TIMEOUT = 10


def is_valid_feed(content: str) -> bool:
    """Check if content is a valid RSS/Atom feed."""
    try:
        feed = feedparser.parse(content)
        # Check if it has entries or is a valid feed structure
        if feed.bozo and not feed.entries:
            return False
        if feed.version or feed.entries or feed.feed.get('title'):
            return True
        return False
    except:
        return False


def find_rss_in_html(html: str, base_url: str) -> list:
    """Extract RSS feed URLs from HTML link tags."""
    feeds = []
    try:
        soup = BeautifulSoup(html, 'html.parser')
        # Look for RSS/Atom link tags
        for link in soup.find_all('link', type=re.compile(r'application/(rss|atom)\+xml')):
            href = link.get('href')
            if href:
                full_url = urljoin(base_url, href)
                feeds.append(full_url)

        # Also look for common RSS link patterns in anchors
        for a in soup.find_all('a', href=re.compile(r'(rss|feed|atom)', re.I)):
            href = a.get('href')
            if href and ('rss' in href.lower() or 'feed' in href.lower() or 'atom' in href.lower()):
                full_url = urljoin(base_url, href)
                if full_url not in feeds:
                    feeds.append(full_url)
    except:
        pass
    return feeds


def discover_feed_for_url(base_url: str) -> dict:
    """Try to discover RSS feed for a given URL."""
    result = {
        'url': base_url,
        'feed_url': None,
        'method': None,
        'error': None
    }

    # Normalize URL
    if not base_url.startswith('http'):
        base_url = 'https://' + base_url

    parsed = urlparse(base_url)
    base_domain = f"{parsed.scheme}://{parsed.netloc}"

    feeds_to_try = []

    # First, try to fetch the homepage and look for RSS links in HTML
    try:
        response = requests.get(base_url, headers=HEADERS, timeout=REQUEST_TIMEOUT, allow_redirects=True)
        if response.status_code == 200:
            content_type = response.headers.get('content-type', '').lower()

            # Check if the URL itself is a feed
            if 'xml' in content_type or 'rss' in content_type or 'atom' in content_type:
                if is_valid_feed(response.text):
                    result['feed_url'] = base_url
                    result['method'] = 'direct'
                    return result

            # Extract feeds from HTML
            html_feeds = find_rss_in_html(response.text, base_url)
            feeds_to_try.extend(html_feeds)
    except Exception as e:
        result['error'] = f"Failed to fetch homepage: {str(e)[:50]}"

    # Add common patterns to try
    for pattern in RSS_PATTERNS:
        feeds_to_try.append(urljoin(base_domain, pattern))
        feeds_to_try.append(urljoin(base_url, pattern))

    # Remove duplicates while preserving order
    seen = set()
    unique_feeds = []
    for f in feeds_to_try:
        if f not in seen:
            seen.add(f)
            unique_feeds.append(f)

    # Try each potential feed URL
    for feed_url in unique_feeds:
        try:
            response = requests.get(feed_url, headers=HEADERS, timeout=REQUEST_TIMEOUT, allow_redirects=True)
            if response.status_code == 200:
                if is_valid_feed(response.text):
                    result['feed_url'] = response.url  # Use final URL after redirects
                    result['method'] = 'discovered'
                    return result
        except:
            continue

    return result


def process_source(source: dict) -> dict:
    """Process a single source and try to find its RSS feed."""
    source_id = source.get('id', 'unknown')
    url = source.get('url', '')
    existing_rss = source.get('rss')

    # Skip if already has RSS
    if existing_rss:
        return {
            'id': source_id,
            'url': url,
            'status': 'already_has_rss',
            'rss': existing_rss
        }

    # Skip certain source types that won't have RSS
    source_type = source.get('type', '')
    if source_type in ['court', 'tribunal', 'ministry', 'government']:
        return {
            'id': source_id,
            'url': url,
            'status': 'skipped_type',
            'type': source_type
        }

    print(f"  Checking {source_id}...", end=' ', flush=True)
    result = discover_feed_for_url(url)

    if result['feed_url']:
        print(f"✓ Found: {result['feed_url'][:60]}")
        return {
            'id': source_id,
            'url': url,
            'status': 'found',
            'rss': result['feed_url'],
            'method': result['method']
        }
    else:
        print(f"✗ No feed")
        return {
            'id': source_id,
            'url': url,
            'status': 'not_found',
            'error': result.get('error')
        }


def load_sources(config_dir: Path) -> list:
    """Load all sources from config files."""
    all_sources = []

    for tier_dir in sorted(config_dir.iterdir()):
        if tier_dir.is_dir() and tier_dir.name.startswith('tier'):
            for json_file in tier_dir.glob('*.json'):
                try:
                    with open(json_file) as f:
                        data = json.load(f)
                        sources = data.get('sources', [])
                        for source in sources:
                            source['_tier'] = tier_dir.name
                            source['_file'] = str(json_file)
                        all_sources.extend(sources)
                except Exception as e:
                    print(f"Error loading {json_file}: {e}")

    return all_sources


def update_source_configs(results: list, config_dir: Path):
    """Update source config files with discovered RSS feeds."""
    # Group results by file
    updates_by_file = {}
    for result in results:
        if result['status'] == 'found':
            # Find the source in config files
            for tier_dir in config_dir.iterdir():
                if tier_dir.is_dir() and tier_dir.name.startswith('tier'):
                    for json_file in tier_dir.glob('*.json'):
                        file_path = str(json_file)
                        if file_path not in updates_by_file:
                            updates_by_file[file_path] = []
                        updates_by_file[file_path].append(result)

    # Update each file
    for file_path, updates in updates_by_file.items():
        try:
            with open(file_path) as f:
                data = json.load(f)

            update_ids = {u['id']: u['rss'] for u in updates}
            updated_count = 0

            for source in data.get('sources', []):
                if source.get('id') in update_ids and not source.get('rss'):
                    source['rss'] = update_ids[source['id']]
                    source['method'] = 'rss'
                    updated_count += 1

            if updated_count > 0:
                with open(file_path, 'w') as f:
                    json.dump(data, f, indent=2)
                print(f"Updated {updated_count} sources in {Path(file_path).name}")
        except Exception as e:
            print(f"Error updating {file_path}: {e}")


def main():
    # Find config directory
    script_dir = Path(__file__).parent
    config_dir = script_dir.parent / 'sources' / 'config'

    if not config_dir.exists():
        print(f"Config directory not found: {config_dir}")
        sys.exit(1)

    print("=" * 60)
    print("RSS Feed Discovery Script")
    print("=" * 60)

    # Load all sources
    print("\nLoading sources...")
    sources = load_sources(config_dir)
    print(f"Loaded {len(sources)} sources")

    # Filter sources that might have RSS
    eligible_sources = [s for s in sources if not s.get('rss') and
                       s.get('type') not in ['court', 'tribunal']]
    print(f"Checking {len(eligible_sources)} sources without RSS feeds")

    # Process sources
    print("\n" + "-" * 60)
    results = []

    # Use threading for faster processing
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(process_source, s): s for s in eligible_sources}
        for future in as_completed(futures):
            try:
                result = future.result()
                results.append(result)
            except Exception as e:
                print(f"Error: {e}")

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)

    found = [r for r in results if r['status'] == 'found']
    not_found = [r for r in results if r['status'] == 'not_found']
    already_has = [r for r in results if r['status'] == 'already_has_rss']
    skipped = [r for r in results if r['status'] == 'skipped_type']

    print(f"\nRSS feeds found: {len(found)}")
    print(f"No RSS feed: {len(not_found)}")
    print(f"Already had RSS: {len(already_has)}")
    print(f"Skipped (court/govt): {len(skipped)}")

    if found:
        print("\n" + "-" * 60)
        print("DISCOVERED RSS FEEDS:")
        print("-" * 60)
        for r in found:
            print(f"  {r['id']}: {r['rss']}")

    # Save results to file
    if found:
        output_file = script_dir / 'discovered_feeds.json'
        with open(output_file, 'w') as f:
            json.dump(found, f, indent=2)
        print(f"\nResults saved to {output_file}")

        # Auto-update if --update flag is passed
        if len(sys.argv) > 1 and sys.argv[1] == '--update':
            update_source_configs(found, config_dir)
            print("\nConfig files updated automatically.")


if __name__ == '__main__':
    main()
