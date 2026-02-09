#!/bin/bash

# TMT Legal Intelligence Dashboard Startup Script
# This script starts the Next.js dashboard

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DASHBOARD_DIR="$SCRIPT_DIR/dashboard"

echo "=================================="
echo "TMT Legal Intelligence Dashboard"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -d "$DASHBOARD_DIR" ]; then
    echo "Error: dashboard directory not found at $DASHBOARD_DIR"
    exit 1
fi

cd "$DASHBOARD_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Check if database exists, if not run migration
DB_PATH="$SCRIPT_DIR/sources/state/tmt_intelligence.db"
if [ ! -f "$DB_PATH" ]; then
    echo "Database not found. Running migration..."
    npx tsx scripts/migrate-to-sqlite.ts
fi

echo ""
echo "Starting dashboard at http://localhost:3000"
echo "Press Ctrl+C to stop"
echo ""

# Start the Next.js dev server
npm run dev
