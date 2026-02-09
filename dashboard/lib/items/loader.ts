import fs from "fs/promises";
import path from "path";
import { NewItemsData, FeedItem, PageChange } from "@/types/item";

function getOutputPath(): string {
  const outputPath = process.env.OUTPUT_PATH || "../sources/downloaded";
  return path.resolve(process.cwd(), outputPath);
}

export async function loadNewItems(): Promise<NewItemsData | null> {
  const outputPath = getOutputPath();
  const filePath = path.join(outputPath, "new_items.json");

  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as NewItemsData;
  } catch (error) {
    console.error("Error loading new_items.json:", error);
    return null;
  }
}

export async function getRecentItems(limit: number = 20): Promise<FeedItem[]> {
  const data = await loadNewItems();
  if (!data) return [];

  return data.items
    .sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime())
    .slice(0, limit);
}

export async function getPageChanges(): Promise<PageChange[]> {
  const data = await loadNewItems();
  if (!data) return [];

  return data.page_changes.filter((p) => p.change_detected);
}

export async function getItemsBySource(sourceId: string): Promise<FeedItem[]> {
  const data = await loadNewItems();
  if (!data) return [];

  return data.items.filter((item) => item.source_id === sourceId);
}

export async function getItemsByFocusArea(focusArea: string): Promise<FeedItem[]> {
  const data = await loadNewItems();
  if (!data) return [];

  return data.items.filter((item) =>
    item.focus_areas.some(
      (fa) => fa.toLowerCase() === focusArea.toLowerCase() || fa === "all"
    )
  );
}

export async function getFetchStats(): Promise<{
  lastFetchedAt: string | null;
  newItemsCount: number;
  pageChangesCount: number;
  websearchPending: number;
}> {
  const data = await loadNewItems();

  if (!data) {
    return {
      lastFetchedAt: null,
      newItemsCount: 0,
      pageChangesCount: 0,
      websearchPending: 0,
    };
  }

  return {
    lastFetchedAt: data.fetched_at,
    newItemsCount: data.new_items_count,
    pageChangesCount: data.page_changes.filter((p) => p.change_detected).length,
    websearchPending: data.websearch_pending.length,
  };
}
