Execute the `/gather` intelligence gathering workflow as defined in CLAUDE.md.

Arguments: $ARGUMENTS

If no arguments provided, run Tier 1 (critical sources).
If `--tier=N` provided, include sources up to that tier.
If `--focus=<area>` provided, filter by that focus area.

Follow ALL steps in CLAUDE.md for the `/gather` command, including:
1. Read `brief_state` table in `tmt_intelligence.db` for last_brief_date
2. Query `items` table for recent items (since last brief)
3. Check `page_hashes` table for recently changed pages, WebFetch only changed pages
4. Run date-restricted WebSearch for pending sources (only items after last_brief_date)
5. Filter out already-reported items from `brief_state` table
6. Save findings to `sources/downloaded/YYYY-MM-DD_findings.json`
7. Report summary to user
