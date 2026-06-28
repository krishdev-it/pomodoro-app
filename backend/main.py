import os
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from backend.database import init_db
from backend.scheduler import scheduler
from backend.routers import settings, sessions, analytics, audio, playlist, backup

DIST_DIR = Path(__file__).parent.parent / "dist"


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    scheduler.start()
    yield
    scheduler.shutdown(wait=False)


app = FastAPI(lifespan=lifespan, docs_url="/api/docs", redoc_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(settings.router)
app.include_router(sessions.router)
app.include_router(analytics.router)
app.include_router(audio.router)
app.include_router(playlist.router)
app.include_router(backup.router)

# Serve built React in production
if DIST_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="assets")

    # Serve root-level static files explicitly so the SPA catch-all doesn't swallow them
    for _static_file in DIST_DIR.glob("*"):
        if _static_file.is_file() and _static_file.name != "index.html":
            _name = _static_file.name
            _path = str(_static_file)
            app.add_api_route(
                f"/{_name}",
                lambda p=_path: FileResponse(p),
                include_in_schema=False,
            )

    @app.get("/", include_in_schema=False)
    async def root():
        return FileResponse(str(DIST_DIR / "index.html"))

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(full_path: str):
        return FileResponse(str(DIST_DIR / "index.html"))
