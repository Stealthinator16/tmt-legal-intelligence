import { getDatabase, SourceRow, parseJsonField, stringifyJsonField } from "./database";
import { Source, SourceMethod, SourceType, Section } from "@/types/source";

// Convert database row to Source type
function rowToSource(row: SourceRow): Source {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    rss: row.rss || undefined,
    type: (row.type || "blog") as SourceType,
    method: row.method,
    tier: row.tier,
    enabled: row.enabled === 1,
    focus_areas: parseJsonField<string[]>(row.focus_areas, []),
    sections: row.sections ? parseJsonField<Section[]>(row.sections, []) : undefined,
    filter_keywords: row.filter_keywords ? parseJsonField<string[]>(row.filter_keywords, []) : undefined,
    search_query: row.search_query || undefined,
    critical: row.critical === 1,
    priority_score: row.priority_score,
    blocklisted: row.blocklisted === 1,
    last_fetch: row.last_fetch || undefined,
    last_error: row.last_error || undefined,
  };
}

export interface SourceFilters {
  tier?: number;
  method?: SourceMethod;
  enabled?: boolean;
  blocklisted?: boolean;
  search?: string;
}

export function getAllSources(filters: SourceFilters = {}): Source[] {
  const db = getDatabase();

  let query = "SELECT * FROM sources WHERE 1=1";
  const params: (string | number)[] = [];

  if (filters.tier !== undefined) {
    query += " AND tier = ?";
    params.push(filters.tier);
  }

  if (filters.method) {
    query += " AND method = ?";
    params.push(filters.method);
  }

  if (filters.enabled !== undefined) {
    query += " AND enabled = ?";
    params.push(filters.enabled ? 1 : 0);
  }

  if (filters.blocklisted !== undefined) {
    query += " AND blocklisted = ?";
    params.push(filters.blocklisted ? 1 : 0);
  }

  if (filters.search) {
    query += " AND (name LIKE ? OR id LIKE ?)";
    const searchPattern = `%${filters.search}%`;
    params.push(searchPattern, searchPattern);
  }

  query += " ORDER BY tier ASC, priority_score DESC, name ASC";

  const rows = db.prepare(query).all(...params) as SourceRow[];
  return rows.map(rowToSource);
}

export function getSourceById(id: string): Source | null {
  const db = getDatabase();
  const row = db.prepare("SELECT * FROM sources WHERE id = ?").get(id) as SourceRow | undefined;
  return row ? rowToSource(row) : null;
}

export function getSourcesByTier(tier: number): Source[] {
  return getAllSources({ tier });
}

export function createSource(source: Omit<Source, "tier"> & { tier?: number }): Source {
  const db = getDatabase();

  const stmt = db.prepare(`
    INSERT INTO sources (id, name, url, rss, type, method, tier, enabled, blocklisted, focus_areas, search_query, filter_keywords, sections, critical, priority_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    source.id,
    source.name,
    source.url,
    source.rss || null,
    source.type || "blog",
    source.method,
    source.tier || 3,
    source.enabled ? 1 : 0,
    (source as Source & { blocklisted?: boolean }).blocklisted ? 1 : 0,
    stringifyJsonField(source.focus_areas || []),
    source.search_query || null,
    source.filter_keywords ? stringifyJsonField(source.filter_keywords) : null,
    source.sections ? stringifyJsonField(source.sections) : null,
    source.critical ? 1 : 0,
    source.priority_score || 50
  );

  return getSourceById(source.id)!;
}

export function updateSource(id: string, updates: Partial<Source>): Source | null {
  const db = getDatabase();
  const existing = getSourceById(id);
  if (!existing) return null;

  const fields: string[] = [];
  const params: (string | number | null)[] = [];

  if (updates.name !== undefined) {
    fields.push("name = ?");
    params.push(updates.name);
  }
  if (updates.url !== undefined) {
    fields.push("url = ?");
    params.push(updates.url);
  }
  if (updates.rss !== undefined) {
    fields.push("rss = ?");
    params.push(updates.rss || null);
  }
  if (updates.type !== undefined) {
    fields.push("type = ?");
    params.push(updates.type);
  }
  if (updates.method !== undefined) {
    fields.push("method = ?");
    params.push(updates.method);
  }
  if (updates.tier !== undefined) {
    fields.push("tier = ?");
    params.push(updates.tier);
  }
  if (updates.enabled !== undefined) {
    fields.push("enabled = ?");
    params.push(updates.enabled ? 1 : 0);
  }
  if ((updates as Source & { blocklisted?: boolean }).blocklisted !== undefined) {
    fields.push("blocklisted = ?");
    params.push((updates as Source & { blocklisted?: boolean }).blocklisted ? 1 : 0);
  }
  if (updates.focus_areas !== undefined) {
    fields.push("focus_areas = ?");
    params.push(stringifyJsonField(updates.focus_areas));
  }
  if (updates.search_query !== undefined) {
    fields.push("search_query = ?");
    params.push(updates.search_query || null);
  }
  if (updates.filter_keywords !== undefined) {
    fields.push("filter_keywords = ?");
    params.push(updates.filter_keywords ? stringifyJsonField(updates.filter_keywords) : null);
  }
  if (updates.sections !== undefined) {
    fields.push("sections = ?");
    params.push(updates.sections ? stringifyJsonField(updates.sections) : null);
  }
  if (updates.critical !== undefined) {
    fields.push("critical = ?");
    params.push(updates.critical ? 1 : 0);
  }
  if (updates.priority_score !== undefined) {
    fields.push("priority_score = ?");
    params.push(updates.priority_score);
  }
  if ((updates as Source & { last_fetch?: string }).last_fetch !== undefined) {
    fields.push("last_fetch = ?");
    params.push((updates as Source & { last_fetch?: string }).last_fetch || null);
  }
  if ((updates as Source & { last_error?: string }).last_error !== undefined) {
    fields.push("last_error = ?");
    params.push((updates as Source & { last_error?: string }).last_error || null);
  }

  if (fields.length === 0) return existing;

  fields.push("updated_at = datetime('now')");
  params.push(id);

  db.prepare(`UPDATE sources SET ${fields.join(", ")} WHERE id = ?`).run(...params);

  return getSourceById(id);
}

export function deleteSource(id: string): boolean {
  const db = getDatabase();
  const result = db.prepare("DELETE FROM sources WHERE id = ?").run(id);
  return result.changes > 0;
}

export function toggleBlocklist(id: string): Source | null {
  const db = getDatabase();
  const source = getSourceById(id);
  if (!source) return null;

  const newBlocklisted = !(source as Source & { blocklisted?: boolean }).blocklisted;
  db.prepare("UPDATE sources SET blocklisted = ?, updated_at = datetime('now') WHERE id = ?").run(newBlocklisted ? 1 : 0, id);

  return getSourceById(id);
}

export function recordSourceError(sourceId: string, errorMessage: string): void {
  const db = getDatabase();

  // Add to error log
  db.prepare(`
    INSERT INTO source_errors (source_id, error_message)
    VALUES (?, ?)
  `).run(sourceId, errorMessage);

  // Update last_error on source
  db.prepare(`
    UPDATE sources SET last_error = ?, updated_at = datetime('now') WHERE id = ?
  `).run(errorMessage, sourceId);
}

export function clearSourceError(sourceId: string): void {
  const db = getDatabase();
  db.prepare("UPDATE sources SET last_error = NULL, updated_at = datetime('now') WHERE id = ?").run(sourceId);
}

export function getSourcesWithErrors(): Source[] {
  const db = getDatabase();
  const rows = db.prepare("SELECT * FROM sources WHERE last_error IS NOT NULL ORDER BY updated_at DESC").all() as SourceRow[];
  return rows.map(rowToSource);
}

export function getRecentErrors(limit: number = 50): { source_id: string; error_message: string; occurred_at: string }[] {
  const db = getDatabase();
  return db.prepare(`
    SELECT source_id, error_message, occurred_at
    FROM source_errors
    ORDER BY occurred_at DESC
    LIMIT ?
  `).all(limit) as { source_id: string; error_message: string; occurred_at: string }[];
}

export function getSourceStats(): {
  total: number;
  enabled: number;
  blocklisted: number;
  byTier: Record<number, number>;
  byMethod: Record<string, number>;
  withErrors: number;
} {
  const db = getDatabase();

  const total = (db.prepare("SELECT COUNT(*) as count FROM sources").get() as { count: number }).count;
  const enabled = (db.prepare("SELECT COUNT(*) as count FROM sources WHERE enabled = 1 AND blocklisted = 0").get() as { count: number }).count;
  const blocklisted = (db.prepare("SELECT COUNT(*) as count FROM sources WHERE blocklisted = 1").get() as { count: number }).count;
  const withErrors = (db.prepare("SELECT COUNT(*) as count FROM sources WHERE last_error IS NOT NULL").get() as { count: number }).count;

  const tierRows = db.prepare("SELECT tier, COUNT(*) as count FROM sources GROUP BY tier").all() as { tier: number; count: number }[];
  const byTier: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of tierRows) {
    byTier[row.tier] = row.count;
  }

  const methodRows = db.prepare("SELECT method, COUNT(*) as count FROM sources GROUP BY method").all() as { method: string; count: number }[];
  const byMethod: Record<string, number> = {};
  for (const row of methodRows) {
    byMethod[row.method] = row.count;
  }

  return { total, enabled, blocklisted, byTier, byMethod, withErrors };
}
