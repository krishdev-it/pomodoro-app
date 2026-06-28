import os
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse, Response
import aiofiles
import aiofiles.os

router = APIRouter(prefix="/api/audio", tags=["audio"])

AUDIO_DIR = Path(os.environ.get("AUDIO_DIR", "/data/audio"))
ALLOWED_EXT = {".mp3", ".wav", ".ogg", ".flac", ".m4a"}
MIME_MAP = {
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    ".flac": "audio/flac",
    ".m4a": "audio/mp4",
}
CHUNK = 1024 * 64


def _safe_path(filename: str) -> Path:
    p = (AUDIO_DIR / filename).resolve()
    if not str(p).startswith(str(AUDIO_DIR.resolve())):
        raise HTTPException(status_code=403, detail="Access denied")
    return p


@router.get("/files")
async def list_files():
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    files = []
    for entry in sorted(AUDIO_DIR.iterdir()):
        if entry.suffix.lower() in ALLOWED_EXT and entry.is_file():
            files.append({
                "name": entry.name,
                "url": f"/api/audio/stream/{entry.name}",
                "size_bytes": entry.stat().st_size,
            })
    return {"files": files}


@router.get("/stream/{filename}")
async def stream_audio(filename: str, request: Request):
    path = _safe_path(filename)
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    ext = path.suffix.lower()
    mime = MIME_MAP.get(ext, "application/octet-stream")
    file_size = path.stat().st_size

    range_header = request.headers.get("range")
    if range_header:
        try:
            unit, rng = range_header.split("=")
            start_str, end_str = rng.split("-")
            start = int(start_str)
            end = int(end_str) if end_str else file_size - 1
        except Exception:
            raise HTTPException(status_code=416, detail="Invalid Range header")

        end = min(end, file_size - 1)
        length = end - start + 1

        async def ranged():
            async with aiofiles.open(path, "rb") as f:
                await f.seek(start)
                remaining = length
                while remaining > 0:
                    chunk = await f.read(min(CHUNK, remaining))
                    if not chunk:
                        break
                    remaining -= len(chunk)
                    yield chunk

        return StreamingResponse(
            ranged(),
            status_code=206,
            media_type=mime,
            headers={
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Content-Length": str(length),
                "Accept-Ranges": "bytes",
            },
        )

    async def full():
        async with aiofiles.open(path, "rb") as f:
            while True:
                chunk = await f.read(CHUNK)
                if not chunk:
                    break
                yield chunk

    return StreamingResponse(
        full(),
        media_type=mime,
        headers={
            "Content-Length": str(file_size),
            "Accept-Ranges": "bytes",
        },
    )
