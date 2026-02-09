import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/db/database";
import { getSourceById, updateSource, deleteSource, toggleBlocklist } from "@/lib/db/sources";

// Initialize database on first request
let initialized = false;
function ensureInitialized() {
  if (!initialized) {
    initializeDatabase();
    initialized = true;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    ensureInitialized();

    const { id } = await params;
    const source = getSourceById(id);

    if (!source) {
      return NextResponse.json(
        { error: "Source not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(source);
  } catch (error) {
    console.error("Error fetching source:", error);
    return NextResponse.json(
      { error: "Failed to fetch source" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    ensureInitialized();

    const { id } = await params;
    const updates = await request.json();

    // Check if this is a blocklist toggle
    if (updates.toggleBlocklist) {
      const source = toggleBlocklist(id);
      if (!source) {
        return NextResponse.json(
          { error: "Source not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(source);
    }

    const source = updateSource(id, updates);
    if (!source) {
      return NextResponse.json(
        { error: "Source not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(source);
  } catch (error) {
    console.error("Error updating source:", error);
    return NextResponse.json(
      { error: "Failed to update source" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    ensureInitialized();

    const { id } = await params;
    const sourceData = await request.json();

    const source = updateSource(id, sourceData);
    if (!source) {
      return NextResponse.json(
        { error: "Source not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(source);
  } catch (error) {
    console.error("Error updating source:", error);
    return NextResponse.json(
      { error: "Failed to update source" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    ensureInitialized();

    const { id } = await params;
    const deleted = deleteSource(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Source not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting source:", error);
    return NextResponse.json(
      { error: "Failed to delete source" },
      { status: 500 }
    );
  }
}
