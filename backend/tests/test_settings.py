async def test_get_settings_returns_defaults(client):
    r = await client.get("/api/settings")
    assert r.status_code == 200
    data = r.json()
    assert data["focus_duration"] == 1500
    assert data["short_break_duration"] == 300
    assert data["long_break_duration"] == 900
    assert data["long_break_interval"] == 4


async def test_get_settings_types_are_correct(client):
    r = await client.get("/api/settings")
    data = r.json()
    assert isinstance(data["focus_duration"], int)
    assert isinstance(data["auto_start_breaks"], bool)
    assert isinstance(data["notification_sound"], str)
    assert isinstance(data["ambient_volume"], float)


async def test_patch_settings_persists(client):
    r = await client.patch("/api/settings", json={"focus_duration": 1200})
    assert r.status_code == 200
    assert "focus_duration" in r.json()["updated"]

    r2 = await client.get("/api/settings")
    assert r2.json()["focus_duration"] == 1200


async def test_patch_settings_multiple_keys(client):
    r = await client.patch("/api/settings", json={
        "focus_duration": 900,
        "auto_start_breaks": True,
    })
    assert r.status_code == 200
    assert set(r.json()["updated"]) == {"focus_duration", "auto_start_breaks"}

    data = (await client.get("/api/settings")).json()
    assert data["focus_duration"] == 900
    assert data["auto_start_breaks"] is True


async def test_patch_settings_unknown_key_is_accepted(client):
    r = await client.patch("/api/settings", json={"custom_key": "hello"})
    assert r.status_code == 200


async def test_patch_settings_empty_body_returns_400(client):
    r = await client.patch("/api/settings", json={})
    assert r.status_code == 400
