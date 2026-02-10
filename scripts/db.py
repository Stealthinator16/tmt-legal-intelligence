"""
Shared database module for TMT Legal Intelligence.

All Python scripts use this module to read/write tmt_intelligence.db.
Schema matches dashboard/lib/db/database.ts exactly.
"""

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "sources" / "state" / "tmt_intelligence.db"


def get_connection() -> sqlite3.Connection:
    """Return a connection to tmt_intelligence.db with WAL mode."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=5000")
    conn.execute("PRAGMA foreign_keys=ON")
    _ensure_schema(conn)
    return conn


def _ensure_schema(conn: sqlite3.Connection) -> None:
    """Create tables if they don't exist (idempotent)."""
    conn.executescript("""
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

        CREATE TABLE IF NOT EXISTS brief_state (
            key TEXT PRIMARY KEY,
            value TEXT
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
    """)
    _migrate_brief_state(conn)


def _migrate_brief_state(conn: sqlite3.Connection) -> None:
    """One-time migration of brief_state.json into DB table."""
    cursor = conn.execute("SELECT COUNT(*) FROM brief_state")
    if cursor.fetchone()[0] > 0:
        return  # Already migrated

    json_path = DB_PATH.parent / "brief_state.json"
    if not json_path.exists():
        return

    try:
        data = json.loads(json_path.read_text())
        conn.execute(
            "INSERT OR IGNORE INTO brief_state (key, value) VALUES (?, ?)",
            ("last_brief_date", data.get("last_brief_date", "")),
        )
        conn.execute(
            "INSERT OR IGNORE INTO brief_state (key, value) VALUES (?, ?)",
            ("last_brief_file", data.get("last_brief_file", "")),
        )
        conn.execute(
            "INSERT OR IGNORE INTO brief_state (key, value) VALUES (?, ?)",
            ("reported_items", json.dumps(data.get("reported_items", []))),
        )
        conn.commit()
    except (json.JSONDecodeError, IOError):
        pass


# --------------- Item helpers ---------------

def item_exists(conn: sqlite3.Connection, url: str) -> bool:
    """Check if an item URL already exists."""
    row = conn.execute("SELECT 1 FROM items WHERE url = ?", (url,)).fetchone()
    return row is not None


def insert_item(
    conn: sqlite3.Connection,
    url: str,
    title: str,
    snippet: str,
    source_id: str,
    published: str,
    focus_areas: list[str] | None = None,
    content_hash: str | None = None,
) -> bool:
    """Insert an item (returns True if actually inserted, False if duplicate)."""
    try:
        conn.execute(
            """INSERT OR IGNORE INTO items
               (url, title, snippet, source_id, published, focus_areas, content_hash)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                url,
                title,
                snippet,
                source_id,
                published,
                json.dumps(focus_areas) if focus_areas else None,
                content_hash,
            ),
        )
        return conn.total_changes > 0
    except sqlite3.Error:
        return False


# --------------- Page hash helpers ---------------

def get_page_hash(conn: sqlite3.Connection, source_id: str, section: str = "main") -> str | None:
    row = conn.execute(
        "SELECT content_hash FROM page_hashes WHERE source_id = ? AND section = ?",
        (source_id, section),
    ).fetchone()
    return row[0] if row else None


def set_page_hash(conn: sqlite3.Connection, source_id: str, section: str, content_hash: str) -> None:
    conn.execute(
        """INSERT INTO page_hashes (source_id, section, content_hash, last_checked)
           VALUES (?, ?, ?, datetime('now'))
           ON CONFLICT(source_id, section) DO UPDATE
           SET content_hash = excluded.content_hash, last_checked = excluded.last_checked""",
        (source_id, section, content_hash),
    )


# --------------- Source helpers ---------------

def update_source_last_fetch(conn: sqlite3.Connection, source_id: str) -> None:
    conn.execute(
        "UPDATE sources SET last_fetch = datetime('now'), updated_at = datetime('now') WHERE id = ?",
        (source_id,),
    )


def record_source_error(conn: sqlite3.Connection, source_id: str, msg: str) -> None:
    conn.execute(
        "INSERT INTO source_errors (source_id, error_message) VALUES (?, ?)",
        (source_id, msg),
    )
    conn.execute(
        "UPDATE sources SET last_error = ?, updated_at = datetime('now') WHERE id = ?",
        (msg, source_id),
    )


def clear_source_error(conn: sqlite3.Connection, source_id: str) -> None:
    conn.execute(
        "UPDATE sources SET last_error = NULL, updated_at = datetime('now') WHERE id = ?",
        (source_id,),
    )


# --------------- Brief state helpers ---------------

def get_brief_state(conn: sqlite3.Connection, key: str) -> str | None:
    row = conn.execute("SELECT value FROM brief_state WHERE key = ?", (key,)).fetchone()
    return row[0] if row else None


def set_brief_state(conn: sqlite3.Connection, key: str, value: str) -> None:
    conn.execute(
        "INSERT INTO brief_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        (key, value),
    )
