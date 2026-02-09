import { NextResponse } from "next/server";
import { initializeDatabase, getDatabase } from "@/lib/db/database";

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

    const db = getDatabase();

    // Get websearch pending sources from the queue
    const websearchPending = db.prepare(`
      SELECT
        wq.source_id,
        s.name as source_name,
        COALESCE(s.search_query, 'site:' || s.url) as query
      FROM websearch_queue wq
      JOIN sources s ON wq.source_id = s.id
      WHERE wq.processed = 0
    `).all() as { source_id: string; source_name: string; query: string }[];

    // Get page hashes for monitoring (sources using webfetch method)
    const pageChanges = db.prepare(`
      SELECT
        ph.source_id,
        s.name as source_name,
        s.url,
        ph.content_hash,
        ph.last_checked,
        0 as change_detected
      FROM page_hashes ph
      JOIN sources s ON ph.source_id = s.id
      WHERE s.method = 'webfetch'
      ORDER BY ph.last_checked DESC
    `).all();

    return NextResponse.json({
      page_changes: pageChanges,
      websearch_pending: websearchPending,
    });
  } catch (error) {
    console.error("Error fetching monitor data:", error);
    return NextResponse.json(
      { error: "Failed to fetch monitor data" },
      { status: 500 }
    );
  }
}
