import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = process.env.DB_PATH || path.resolve(process.cwd(), "../sources/state/tmt_intelligence.db");

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (db) return db;

  // Ensure directory exists
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  return db;
}

export function initializeDatabase(): void {
  const database = getDatabase();

  // Sources table (replaces JSON configs)
  database.exec(`
    CREATE TABLE IF NOT EXISTS sources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      rss TEXT,
      type TEXT,
      method TEXT NOT NULL CHECK (method IN ('rss', 'webfetch', 'websearch')),
      tier INTEGER DEFAULT 3 CHECK (tier BETWEEN 1 AND 5),
      enabled INTEGER DEFAULT 1,
      blocklisted INTEGER DEFAULT 0,
      focus_areas TEXT,
      search_query TEXT,
      filter_keywords TEXT,
      sections TEXT,
      critical INTEGER DEFAULT 0,
      priority_score INTEGER DEFAULT 50,
      last_fetch TEXT,
      last_error TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Items table (all updates from all sources)
  database.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      snippet TEXT,
      source_id TEXT REFERENCES sources(id) ON DELETE SET NULL,
      published TEXT,
      first_seen TEXT DEFAULT (datetime('now')),
      read INTEGER DEFAULT 0,
      starred INTEGER DEFAULT 0,
      focus_areas TEXT,
      content_hash TEXT
    )
  `);

  // Track fetch errors per source
  database.exec(`
    CREATE TABLE IF NOT EXISTS source_errors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id TEXT REFERENCES sources(id) ON DELETE CASCADE,
      error_message TEXT,
      occurred_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Page hashes for change detection
  database.exec(`
    CREATE TABLE IF NOT EXISTS page_hashes (
      source_id TEXT,
      section TEXT DEFAULT 'main',
      content_hash TEXT,
      last_checked TEXT,
      PRIMARY KEY (source_id, section)
    )
  `);

  // Queue for Claude Code to process
  database.exec(`
    CREATE TABLE IF NOT EXISTS websearch_queue (
      source_id TEXT PRIMARY KEY REFERENCES sources(id) ON DELETE CASCADE,
      added_at TEXT DEFAULT (datetime('now')),
      processed INTEGER DEFAULT 0
    )
  `);

  // Brief state (replaces brief_state.json)
  database.exec(`
    CREATE TABLE IF NOT EXISTS brief_state (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  // Create indexes
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_items_source ON items(source_id);
    CREATE INDEX IF NOT EXISTS idx_items_published ON items(published DESC);
    CREATE INDEX IF NOT EXISTS idx_items_first_seen ON items(first_seen DESC);
    CREATE INDEX IF NOT EXISTS idx_items_read ON items(read);
    CREATE INDEX IF NOT EXISTS idx_sources_tier ON sources(tier);
    CREATE INDEX IF NOT EXISTS idx_sources_method ON sources(method);
    CREATE INDEX IF NOT EXISTS idx_sources_enabled ON sources(enabled);
    CREATE INDEX IF NOT EXISTS idx_source_errors_source ON source_errors(source_id);
    CREATE INDEX IF NOT EXISTS idx_source_errors_time ON source_errors(occurred_at DESC);
  `);

  console.log("Database initialized at:", DB_PATH);
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// Types for database rows
export interface SourceRow {
  id: string;
  name: string;
  url: string;
  rss: string | null;
  type: string | null;
  method: "rss" | "webfetch" | "websearch";
  tier: number;
  enabled: number;
  blocklisted: number;
  focus_areas: string | null;
  search_query: string | null;
  filter_keywords: string | null;
  sections: string | null;
  critical: number;
  priority_score: number;
  last_fetch: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface ItemRow {
  id: number;
  url: string;
  title: string;
  snippet: string | null;
  source_id: string | null;
  published: string | null;
  first_seen: string;
  read: number;
  starred: number;
  focus_areas: string | null;
  content_hash: string | null;
}

export interface SourceErrorRow {
  id: number;
  source_id: string;
  error_message: string;
  occurred_at: string;
}

export interface PageHashRow {
  source_id: string;
  section: string;
  content_hash: string;
  last_checked: string;
}

export interface WebsearchQueueRow {
  source_id: string;
  added_at: string;
  processed: number;
}

// Helper to parse JSON fields
export function parseJsonField<T>(field: string | null, defaultValue: T): T {
  if (!field) return defaultValue;
  try {
    return JSON.parse(field);
  } catch {
    return defaultValue;
  }
}

// Helper to stringify JSON fields
export function stringifyJsonField<T>(value: T): string {
  return JSON.stringify(value);
}
