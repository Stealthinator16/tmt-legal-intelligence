import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

function getSummariesPath(): string {
  const summariesPath = process.env.SUMMARIES_PATH || "../summaries";
  return path.resolve(process.cwd(), summariesPath);
}

interface Brief {
  id: string;
  type: "daily" | "weekly" | "monthly";
  filename: string;
  date: string;
  content?: string;
}

async function loadBriefs(): Promise<Brief[]> {
  const summariesPath = getSummariesPath();
  const briefs: Brief[] = [];

  const types: Array<"daily" | "weekly" | "monthly"> = ["daily", "weekly", "monthly"];

  for (const type of types) {
    const typePath = path.join(summariesPath, type);

    try {
      const files = await fs.readdir(typePath);
      for (const file of files.filter((f) => f.endsWith(".md"))) {
        // Extract date from filename
        // daily: YYYY-MM-DD_daily-summary.md
        // weekly: YYYY-Www_weekly-summary.md
        // monthly: YYYY-MM_monthly-summary.md
        const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2}|\d{4}-W\d{2}|\d{4}-\d{2})/);
        const date = dateMatch ? dateMatch[1] : file;

        briefs.push({
          id: `${type}-${file}`,
          type,
          filename: file,
          date,
        });
      }
    } catch {
      // Directory might not exist yet
      console.log(`No ${type} summaries found`);
    }
  }

  // Sort by date descending
  return briefs.sort((a, b) => b.date.localeCompare(a.date));
}

async function loadBriefContent(type: string, filename: string): Promise<string | null> {
  const summariesPath = getSummariesPath();
  const filePath = path.join(summariesPath, type, filename);

  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const filename = searchParams.get("filename");

  // If specific brief requested, return its content
  if (type && filename) {
    const content = await loadBriefContent(type, filename);
    if (content) {
      return NextResponse.json({ content });
    }
    return NextResponse.json({ error: "Brief not found" }, { status: 404 });
  }

  // Otherwise return list of briefs
  const briefs = await loadBriefs();

  // Filter by type if specified
  const filteredBriefs = type
    ? briefs.filter((b) => b.type === type)
    : briefs;

  return NextResponse.json(filteredBriefs);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body;

    if (!type || !["daily", "weekly", "monthly"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid brief type" },
        { status: 400 }
      );
    }

    // For now, return a placeholder response
    // In production, this would trigger Claude to generate a brief
    return NextResponse.json({
      message: `Brief generation for ${type} would be triggered here`,
      note: "This feature requires Claude API integration for content generation",
    });
  } catch (error) {
    console.error("Error generating brief:", error);
    return NextResponse.json(
      { error: "Failed to generate brief" },
      { status: 500 }
    );
  }
}
