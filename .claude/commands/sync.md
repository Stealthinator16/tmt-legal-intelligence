Explain how to manually trigger source fetching via GitHub Actions or locally.

Tell the user:

**Option 1: Run Locally (Recommended)**
```bash
bash scripts/run-fetch.sh
```
This runs both `fetch_rss.py --all` and `monitor_pages.py --all`, writing directly to `tmt_intelligence.db`.

**Option 2: Run Individual Scripts**
```bash
python3 scripts/fetch_rss.py --tier=1
python3 scripts/monitor_pages.py --tier=1
```

**Option 3: GitHub Actions (Manual Dispatch)**
1. Go to the GitHub repo → Actions tab
2. Select "Gather Legal Intelligence Sources" workflow
3. Click "Run workflow" → Select tier → Run
4. Wait ~2-3 minutes for completion

**Note:** Local launchd automation (`com.tmt-legal.fetch`) runs every 6 hours automatically.
Then run `/gather` to review new items with WebSearch for government sources.
