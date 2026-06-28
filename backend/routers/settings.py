import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any
from backend.database import get_db

router = APIRouter(prefix="/api/settings", tags=["settings"])

NUMERIC_KEYS = {
    "focus_duration", "short_break_duration", "long_break_duration",
    "long_break_interval", "ambient_volume", "end_sound_volume",
}
BOOL_KEYS = {
    "auto_start_breaks", "auto_start_focus", "notification_enabled",
    "ambient_enabled", "tick_sound_enabled",
}


def _parse(key: str, raw: str) -> Any:
    if key in NUMERIC_KEYS:
        v = json.loads(raw)
        return float(v) if "." in str(v) else int(v)
    if key in BOOL_KEYS:
        return json.loads(raw)
    return json.loads(raw) if raw.startswith(('"', "[", "{")) else raw


@router.get("")
async def get_settings():
    async with get_db() as db:
        rows = await db.execute_fetchall("SELECT key, value FROM settings")
    return {row["key"]: _parse(row["key"], row["value"]) for row in rows}


@router.patch("")
async def patch_settings(body: dict[str, Any]):
    if not body:
        raise HTTPException(status_code=400, detail="No fields provided")
    async with get_db() as db:
        for key, val in body.items():
            await db.execute(
                "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
                (key, json.dumps(val) if not isinstance(val, str) else f'"{val}"'),
            )
        await db.commit()
    return {"updated": list(body.keys())}
