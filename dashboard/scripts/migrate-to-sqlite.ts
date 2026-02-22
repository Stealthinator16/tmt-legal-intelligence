#!/usr/bin/env npx tsx

/**
 * Migration script: JSON configs -> SQLite database
 *
 * This script migrates:
 * 1. All 738 sources from tier JSON configs to the sources table
 * 2. Existing items from seen_items.db to the items table
 * 3. Page hashes from page_hashes.json to the page_hashes table
 *
 * Usage:
 *   npx tsx scripts/migrate-to-sqlite.ts
 *   npx tsx scripts/migrate-to-sqlite.ts --dry-run
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const SOURCES_CONFIG_DIR = path.join(PROJECT_ROOT, "sources/config");
const STATE_DIR = path.join(PROJECT_ROOT, "sources/state");
const DB_PATH = path.join(STATE_DIR, "tmt_intelligence.db");
const OLD_SEEN_ITEMS_DB = path.join(STATE_DIR, "seen_items.db");
const PAGE_HASHES_FILE = path.join(STATE_DIR, "page_hashes.json");

const TIER_DIRS: Record<number, string> = {
  1: "tier1-critical",
  2: "tier2-high",
  3: "tier3-standard",
  4: "tier4-regular",
  5: "tier5-periodic",
  0: "disabled",
};

interface SourceConfig {
  tier: number;
  name: string;
  sources: Array<{
    id: string;
    name: string;
    url: string;
    rss?: string;
    type?: string;
    method: string;
    sections?: Array<{ name: string; url: string }>;
    filter_keywords?: string[];
    search_query?: string;
    focus_areas?: string[];
    enabled?: boolean;
    critical?: boolean;
    priority_score?: number;
    tier?: number;
  }>;
}

const isDryRun = process.argv.includes("--dry-run");

function log(message: string) {
  console.log(isDryRun ? `[DRY-RUN] ${message}` : message);
}

function initDatabase(db: Database.Database) {
  log("Initializing database schema...");

  db.exec(`
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
    );

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
    );

    CREATE TABLE IF NOT EXISTS source_errors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id TEXT REFERENCES sources(id) ON DELETE CASCADE,
      error_message TEXT,
      occurred_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS page_hashes (
      source_id TEXT,
      section TEXT DEFAULT 'main',
      content_hash TEXT,
      last_checked TEXT,
      PRIMARY KEY (source_id, section)
    );

    CREATE TABLE IF NOT EXISTS websearch_queue (
      source_id TEXT PRIMARY KEY REFERENCES sources(id) ON DELETE CASCADE,
      added_at TEXT DEFAULT (datetime('now')),
      processed INTEGER DEFAULT 0
    );

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

  log("Database schema created.");
}

function migrateSourceConfigs(db: Database.Database) {
  log("\nMigrating source configurations...");

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO sources
    (id, name, url, rss, type, method, tier, enabled, focus_areas, search_query, filter_keywords, sections, critical, priority_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let totalSources = 0;

  for (const [dirKey, tierDir] of Object.entries(TIER_DIRS)) {
    const tierPath = path.join(SOURCES_CONFIG_DIR, tierDir);

    if (!fs.existsSync(tierPath)) {
      log(`  ${tierDir} directory not found: ${tierPath}`);
      continue;
    }

    const files = fs.readdirSync(tierPath).filter((f) => f.endsWith(".json"));

    for (const file of files) {
      const filePath = path.join(tierPath, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const config: SourceConfig = JSON.parse(content);

      for (const source of config.sources || []) {
        // Use source's own tier field if present (e.g. disabled sources retain original tier),
        // otherwise use the directory key. Clamp to 1-5 for DB constraint.
        const sourceTier = Math.max(1, Math.min(5, source.tier || parseInt(dirKey) || 3));
        if (!isDryRun) {
          insertStmt.run(
            source.id,
            source.name,
            source.url,
            source.rss || null,
            source.type || "blog",
            source.method,
            sourceTier,
            source.enabled !== false ? 1 : 0,
            JSON.stringify(source.focus_areas || []),
            source.search_query || null,
            source.filter_keywords ? JSON.stringify(source.filter_keywords) : null,
            source.sections ? JSON.stringify(source.sections) : null,
            source.critical ? 1 : 0,
            source.priority_score || 50
          );
        }
        totalSources++;
      }
    }

    log(`  ${tierDir}: processed config files`);
  }

  log(`  Total sources migrated: ${totalSources}`);
}

function migrateSeenItems(db: Database.Database) {
  log("\nMigrating seen items...");

  if (!fs.existsSync(OLD_SEEN_ITEMS_DB)) {
    log("  Old seen_items.db not found, skipping...");
    return;
  }

  const oldDb = new Database(OLD_SEEN_ITEMS_DB, { readonly: true });

  try {
    // Check if seen_items table exists
    const tableExists = oldDb.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='seen_items'
    `).get();

    if (!tableExists) {
      log("  No seen_items table found in old database, skipping...");
      return;
    }

    const rows = oldDb.prepare(`
      SELECT url, title, source_id, content_hash, first_seen, published
      FROM seen_items
    `).all() as Array<{
      url: string;
      title: string;
      source_id: string;
      content_hash: string;
      first_seen: string;
      published: string;
    }>;

    log(`  Found ${rows.length} items to migrate`);

    if (!isDryRun) {
      const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO items (url, title, source_id, content_hash, first_seen, published, read)
        VALUES (?, ?, ?, ?, ?, ?, 1)
      `);

      const insertMany = db.transaction((items: typeof rows) => {
        for (const item of items) {
          insertStmt.run(
            item.url,
            item.title,
            item.source_id,
            item.content_hash,
            item.first_seen,
            item.published
          );
        }
      });

      insertMany(rows);
    }

    log(`  Migrated ${rows.length} items`);
  } finally {
    oldDb.close();
  }
}

function migratePageHashes(db: Database.Database) {
  log("\nMigrating page hashes...");

  if (!fs.existsSync(PAGE_HASHES_FILE)) {
    log("  page_hashes.json not found, skipping...");
    return;
  }

  try {
    const content = fs.readFileSync(PAGE_HASHES_FILE, "utf-8");
    const hashes = JSON.parse(content) as Record<string, string>;

    log(`  Found ${Object.keys(hashes).length} page hashes`);

    if (!isDryRun) {
      const insertStmt = db.prepare(`
        INSERT OR REPLACE INTO page_hashes (source_id, section, content_hash, last_checked)
        VALUES (?, ?, ?, datetime('now'))
      `);

      for (const [key, hash] of Object.entries(hashes)) {
        const [sourceId, section = "main"] = key.split(":");
        insertStmt.run(sourceId, section, hash);
      }
    }

    log(`  Migrated ${Object.keys(hashes).length} page hashes`);
  } catch (error) {
    log(`  Error reading page_hashes.json: ${error}`);
  }
}

function populateWebsearchQueue(db: Database.Database) {
  log("\nPopulating websearch queue...");

  if (!isDryRun) {
    db.exec(`
      INSERT OR IGNORE INTO websearch_queue (source_id)
      SELECT id FROM sources WHERE method = 'websearch' AND enabled = 1 AND blocklisted = 0
    `);
  }

  const count = (db.prepare(`
    SELECT COUNT(*) as count FROM sources WHERE method = 'websearch' AND enabled = 1
  `).get() as { count: number }).count;

  log(`  Added ${count} sources to websearch queue`);
}

function printStats(db: Database.Database) {
  log("\n=== Migration Summary ===");

  const sources = db.prepare("SELECT COUNT(*) as count FROM sources").get() as { count: number };
  const items = db.prepare("SELECT COUNT(*) as count FROM items").get() as { count: number };
  const pageHashes = db.prepare("SELECT COUNT(*) as count FROM page_hashes").get() as { count: number };
  const websearchQueue = db.prepare("SELECT COUNT(*) as count FROM websearch_queue").get() as { count: number };

  log(`Sources: ${sources.count}`);
  log(`Items: ${items.count}`);
  log(`Page hashes: ${pageHashes.count}`);
  log(`Websearch queue: ${websearchQueue.count}`);

  const tierStats = db.prepare(`
    SELECT tier, COUNT(*) as count FROM sources GROUP BY tier ORDER BY tier
  `).all() as Array<{ tier: number; count: number }>;

  log("\nSources by tier:");
  for (const { tier, count } of tierStats) {
    log(`  Tier ${tier}: ${count}`);
  }

  const methodStats = db.prepare(`
    SELECT method, COUNT(*) as count FROM sources GROUP BY method
  `).all() as Array<{ method: string; count: number }>;

  log("\nSources by method:");
  for (const { method, count } of methodStats) {
    log(`  ${method}: ${count}`);
  }
}

function main() {
  console.log("TMT Legal Intelligence - Migration to SQLite");
  console.log("=============================================");

  if (isDryRun) {
    console.log("\n*** DRY RUN - No changes will be made ***\n");
  }

  // Ensure state directory exists
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }

  // Create or open database
  const db = new Database(isDryRun ? ":memory:" : DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  try {
    initDatabase(db);
    migrateSourceConfigs(db);
    migrateSeenItems(db);
    migratePageHashes(db);
    populateWebsearchQueue(db);
    printStats(db);

    if (!isDryRun) {
      log(`\nDatabase created at: ${DB_PATH}`);
    }
  } finally {
    db.close();
  }

  console.log("\nMigration complete!");
}

main();
