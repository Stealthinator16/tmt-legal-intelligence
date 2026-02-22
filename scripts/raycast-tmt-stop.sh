#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title TMT Dashboard Stop
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 🛑
# @raycast.packageName TMT Legal Intelligence

pids=$(lsof -ti:3100 2>/dev/null)
if [ -z "$pids" ]; then
  echo "Dashboard not running."
else
  echo "$pids" | xargs kill
  echo "Dashboard stopped."
fi
