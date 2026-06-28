import os
import shutil
from datetime import datetime, timezone
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from backend.database import get_db, DB_PATH

router = APIRouter(prefix="/api/backup", tags=["backup"])

BACKUP_DIR = Path(os.environ.get("BACKUP_DIR", "/data/backups"))
MAX_BACKUPS = 24


async def do_backup() -> dict:
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%S")
    dest = BACKUP_DIR / f"pomodoro-{ts}.db"
    shutil.copy2(DB_PATH, str(dest))
    size = dest.stat().st_size

    async with get_db() as db:
        await db.execute(
            "INSERT INTO backups (filename, size_bytes) VALUES (?,?)",
            (str(dest), size),
        )
        await db.commit()
        old = await db.execute_fetchall(
            "SELECT id, filename FROM backups ORDER BY created_at DESC LIMIT -1 OFFSET ?",
            (MAX_BACKUPS,),
        )
        for row in old:
            try:
                os.unlink(row["filename"])
            except OSError:
                pass
            await db.execute("DELETE FROM backups WHERE id=?", (row["id"],))
        await db.commit()
        last = await db.execute_fetchall(
            "SELECT filename, size_bytes, created_at FROM backups ORDER BY created_at DESC LIMIT 1"
        )

    return dict(last[0])


@router.get("/status")
async def backup_status():
    async with get_db() as db:
        last = await db.execute_fetchall(
            "SELECT filename, size_bytes, created_at FROM backups ORDER BY created_at DESC LIMIT 1"
        )
        count = await db.execute_fetchall("SELECT COUNT(*) as n FROM backups")
        recent = await db.execute_fetchall(
            "SELECT id, filename, size_bytes, created_at FROM backups ORDER BY created_at DESC LIMIT 24"
        )
    return {
        "last_backup": dict(last[0]) if last else None,
        "backup_count": count[0]["n"],
        "backups": [dict(r) for r in recent],
    }


@router.post("/trigger")
async def trigger_backup():
    return await do_backup()


@router.get("/download/{filename}")
async def download_backup(filename: str):
    if ".." in filename or filename.startswith("/"):
        raise HTTPException(status_code=403, detail="Access denied")
    path = (BACKUP_DIR / filename).resolve()
    if not str(path).startswith(str(BACKUP_DIR.resolve())):
        raise HTTPException(status_code=403, detail="Access denied")
    if not path.exists():
        raise HTTPException(status_code=404, detail="Backup not found")
    return FileResponse(
        str(path),
        media_type="application/octet-stream",
        filename=filename,
    )
