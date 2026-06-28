import csv
import io
from datetime import date, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from backend.database import get_db

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


class SessionIn(BaseModel):
    mode: str
    task_label: str = ""
    planned_secs: int
    actual_secs: int
    completed: bool = False
    interruptions: int = 0
    started_at: str
    ended_at: str


@router.post("", status_code=201)
async def create_session(body: SessionIn):
    if body.mode not in ("focus", "short_break", "long_break"):
        raise HTTPException(status_code=422, detail="Invalid mode")
    async with get_db() as db:
        cursor = await db.execute(
            """INSERT INTO sessions
               (mode, task_label, planned_secs, actual_secs, completed, interruptions, started_at, ended_at)
               VALUES (?,?,?,?,?,?,?,?)""",
            (body.mode, body.task_label, body.planned_secs, body.actual_secs,
             int(body.completed), body.interruptions, body.started_at, body.ended_at),
        )
        await db.commit()
        row = await db.execute_fetchall("SELECT * FROM sessions WHERE id=?", (cursor.lastrowid,))
    return dict(row[0])


@router.get("")
async def list_sessions(
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    mode: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
):
    clauses = []
    params: list = []
    if from_date:
        clauses.append("date(started_at) >= ?")
        params.append(from_date)
    if to_date:
        clauses.append("date(started_at) <= ?")
        params.append(to_date)
    if mode:
        clauses.append("mode = ?")
        params.append(mode)
    where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
    async with get_db() as db:
        rows = await db.execute_fetchall(
            f"SELECT * FROM sessions {where} ORDER BY started_at DESC LIMIT ? OFFSET ?",
            [*params, limit, offset],
        )
        count = await db.execute_fetchall(
            f"SELECT COUNT(*) as n FROM sessions {where}", params
        )
    return {"sessions": [dict(r) for r in rows], "total": count[0]["n"]}


@router.delete("/{session_id}")
async def delete_session(session_id: int):
    async with get_db() as db:
        result = await db.execute("DELETE FROM sessions WHERE id=?", (session_id,))
        await db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"deleted": True}


@router.get("/export/csv")
async def export_csv():
    async with get_db() as db:
        rows = await db.execute_fetchall(
            "SELECT id,mode,task_label,planned_secs,actual_secs,completed,interruptions,started_at,ended_at "
            "FROM sessions ORDER BY started_at ASC"
        )

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["id", "mode", "task_label", "planned_secs", "actual_secs",
                     "completed", "interruptions", "started_at", "ended_at"])
    for row in rows:
        writer.writerow(list(dict(row).values()))

    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sessions.csv"},
    )
