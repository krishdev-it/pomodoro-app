import os


async def test_backup_status_initially_empty(client):
    r = await client.get("/api/backup/status")
    assert r.status_code == 200
    data = r.json()
    assert data["last_backup"] is None
    assert data["backup_count"] == 0
    assert data["backups"] == []


async def test_trigger_backup_returns_file_info(client):
    r = await client.post("/api/backup/trigger")
    assert r.status_code == 200
    data = r.json()
    assert "filename" in data
    assert data["size_bytes"] > 0
    assert os.path.exists(data["filename"])


async def test_backup_status_after_trigger(client):
    await client.post("/api/backup/trigger")
    r = await client.get("/api/backup/status")
    data = r.json()
    assert data["backup_count"] == 1
    assert data["last_backup"] is not None
    assert len(data["backups"]) == 1


async def test_multiple_triggers_accumulate(client):
    await client.post("/api/backup/trigger")
    await client.post("/api/backup/trigger")
    data = (await client.get("/api/backup/status")).json()
    assert data["backup_count"] == 2


async def test_download_backup(client):
    trigger = await client.post("/api/backup/trigger")
    full_path = trigger.json()["filename"]
    filename = os.path.basename(full_path)

    r = await client.get(f"/api/backup/download/{filename}")
    assert r.status_code == 200
    assert len(r.content) > 0


async def test_download_nonexistent_backup_returns_404(client):
    r = await client.get("/api/backup/download/nonexistent.db")
    assert r.status_code == 404


async def test_download_path_traversal_blocked(client):
    # %2e%2e decodes to ".." inside the path param without introducing a literal "/"
    # that Starlette would split on. The explicit ".." check in the route returns 403.
    r = await client.get("/api/backup/download/%2e%2e")
    assert r.status_code == 403
