Execute the `/gather` intelligence gathering workflow as defined in CLAUDE.md.

Arguments: $ARGUMENTS

If no arguments provided, run Tier 1 (critical sources).
If `--tier=N` provided, include sources up to that tier.
If `--focus=<area>` provided, filter by that focus area.

Follow ALL steps in CLAUDE.md for the `/gather` command, including:
1. Read `sources/state/brief_state.json` to know the last brief date
2. Read `sources/downloaded/new_items.json` for pre-fetched RSS items
3. Check `page_changes` array and WebFetch only changed pages
4. Run date-restricted WebSearch for pending sources (only items after last_brief_date)
5. Filter out already-reported items from `brief_state.json`
6. Save findings to `sources/downloaded/YYYY-MM-DD_findings.json`
7. Report summary to user
