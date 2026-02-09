import { NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/db/database";
import { getAllSources, getSourcesWithErrors } from "@/lib/db/sources";
import { getUnreadCount, getUnreadCountBySource, getItemStats } from "@/lib/db/items";

// Initialize database on first request
let initialized = false;
function ensureInitialized() {
  if (!initialized) {
    initializeDatabase();
    initialized = true;
  }
}

export interface SidebarSource {
  id: string;
  name: string;
  tier: number;
  method: string;
  enabled: boolean;
  blocklisted: boolean;
  hasError: boolean;
  unreadCount: number;
}

export interface SidebarData {
  todayCount: number;
  unreadCount: number;
  starredCount: number;
  sourcesByTier: Record<number, SidebarSource[]>;
  sourcesWithErrors: string[];
}

export async function GET() {
  try {
    ensureInitialized();

    const sources = getAllSources({ enabled: true, blocklisted: false });
    const sourcesWithErrors = getSourcesWithErrors();
    const unreadBySource = getUnreadCountBySource();
    const itemStats = getItemStats();

    const errorSourceIds = new Set(sourcesWithErrors.map((s) => s.id));

    // Group sources by tier
    const sourcesByTier: Record<number, SidebarSource[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };

    for (const source of sources) {
      const tier = source.tier || 3;
      if (!sourcesByTier[tier]) sourcesByTier[tier] = [];

      sourcesByTier[tier].push({
        id: source.id,
        name: source.name,
        tier,
        method: source.method,
        enabled: source.enabled,
        blocklisted: source.blocklisted || false,
        hasError: errorSourceIds.has(source.id),
        unreadCount: unreadBySource[source.id] || 0,
      });
    }

    // Sort sources within each tier by unread count (desc) then name (asc)
    for (const tier of Object.keys(sourcesByTier)) {
      sourcesByTier[parseInt(tier)].sort((a, b) => {
        if (b.unreadCount !== a.unreadCount) {
          return b.unreadCount - a.unreadCount;
        }
        return a.name.localeCompare(b.name);
      });
    }

    const sidebarData: SidebarData = {
      todayCount: itemStats.today,
      unreadCount: itemStats.unread,
      starredCount: itemStats.starred,
      sourcesByTier,
      sourcesWithErrors: Array.from(errorSourceIds),
    };

    return NextResponse.json(sidebarData);
  } catch (error) {
    console.error("Error fetching sidebar data:", error);
    return NextResponse.json(
      { error: "Failed to fetch sidebar data" },
      { status: 500 }
    );
  }
}
