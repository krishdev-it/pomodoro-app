import aiosqlite
import json
import os
from contextlib import asynccontextmanager

DB_PATH = os.environ.get("DB_PATH", "/data/pomodoro.db")

SCHEMA = """
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS sessions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    mode          TEXT    NOT NULL CHECK(mode IN ('focus','short_break','long_break')),
    task_label    TEXT    NOT NULL DEFAULT '',
    planned_secs  INTEGER NOT NULL,
    actual_secs   INTEGER NOT NULL,
    completed     INTEGER NOT NULL DEFAULT 0,
    interruptions INTEGER NOT NULL DEFAULT 0,
    started_at    TEXT    NOT NULL,
    ended_at      TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);

CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS playlist (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    url        TEXT    NOT NULL,
    title      TEXT    NOT NULL DEFAULT '',
    position   INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS backups (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    filename   TEXT    NOT NULL,
    size_bytes INTEGER NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
"""

DEFAULT_SETTINGS = {
    "focus_duration": "1500",
    "short_break_duration": "300",
    "long_break_duration": "900",
    "long_break_interval": "4",
    "auto_start_breaks": "false",
    "auto_start_focus": "false",
    "notification_enabled": "true",
    "notification_sound": '"default"',
    "ambient_enabled": "false",
    "ambient_file": '""',
    "ambient_volume": "0.5",
    "end_sound_volume": "0.8",
    "tick_sound_enabled": "false",
}


@asynccontextmanager
async def get_db():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        yield db


async def init_db():
    os.makedirs(os.path.dirname(DB_PATH) if os.path.dirname(DB_PATH) else ".", exist_ok=True)
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        await db.executescript(SCHEMA)
        for key, value in DEFAULT_SETTINGS.items():
            await db.execute(
                "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
                (key, value),
            )
        await db.commit()
