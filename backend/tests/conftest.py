import os
from unittest.mock import MagicMock
import pytest_asyncio
from httpx import AsyncClient, ASGITransport


@pytest_asyncio.fixture
async def client(tmp_path, monkeypatch):
    """Fresh AsyncClient with an isolated SQLite database for each test.

    The lifespan calls init_db() automatically using the patched DB_PATH,
    so every test starts with a clean, fully-initialised database.
    The scheduler is replaced with a MagicMock to prevent background jobs.
    """
    db_file = str(tmp_path / "test.db")
    backup_dir = tmp_path / "backups"
    backup_dir.mkdir()

    # Patch database path before the lifespan runs
    import backend.database as db_module
    monkeypatch.setattr(db_module, "DB_PATH", db_file)

    # Patch backup router's own copies of DB_PATH and BACKUP_DIR
    import backend.routers.backup as backup_module
    monkeypatch.setattr(backup_module, "DB_PATH", db_file)
    monkeypatch.setattr(backup_module, "BACKUP_DIR", backup_dir)

    # Silence the APScheduler so no background jobs run during tests
    import backend.main as main_module
    monkeypatch.setattr(main_module, "scheduler", MagicMock())

    # Lifespan is NOT triggered by ASGITransport — initialise the DB manually
    await db_module.init_db()

    async with AsyncClient(
        transport=ASGITransport(app=main_module.app),
        base_url="http://test",
    ) as ac:
        yield ac
