import { getDatabase, ItemRow, parseJsonField, stringifyJsonField } from "./database";
import { FeedItem } from "@/types/item";

// Extended FeedItem with database fields
export interface DbItem extends FeedItem {
  id: number;
  first_seen: string;
  read: boolean;
  starred: boolean;
  content_hash?: string;
}

// Convert database row to DbItem
function rowToItem(row: ItemRow, sourceName?: string): DbItem {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    snippet: row.snippet || "",
    source_id: row.source_id || "",
    source_name: sourceName || row.source_id || "",
    published: row.published || row.first_seen,
    first_seen: row.first_seen,
    read: row.read === 1,
    starred: row.starred === 1,
    focus_areas: parseJsonField<string[]>(row.focus_areas, []),
    method: "rss", // Default, not stored in DB
    content_hash: row.content_hash || undefined,
  };
}

export interface ItemFilters {
  sourceId?: string;
  focusArea?: string;
  read?: boolean;
  starred?: boolean;
  since?: string; // ISO date string
  limit?: number;
  offset?: number;
}

export function getItems(filters: ItemFilters = {}): { items: DbItem[]; total: number } {
  const db = getDatabase();

  let countQuery = "SELECT COUNT(*) as count FROM items WHERE 1=1";
  let query = `
    SELECT items.*, sources.name as source_name
    FROM items
    LEFT JOIN sources ON items.source_id = sources.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (filters.sourceId) {
    query += " AND items.source_id = ?";
    countQuery += " AND source_id = ?";
    params.push(filters.sourceId);
  }

  if (filters.focusArea) {
    query += " AND (items.focus_areas LIKE ? OR items.focus_areas LIKE ?)";
    countQuery += " AND (focus_areas LIKE ? OR focus_areas LIKE ?)";
    params.push(`%"${filters.focusArea}"%`, `%"all"%`);
  }

  if (filters.read !== undefined) {
    query += " AND items.read = ?";
    countQuery += " AND read = ?";
    params.push(filters.read ? 1 : 0);
  }

  if (filters.starred !== undefined) {
    query += " AND items.starred = ?";
    countQuery += " AND starred = ?";
    params.push(filters.starred ? 1 : 0);
  }

  if (filters.since) {
    query += " AND items.first_seen >= ?";
    countQuery += " AND first_seen >= ?";
    params.push(filters.since);
  }

  // Get total count (use copy of params without limit/offset)
  const countParams = [...params];
  const total = (db.prepare(countQuery).get(...countParams) as { count: number }).count;

  // Sort by published date (or first_seen if no published date), newest first
  query += " ORDER BY COALESCE(items.published, items.first_seen) DESC, items.id DESC";

  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  query += " LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const rows = db.prepare(query).all(...params) as (ItemRow & { source_name?: string })[];
  const items = rows.map((row) => rowToItem(row, row.source_name));

  return { items, total };
}

export function getTodayItems(): { items: DbItem[]; total: number } {
  const yesterday = new Date();
  yesterday.setHours(yesterday.getHours() - 24);
  return getItems({ since: yesterday.toISOString(), limit: 200 });
}

export function getItemsBySource(sourceId: string, limit: number = 50): { items: DbItem[]; total: number } {
  return getItems({ sourceId, limit });
}

export function getUnreadCount(): number {
  const db = getDatabase();
  return (db.prepare("SELECT COUNT(*) as count FROM items WHERE read = 0").get() as { count: number }).count;
}

export function getUnreadCountBySource(): Record<string, number> {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT source_id, COUNT(*) as count
    FROM items
    WHERE read = 0 AND source_id IS NOT NULL
    GROUP BY source_id
  `).all() as { source_id: string; count: number }[];

  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.source_id] = row.count;
  }
  return counts;
}

export function getItemById(id: number): DbItem | null {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT items.*, sources.name as source_name
    FROM items
    LEFT JOIN sources ON items.source_id = sources.id
    WHERE items.id = ?
  `).get(id) as (ItemRow & { source_name?: string }) | undefined;
  return row ? rowToItem(row, row.source_name) : null;
}

export function getItemByUrl(url: string): DbItem | null {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT items.*, sources.name as source_name
    FROM items
    LEFT JOIN sources ON items.source_id = sources.id
    WHERE items.url = ?
  `).get(url) as (ItemRow & { source_name?: string }) | undefined;
  return row ? rowToItem(row, row.source_name) : null;
}

export function createItem(item: Omit<FeedItem, "method"> & { content_hash?: string }): DbItem {
  const db = getDatabase();

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO items (url, title, snippet, source_id, published, focus_areas, content_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    item.url,
    item.title,
    item.snippet || null,
    item.source_id || null,
    item.published || null,
    stringifyJsonField(item.focus_areas || []),
    item.content_hash || null
  );

  if (result.changes === 0) {
    // Item already exists
    return getItemByUrl(item.url)!;
  }

  return getItemById(result.lastInsertRowid as number)!;
}

export function createManyItems(items: (Omit<FeedItem, "method"> & { content_hash?: string })[]): number {
  const db = getDatabase();

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO items (url, title, snippet, source_id, published, focus_areas, content_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((itemsToInsert: typeof items) => {
    let inserted = 0;
    for (const item of itemsToInsert) {
      const result = stmt.run(
        item.url,
        item.title,
        item.snippet || null,
        item.source_id || null,
        item.published || null,
        stringifyJsonField(item.focus_areas || []),
        item.content_hash || null
      );
      if (result.changes > 0) inserted++;
    }
    return inserted;
  });

  return insertMany(items);
}

export function markItemRead(id: number, read: boolean = true): void {
  const db = getDatabase();
  db.prepare("UPDATE items SET read = ? WHERE id = ?").run(read ? 1 : 0, id);
}

export function markItemStarred(id: number, starred: boolean = true): void {
  const db = getDatabase();
  db.prepare("UPDATE items SET starred = ? WHERE id = ?").run(starred ? 1 : 0, id);
}

export function markAllRead(sourceId?: string): void {
  const db = getDatabase();
  if (sourceId) {
    db.prepare("UPDATE items SET read = 1 WHERE source_id = ?").run(sourceId);
  } else {
    db.prepare("UPDATE items SET read = 1").run();
  }
}

export function deleteItem(id: number): boolean {
  const db = getDatabase();
  const result = db.prepare("DELETE FROM items WHERE id = ?").run(id);
  return result.changes > 0;
}

export function getItemStats(): {
  total: number;
  unread: number;
  starred: number;
  today: number;
  thisWeek: number;
} {
  const db = getDatabase();

  const total = (db.prepare("SELECT COUNT(*) as count FROM items").get() as { count: number }).count;
  const unread = (db.prepare("SELECT COUNT(*) as count FROM items WHERE read = 0").get() as { count: number }).count;
  const starred = (db.prepare("SELECT COUNT(*) as count FROM items WHERE starred = 1").get() as { count: number }).count;

  const yesterday = new Date();
  yesterday.setHours(yesterday.getHours() - 24);
  const today = (db.prepare("SELECT COUNT(*) as count FROM items WHERE first_seen >= ?").get(yesterday.toISOString()) as { count: number }).count;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeek = (db.prepare("SELECT COUNT(*) as count FROM items WHERE first_seen >= ?").get(weekAgo.toISOString()) as { count: number }).count;

  return { total, unread, starred, today, thisWeek };
}

export function itemExists(url: string): boolean {
  const db = getDatabase();
  const row = db.prepare("SELECT 1 FROM items WHERE url = ?").get(url);
  return row !== undefined;
}
