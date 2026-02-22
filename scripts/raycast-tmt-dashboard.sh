#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title TMT Dashboard
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 📡
# @raycast.packageName TMT Legal Intelligence

PORT=3100
DASHBOARD_DIR="$(dirname "$0")/../dashboard"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

# Check if already running
if curl -s -o /dev/null -w "" "http://localhost:$PORT" 2>/dev/null; then
  open "http://localhost:$PORT"
  echo "Opened dashboard."
  exit 0
fi

# Start server in background
cd "$DASHBOARD_DIR"
if [ ! -d ".next" ]; then
  npm run build > /dev/null 2>&1
fi
nohup npm run start -- --port $PORT > /dev/null 2>&1 &

# Wait for it to come up
for i in {1..20}; do
  sleep 0.5
  if curl -s -o /dev/null -w "" "http://localhost:$PORT" 2>/dev/null; then
    open "http://localhost:$PORT"
    echo "Started and opened dashboard."
    exit 0
  fi
done

echo "Failed to start dashboard."
exit 1
