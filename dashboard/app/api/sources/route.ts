import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/db/database";
import { getAllSources, createSource, getSourceStats } from "@/lib/db/sources";
import { SourceMethod } from "@/types/source";

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
    const tier = searchParams.get("tier");
    const method = searchParams.get("method") as SourceMethod | null;
    const enabled = searchParams.get("enabled");
    const blocklisted = searchParams.get("blocklisted");
    const search = searchParams.get("search");

    const sources = getAllSources({
      tier: tier ? parseInt(tier) : undefined,
      method: method || undefined,
      enabled: enabled !== null ? enabled === "true" : undefined,
      blocklisted: blocklisted !== null ? blocklisted === "true" : undefined,
      search: search || undefined,
    });

    return NextResponse.json(sources);
  } catch (error) {
    console.error("Error fetching sources:", error);
    return NextResponse.json(
      { error: "Failed to fetch sources" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    ensureInitialized();

    const sourceData = await request.json();

    // Validate required fields
    if (!sourceData.id || !sourceData.name || !sourceData.url || !sourceData.method) {
      return NextResponse.json(
        { error: "Missing required fields: id, name, url, method" },
        { status: 400 }
      );
    }

    const source = createSource(sourceData);
    return NextResponse.json(source, { status: 201 });
  } catch (error) {
    console.error("Error creating source:", error);
    return NextResponse.json(
      { error: "Failed to create source" },
      { status: 500 }
    );
  }
}
