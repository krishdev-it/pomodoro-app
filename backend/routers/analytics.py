from datetime import date, timedelta
from typing import Optional
from fastapi import APIRouter, Query
from backend.database import get_db

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def _period_bounds(period: str, anchor: str) -> tuple[str, str]:
    d = date.fromisoformat(anchor)
    if period == "day":
        return str(d), str(d)
    if period == "week":
        start = d - timedelta(days=d.weekday())
        return str(start), str(start + timedelta(days=6))
    if period == "month":
        start = d.replace(day=1)
        if d.month == 12:
            end = d.replace(year=d.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            end = d.replace(month=d.month + 1, day=1) - timedelta(days=1)
        return str(start), str(end)
    # year
    return f"{d.year}-01-01", f"{d.year}-12-31"


async def _streak(db) -> tuple[int, int]:
    rows = await db.execute_fetchall(
        """SELECT DISTINCT date(started_at) as d FROM sessions
           WHERE mode='focus' AND completed=1
           ORDER BY d DESC"""
    )
    dates = [date.fromisoformat(r["d"]) for r in rows]
    if not dates:
        return 0, 0

    today = date.today()
    current = 0
    if dates[0] >= today - timedelta(days=1):
        cur = dates[0]
        for d in dates:
            if d == cur:
                current += 1
                cur -= timedelta(days=1)
            else:
                break

    longest = 1
    run = 1
    for i in range(1, len(dates)):
        if dates[i - 1] - dates[i] == timedelta(days=1):
            run += 1
            longest = max(longest, run)
        else:
            run = 1
    return current, longest


@router.get("/summary")
async def get_summary(
    period: str = Query("week", pattern="^(day|week|month|year)$"),
    anchor: Optional[str] = Query(None, alias="date"),
):
    if not anchor:
        anchor = str(date.today())
    from_d, to_d = _period_bounds(period, anchor)

    async with get_db() as db:
        focus = await db.execute_fetchall(
            """SELECT
                 COALESCE(SUM(actual_secs),0) as total_focus_secs,
                 COUNT(*) as total_sessions,
                 SUM(completed) as completed_sessions,
                 COALESCE(SUM(interruptions),0) as total_interruptions
               FROM sessions
               WHERE mode='focus' AND date(started_at) BETWEEN ? AND ?""",
            (from_d, to_d),
        )
        best = await db.execute_fetchall(
            """SELECT date(started_at) as d, SUM(actual_secs) as secs
               FROM sessions WHERE mode='focus' AND completed=1
               GROUP BY d ORDER BY secs DESC LIMIT 1"""
        )
        current_streak, longest_streak = await _streak(db)
        days_count_row = await db.execute_fetchall(
            """SELECT COUNT(DISTINCT date(started_at)) as n
               FROM sessions WHERE mode='focus' AND completed=1
               AND date(started_at) BETWEEN ? AND ?""",
            (from_d, to_d),
        )

    f = dict(focus[0])
    days = max(days_count_row[0]["n"], 1)
    avg = int(f["total_focus_secs"]) // days if days else 0

    return {
        "total_focus_secs": int(f["total_focus_secs"]),
        "total_sessions": int(f["total_sessions"]),
        "completed_sessions": int(f["completed_sessions"] or 0),
        "total_interruptions": int(f["total_interruptions"]),
        "current_streak_days": current_streak,
        "longest_streak_days": longest_streak,
        "best_day": dict(best[0]) if best else None,
        "avg_daily_focus_secs": avg,
    }


@router.get("/daily")
async def get_daily(
    from_date: str = Query(..., alias="from"),
    to_date: str = Query(..., alias="to"),
):
    async with get_db() as db:
        rows = await db.execute_fetchall(
            """SELECT date(started_at) as d,
                      COALESCE(SUM(CASE WHEN mode='focus' THEN actual_secs END),0) as focus_secs,
                      COUNT(*) as sessions,
                      SUM(completed) as completed
               FROM sessions
               WHERE date(started_at) BETWEEN ? AND ?
               GROUP BY d ORDER BY d ASC""",
            (from_date, to_date),
        )
    return {"days": [dict(r) for r in rows]}
