Explain how to manually trigger source fetching via GitHub Actions or locally.

Tell the user:

**Option 1: GitHub Actions (Recommended)**
1. Go to the GitHub repo → Actions tab
2. Select "Gather Legal Intelligence Sources" workflow
3. Click "Run workflow" → Select tier → Run
4. Wait ~2-3 minutes for completion
5. Run `git pull` to get the updated data
6. Then run `/gather` to process the fresh data

**Option 2: Run Locally**
```bash
cd scripts
pip install -r requirements.txt
python fetch_rss.py --tier=1
python monitor_pages.py --tier=1
```

Then run `/gather` to process the results.
