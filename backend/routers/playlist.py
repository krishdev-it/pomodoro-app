from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.database import get_db

router = APIRouter(prefix="/api/playlist", tags=["playlist"])


class PlaylistItemIn(BaseModel):
    url: str
    title: str = ""


class PlaylistItemPatch(BaseModel):
    title: Optional[str] = None
    position: Optional[int] = None


class ReorderIn(BaseModel):
    order: list[int]


@router.get("")
async def get_playlist():
    async with get_db() as db:
        rows = await db.execute_fetchall(
            "SELECT id, url, title, position FROM playlist ORDER BY position ASC"
        )
    return {"playlist": [dict(r) for r in rows]}


@router.post("", status_code=201)
async def add_item(body: PlaylistItemIn):
    async with get_db() as db:
        pos_row = await db.execute_fetchall("SELECT COALESCE(MAX(position),0)+1 as p FROM playlist")
        pos = pos_row[0]["p"]
        cursor = await db.execute(
            "INSERT INTO playlist (url, title, position) VALUES (?,?,?)",
            (body.url, body.title, pos),
        )
        await db.commit()
        rows = await db.execute_fetchall("SELECT * FROM playlist WHERE id=?", (cursor.lastrowid,))
    return dict(rows[0])


@router.patch("/{item_id}")
async def update_item(item_id: int, body: PlaylistItemPatch):
    async with get_db() as db:
        row = await db.execute_fetchall("SELECT * FROM playlist WHERE id=?", (item_id,))
        if not row:
            raise HTTPException(status_code=404, detail="Item not found")
        title = body.title if body.title is not None else row[0]["title"]
        position = body.position if body.position is not None else row[0]["position"]
        await db.execute(
            "UPDATE playlist SET title=?, position=? WHERE id=?",
            (title, position, item_id),
        )
        await db.commit()
        updated = await db.execute_fetchall("SELECT * FROM playlist WHERE id=?", (item_id,))
    return dict(updated[0])


@router.delete("/{item_id}")
async def delete_item(item_id: int):
    async with get_db() as db:
        result = await db.execute("DELETE FROM playlist WHERE id=?", (item_id,))
        await db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"deleted": True}


@router.put("/reorder")
async def reorder(body: ReorderIn):
    async with get_db() as db:
        for pos, item_id in enumerate(body.order):
            await db.execute("UPDATE playlist SET position=? WHERE id=?", (pos, item_id))
        await db.commit()
    return {"reordered": True}
