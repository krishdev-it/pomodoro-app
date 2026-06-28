from datetime import datetime, timezone, date

_NOW = datetime.now(timezone.utc).isoformat()
_TODAY = str(date.today())

FOCUS_SESSION = {
    "mode": "focus",
    "task_label": "",
    "planned_secs": 1500,
    "actual_secs": 1500,
    "completed": True,
    "interruptions": 0,
    "started_at": _NOW,
    "ended_at": _NOW,
}


async def test_summary_empty_db_returns_zeros(client):
    r = await client.get(f"/api/analytics/summary?period=day&date={_TODAY}")
    assert r.status_code == 200
    data = r.json()
    assert data["total_focus_secs"] == 0
    assert data["total_sessions"] == 0
    assert data["completed_sessions"] == 0
    assert data["current_streak_days"] == 0
    assert data["longest_streak_days"] == 0
    assert data["best_day"] is None


async def test_summary_counts_focus_session(client):
    await client.post("/api/sessions", json=FOCUS_SESSION)
    r = await client.get(f"/api/analytics/summary?period=day&date={_TODAY}")
    data = r.json()
    assert data["total_focus_secs"] == 1500
    assert data["total_sessions"] == 1
    assert data["completed_sessions"] == 1


async def test_summary_streak_after_session_today(client):
    await client.post("/api/sessions", json=FOCUS_SESSION)
    r = await client.get("/api/analytics/summary?period=week")
    assert r.json()["current_streak_days"] >= 1


async def test_summary_does_not_count_break_sessions_in_focus_secs(client):
    await client.post("/api/sessions", json={**FOCUS_SESSION, "mode": "short_break"})
    r = await client.get(f"/api/analytics/summary?period=day&date={_TODAY}")
    assert r.json()["total_focus_secs"] == 0


async def test_summary_period_week_is_valid(client):
    r = await client.get("/api/analytics/summary?period=week")
    assert r.status_code == 200


async def test_summary_period_month_is_valid(client):
    r = await client.get("/api/analytics/summary?period=month")
    assert r.status_code == 200


async def test_summary_period_year_is_valid(client):
    r = await client.get("/api/analytics/summary?period=year")
    assert r.status_code == 200


async def test_summary_invalid_period_returns_422(client):
    r = await client.get("/api/analytics/summary?period=decade")
    assert r.status_code == 422


async def test_daily_empty_range_returns_empty_list(client):
    r = await client.get(f"/api/analytics/daily?from={_TODAY}&to={_TODAY}")
    assert r.status_code == 200
    assert r.json()["days"] == []


async def test_daily_with_session_returns_entry(client):
    await client.post("/api/sessions", json=FOCUS_SESSION)
    r = await client.get(f"/api/analytics/daily?from={_TODAY}&to={_TODAY}")
    days = r.json()["days"]
    assert len(days) == 1
    assert days[0]["focus_secs"] == 1500
    assert days[0]["d"] == _TODAY


async def test_daily_missing_params_returns_422(client):
    r = await client.get("/api/analytics/daily")
    assert r.status_code == 422
