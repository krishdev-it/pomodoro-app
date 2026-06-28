ITEM = {"url": "https://www.youtube.com/watch?v=abc123xyz_A", "title": "Focus Music"}
ITEM_B = {"url": "https://youtu.be/bbb222yyy_B", "title": "Ambient Rain"}


async def test_get_playlist_initially_empty(client):
    r = await client.get("/api/playlist")
    assert r.status_code == 200
    assert r.json()["playlist"] == []


async def test_add_item_returns_201(client):
    r = await client.post("/api/playlist", json=ITEM)
    assert r.status_code == 201
    data = r.json()
    assert data["url"] == ITEM["url"]
    assert data["title"] == ITEM["title"]
    assert data["id"] >= 1


async def test_get_playlist_returns_added_item(client):
    await client.post("/api/playlist", json=ITEM)
    r = await client.get("/api/playlist")
    assert len(r.json()["playlist"]) == 1
    assert r.json()["playlist"][0]["title"] == "Focus Music"


async def test_multiple_items_ordered_by_position(client):
    await client.post("/api/playlist", json=ITEM)
    await client.post("/api/playlist", json=ITEM_B)
    items = (await client.get("/api/playlist")).json()["playlist"]
    assert len(items) == 2
    assert items[0]["position"] < items[1]["position"]


async def test_delete_item(client):
    created = await client.post("/api/playlist", json=ITEM)
    iid = created.json()["id"]

    r = await client.delete(f"/api/playlist/{iid}")
    assert r.status_code == 200
    assert r.json()["deleted"] is True

    assert (await client.get("/api/playlist")).json()["playlist"] == []


async def test_delete_nonexistent_item_returns_404(client):
    r = await client.delete("/api/playlist/9999")
    assert r.status_code == 404


async def test_patch_item_title(client):
    created = await client.post("/api/playlist", json=ITEM)
    iid = created.json()["id"]

    r = await client.patch(f"/api/playlist/{iid}", json={"title": "Updated Title"})
    assert r.status_code == 200
    assert r.json()["title"] == "Updated Title"


async def test_patch_nonexistent_item_returns_404(client):
    r = await client.patch("/api/playlist/9999", json={"title": "x"})
    assert r.status_code == 404


async def test_reorder_changes_position(client):
    a = (await client.post("/api/playlist", json=ITEM)).json()
    b = (await client.post("/api/playlist", json=ITEM_B)).json()

    r = await client.put("/api/playlist/reorder", json={"order": [b["id"], a["id"]]})
    assert r.status_code == 200

    items = (await client.get("/api/playlist")).json()["playlist"]
    assert items[0]["id"] == b["id"]
    assert items[1]["id"] == a["id"]
