Generate today's intelligence brief following the `/brief` workflow in CLAUDE.md.

CRITICAL: Only report genuinely NEW items since last brief.

Steps:
1. Read `brief_state` table in `tmt_intelligence.db` for `last_brief_date` and `reported_items`
2. Query `items` table for items since last brief date
3. EXCLUDE any item whose URL appears in `reported_items`
4. EXCLUDE any item with published date before `last_brief_date`
5. Generate brief with ONLY new items
6. If nothing new: say "No new developments since [last_brief_date]"
7. Update `brief_state` table with newly reported items and today's date
8. Save brief to `summaries/daily/YYYY-MM-DD_daily-brief.md`
