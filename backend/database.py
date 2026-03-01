import sqlite3
from pathlib import Path
from datetime import date
from typing import Optional

DB_PATH = Path(__file__).parent / "digest.db"


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Create tables if they don't exist, and run any pending migrations."""
    with get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS digest_entries (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                date        TEXT    NOT NULL,
                rank        INTEGER NOT NULL,
                hn_id       INTEGER NOT NULL,
                title       TEXT    NOT NULL,
                score       INTEGER NOT NULL,
                url         TEXT,
                by          TEXT,
                comments    INTEGER DEFAULT 0,
                fetched_at  TEXT    NOT NULL,
                UNIQUE(date, rank)
            )
        """)
        conn.commit()

        # Migration: add source column (safe to re-run on existing DBs)
        try:
            conn.execute(
                "ALTER TABLE digest_entries ADD COLUMN source TEXT NOT NULL DEFAULT 'hackernews'"
            )
            conn.commit()
            print("[db] Migration applied: added 'source' column.")
        except Exception:
            pass  # Column already exists — nothing to do

        # Migration: add slot column — NULL for HN posts, text for spread articles
        try:
            conn.execute("ALTER TABLE digest_entries ADD COLUMN slot TEXT")
            conn.commit()
            print("[db] Migration applied: added 'slot' column.")
        except Exception:
            pass  # Column already exists — nothing to do


def upsert_entries(entries: list[dict]) -> None:
    """Insert or replace digest entries (HN top-5 + RSS spread combined)."""
    with get_conn() as conn:
        conn.executemany("""
            INSERT INTO digest_entries (date, rank, hn_id, title, score, url, by, comments, source, slot, fetched_at)
            VALUES (:date, :rank, :hn_id, :title, :score, :url, :by, :comments, :source, :slot, :fetched_at)
            ON CONFLICT(date, rank) DO UPDATE SET
                hn_id      = excluded.hn_id,
                title      = excluded.title,
                score      = excluded.score,
                url        = excluded.url,
                by         = excluded.by,
                comments   = excluded.comments,
                source     = excluded.source,
                slot       = excluded.slot,
                fetched_at = excluded.fetched_at
        """, entries)
        conn.commit()


def get_today(today: Optional[str] = None) -> list[dict]:
    """Return today's entries ordered by rank."""
    day = today or date.today().isoformat()
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM digest_entries WHERE date = ? ORDER BY rank",
            (day,)
        ).fetchall()
    return [dict(r) for r in rows]


def get_history() -> list[dict]:
    """Return all stored entries ordered by date and rank."""
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM digest_entries ORDER BY date DESC, rank"
        ).fetchall()
    return [dict(r) for r in rows]


def get_available_dates() -> list[str]:
    """Return distinct dates that have data, newest first."""
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT DISTINCT date FROM digest_entries ORDER BY date DESC"
        ).fetchall()
    return [r["date"] for r in rows]
