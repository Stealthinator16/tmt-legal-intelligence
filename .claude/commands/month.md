Generate monthly summary following the `/month` workflow in CLAUDE.md.

Steps:
1. Read all weekly summaries from `summaries/weekly/` for the past month
2. Read previous month's summary from `summaries/monthly/` for context
3. Create comprehensive monthly overview with:
   - Major legislative/regulatory developments
   - Key court decisions
   - International trends
   - Upcoming deadlines
4. Save to `summaries/monthly/YYYY-MM_monthly-summary.md`
