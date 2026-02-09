#!/usr/bin/env bash
# Wrapper script for automated TMT legal intelligence fetching.
# Intended to be called by launchd every 6 hours.

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPTS_DIR="$PROJECT_ROOT/scripts"
LOGS_DIR="$PROJECT_ROOT/logs"
LOG_FILE="$LOGS_DIR/fetch-$(date +%Y-%m-%d).log"

mkdir -p "$LOGS_DIR"

echo "=== TMT Fetch started at $(date -u +%Y-%m-%dT%H:%M:%SZ) ===" >> "$LOG_FILE"

# Run RSS fetcher (all tiers)
python3 "$SCRIPTS_DIR/fetch_rss.py" --all >> "$LOG_FILE" 2>&1 || true

# Run page monitor (all tiers)
python3 "$SCRIPTS_DIR/monitor_pages.py" --all >> "$LOG_FILE" 2>&1 || true

echo "=== TMT Fetch finished at $(date -u +%Y-%m-%dT%H:%M:%SZ) ===" >> "$LOG_FILE"
