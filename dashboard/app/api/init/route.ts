import { NextResponse } from "next/server";
import { initializeDatabase, getDatabase } from "@/lib/db/database";

export async function GET() {
  try {
    initializeDatabase();

    const db = getDatabase();

    // Check if database has data
    const sourceCount = (db.prepare("SELECT COUNT(*) as count FROM sources").get() as { count: number }).count;
    const itemCount = (db.prepare("SELECT COUNT(*) as count FROM items").get() as { count: number }).count;

    return NextResponse.json({
      status: "ok",
      database: "initialized",
      sources: sourceCount,
      items: itemCount,
    });
  } catch (error) {
    console.error("Database initialization error:", error);
    return NextResponse.json(
      { status: "error", message: String(error) },
      { status: 500 }
    );
  }
}
