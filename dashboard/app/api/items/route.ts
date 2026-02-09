import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/db/database";
import { getItems, getTodayItems, markItemRead, markItemStarred, markAllRead, getUnreadCountBySource } from "@/lib/db/items";

// Initialize database on first request
let initialized = false;
function ensureInitialized() {
  if (!initialized) {
    initializeDatabase();
    initialized = true;
  }
}

export async function GET(request: NextRequest) {
  try {
    ensureInitialized();

    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get("source");
    const focusArea = searchParams.get("focus_area");
    const read = searchParams.get("read");
    const starred = searchParams.get("starred");
    const since = searchParams.get("since");
    const today = searchParams.get("today");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // If asking for today's items specifically
    if (today === "true") {
      const { items, total } = getTodayItems();
      return NextResponse.json({ items, total, limit: 200, offset: 0 });
    }

    const { items, total } = getItems({
      sourceId: sourceId || undefined,
      focusArea: focusArea || undefined,
      read: read !== null ? read === "true" : undefined,
      starred: starred !== null ? starred === "true" : undefined,
      since: since || undefined,
      limit,
      offset,
    });

    return NextResponse.json({ items, total, limit, offset });
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    ensureInitialized();

    const body = await request.json();
    const { action, itemId, sourceId, value } = body;

    switch (action) {
      case "markRead":
        markItemRead(itemId, value !== false);
        break;
      case "markStarred":
        markItemStarred(itemId, value !== false);
        break;
      case "markAllRead":
        markAllRead(sourceId || undefined);
        break;
      default:
        return NextResponse.json(
          { error: "Unknown action" },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}
