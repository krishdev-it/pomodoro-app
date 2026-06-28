from datetime import datetime, timezone

_NOW = datetime.now(timezone.utc).isoformat()
_TODAY = _NOW[:10]

VALID = {
    "mode": "focus",
    "task_label": "Write tests",
    "planned_secs": 1500,
    "actual_secs": 1500,
    "completed": True,
    "interruptions": 0,
    "started_at": _NOW,
    "ended_at": _NOW,
}


async def test_create_session_returns_201(client):
    r = await client.post("/api/sessions", json=VALID)
    assert r.status_code == 201
    data = r.json()
    assert data["id"] >= 1
    assert data["mode"] == "focus"
    assert data["task_label"] == "Write tests"
    assert data["completed"] == 1


async def test_create_session_missing_required_field_returns_422(client):
    r = await client.post("/api/sessions", json={"mode": "focus"})
    assert r.status_code == 422


async def test_create_session_invalid_mode_returns_422(client):
    r = await client.post("/api/sessions", json={**VALID, "mode": "invalid"})
    assert r.status_code == 422


async def test_list_sessions_initially_empty(client):
    r = await client.get("/api/sessions")
    assert r.status_code == 200
    assert r.json()["sessions"] == []
    assert r.json()["total"] == 0


async def test_list_sessions_returns_created_session(client):
    await client.post("/api/sessions", json=VALID)
    r = await client.get("/api/sessions")
    assert r.json()["total"] == 1
    assert r.json()["sessions"][0]["mode"] == "focus"


async def test_list_sessions_filter_by_mode(client):
    await client.post("/api/sessions", json=VALID)
    await client.post("/api/sessions", json={**VALID, "mode": "short_break"})

    r_focus = await client.get("/api/sessions?mode=focus")
    assert r_focus.json()["total"] == 1

    r_break = await client.get("/api/sessions?mode=short_break")
    assert r_break.json()["total"] == 1


async def test_list_sessions_filter_by_date_range(client):
    await client.post("/api/sessions", json=VALID)

    r = await client.get(f"/api/sessions?from={_TODAY}&to={_TODAY}")
    assert r.json()["total"] == 1

    r_empty = await client.get("/api/sessions?from=2000-01-01&to=2000-01-02")
    assert r_empty.json()["total"] == 0


async def test_delete_session(client):
    created = await client.post("/api/sessions", json=VALID)
    sid = created.json()["id"]

    r = await client.delete(f"/api/sessions/{sid}")
    assert r.status_code == 200
    assert r.json()["deleted"] is True

    assert (await client.get("/api/sessions")).json()["total"] == 0


async def test_delete_nonexistent_session_returns_404(client):
    r = await client.delete("/api/sessions/9999")
    assert r.status_code == 404


async def test_export_csv_content_type(client):
    await client.post("/api/sessions", json=VALID)
    r = await client.get("/api/sessions/export/csv")
    assert r.status_code == 200
    assert "text/csv" in r.headers["content-type"]


async def test_export_csv_has_correct_header_row(client):
    r = await client.get("/api/sessions/export/csv")
    first_line = r.text.strip().split("\n")[0]
    assert first_line == "id,mode,task_label,planned_secs,actual_secs,completed,interruptions,started_at,ended_at"


async def test_export_csv_contains_session_data(client):
    await client.post("/api/sessions", json=VALID)
    r = await client.get("/api/sessions/export/csv")
    lines = r.text.strip().split("\n")
    assert len(lines) == 2  # header + 1 row
    assert "focus" in lines[1]
