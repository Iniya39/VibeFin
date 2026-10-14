import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.market_data.symbols import SYMBOL_MAP
from app.market_data.service import market_data_service

router = APIRouter(prefix="/watchlists", tags=["Watchlists"])

class CreateWatchlistRequest(BaseModel):
    name: str

class RenameWatchlistRequest(BaseModel):
    name: str

class AddStockRequest(BaseModel):
    symbol: str

@router.get("")
def list_watchlists(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM watchlists WHERE user_id = ? ORDER BY is_default DESC, created_at ASC", (user_id,))
        watchlists = [dict(w) for w in cursor.fetchall()]

        for w in watchlists:
            cursor.execute("""
                SELECT wi.id, wi.symbol, wi.sort_order, wi.added_at, sm.name, sm.exchange, sm.sector_name
                FROM watchlist_items wi
                JOIN stock_master sm ON wi.symbol = sm.symbol
                WHERE wi.watchlist_id = ?
                ORDER BY wi.sort_order ASC, wi.added_at ASC
            """, (w["id"],))
            items = [dict(item) for item in cursor.fetchall()]

            # Enrich items with live quote
            for item in items:
                q = market_data_service.get_stock_quote(item["symbol"])
                item["price"] = q.price
                item["previous_close"] = q.previous_close
                item["change"] = q.change
                item["change_pct"] = q.change_pct
                item["data_status"] = q.data_status
                item["fetched_at"] = q.fetched_at

            w["items"] = items
            w["item_count"] = len(items)

        return {"watchlists": watchlists}

@router.post("")
def create_watchlist(req: CreateWatchlistRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    now_iso = datetime.now(timezone.utc).isoformat()
    watchlist_id = str(uuid.uuid4())

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO watchlists (id, user_id, name, is_default, created_at)
            VALUES (?, ?, ?, 0, ?)
        """, (watchlist_id, user_id, req.name.strip(), now_iso))

        return {
            "success": True,
            "watchlist": {
                "id": watchlist_id,
                "user_id": user_id,
                "name": req.name.strip(),
                "is_default": 0,
                "created_at": now_iso,
                "items": []
            }
        }

@router.patch("/{watchlist_id}")
def rename_watchlist(watchlist_id: str, req: RenameWatchlistRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM watchlists WHERE id = ? AND user_id = ?", (watchlist_id, user_id))
        w = cursor.fetchone()
        if not w:
            raise HTTPException(status_code=404, detail="Watchlist not found.")

        cursor.execute("UPDATE watchlists SET name = ? WHERE id = ?", (req.name.strip(), watchlist_id))
        return {"success": True, "message": f"Watchlist renamed to '{req.name.strip()}'"}

@router.delete("/{watchlist_id}")
def delete_watchlist(watchlist_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM watchlists WHERE id = ? AND user_id = ?", (watchlist_id, user_id))
        w = cursor.fetchone()
        if not w:
            raise HTTPException(status_code=404, detail="Watchlist not found.")

        cursor.execute("DELETE FROM watchlists WHERE id = ?", (watchlist_id,))
        return {"success": True, "message": "Watchlist deleted successfully."}

@router.post("/{watchlist_id}/stocks")
def add_stock_to_watchlist(watchlist_id: str, req: AddStockRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    symbol = req.symbol.upper().strip()
    
    if symbol not in SYMBOL_MAP:
        raise HTTPException(status_code=404, detail=f"Stock {symbol} not in 100-stock universe.")

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM watchlists WHERE id = ? AND user_id = ?", (watchlist_id, user_id))
        w = cursor.fetchone()
        if not w:
            raise HTTPException(status_code=404, detail="Watchlist not found.")

        cursor.execute("SELECT id FROM watchlist_items WHERE watchlist_id = ? AND symbol = ?", (watchlist_id, symbol))
        if cursor.fetchone():
            return {"success": True, "message": f"{symbol} is already in this watchlist."}

        now_iso = datetime.now(timezone.utc).isoformat()
        item_id = str(uuid.uuid4())
        cursor.execute("SELECT COUNT(*) as count FROM watchlist_items WHERE watchlist_id = ?", (watchlist_id,))
        cnt = cursor.fetchone()["count"]

        cursor.execute("""
            INSERT INTO watchlist_items (id, watchlist_id, symbol, sort_order, added_at)
            VALUES (?, ?, ?, ?, ?)
        """, (item_id, watchlist_id, symbol, cnt, now_iso))

        return {"success": True, "message": f"{symbol} added to watchlist."}

@router.delete("/{watchlist_id}/stocks/{symbol}")
def remove_stock_from_watchlist(watchlist_id: str, symbol: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    symbol = symbol.upper()

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM watchlists WHERE id = ? AND user_id = ?", (watchlist_id, user_id))
        w = cursor.fetchone()
        if not w:
            raise HTTPException(status_code=404, detail="Watchlist not found.")

        cursor.execute("DELETE FROM watchlist_items WHERE watchlist_id = ? AND symbol = ?", (watchlist_id, symbol))
        return {"success": True, "message": f"{symbol} removed from watchlist."}
