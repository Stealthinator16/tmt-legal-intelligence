import { NextResponse } from "next/server";
import { initializeDatabase, getDatabase } from "@/lib/db/database";
import { getSourceStats } from "@/lib/db/sources";
import { getItemStats, getUnreadCountBySource } from "@/lib/db/items";
import { DashboardStats } from "@/types/item";

// Initialize database on first request
let initialized = false;
function ensureInitialized() {
  if (!initialized) {
    initializeDatabase();
    initialized = true;
  }
}

export async function GET() {
  try {
    ensureInitialized();

    const sourceStats = getSourceStats();
    const itemStats = getItemStats();
    const unreadBySource = getUnreadCountBySource();

    // Get websearch queue count
    const db = getDatabase();
    const websearchPending = (db.prepare(`
      SELECT COUNT(*) as count FROM websearch_queue WHERE processed = 0
    `).get() as { count: number }).count;

    // Get last fetch time from sources table
    const lastFetch = db.prepare(`
      SELECT MAX(last_fetch) as last FROM sources WHERE last_fetch IS NOT NULL
    `).get() as { last: string | null };

    const stats: DashboardStats = {
      totalSources: sourceStats.total,
      enabledSources: sourceStats.enabled,
      sourcesByTier: sourceStats.byTier,
      sourcesByMethod: sourceStats.byMethod,
      newItemsToday: itemStats.today,
      totalItems: itemStats.total,
      pageChanges: 0, // Not tracking page changes separately anymore
      websearchPending,
      lastFetchedAt: lastFetch.last,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
