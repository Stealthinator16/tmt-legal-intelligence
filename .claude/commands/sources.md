List configured sources from the TMT legal intelligence system.

Arguments: $ARGUMENTS

If no arguments: show summary of all tiers
If `--tier=N`: show sources for that specific tier
If `--category=<cat>`: show sources for that category

Read source configs from `sources/config/` and display:
- Source name and URL
- Type (regulator, court, blog, etc.)
- Method (rss, webfetch, websearch)
- Enabled/disabled status
