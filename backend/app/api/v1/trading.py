from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from app.api.v1.auth import get_current_user
from app.trading.engine import trading_engine
from app.core.database import get_db

router = APIRouter(prefix="/trading", tags=["Simulated Paper Trading"])

class PlaceOrderRequest(BaseModel):
    symbol: str
    side: str              # 'BUY' | 'SELL'
    order_type: str        # 'MARKET' | 'LIMIT'
    quantity: int
    limit_price: Optional[float] = None
    trigger_price: Optional[float] = None
    idempotency_key: Optional[str] = None

@router.get("/account")
def get_account(current_user: dict = Depends(get_current_user)):
    """Retrieve simulated trading account balance and parameters."""
    account = trading_engine.get_or_create_account(current_user["id"])
    return {
        "account": account,
        "disclaimer": "Simulated paper trading funds only. Real money deposits and withdrawals are strictly disabled."
    }

@router.post("/account/reset")
def reset_account(current_user: dict = Depends(get_current_user)):
    """Reset simulated portfolio and cash balance back to ₹10,00,000."""
    return trading_engine.reset_account(current_user["id"])

@router.post("/orders")
def place_order(req: PlaceOrderRequest, current_user: dict = Depends(get_current_user)):
    """Place a simulated Buy or Sell order (Market or Limit)."""
    res = trading_engine.place_order(
        user_id=current_user["id"],
        symbol=req.symbol,
        side=req.side,
        order_type=req.order_type,
        quantity=req.quantity,
        limit_price=req.limit_price,
        trigger_price=req.trigger_price,
        idempotency_key=req.idempotency_key
    )
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Order failed"))
    return res

@router.get("/orders")
def list_orders(
    status: Optional[str] = Query(None, description="ALL | PENDING | EXECUTED | CANCELLED | REJECTED"),
    symbol: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Retrieve user's simulated order history."""
    user_id = current_user["id"]
    with get_db() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM orders WHERE user_id = ?"
        params = [user_id]

        if status and status.upper() != "ALL":
            query += " AND status = ?"
            params.append(status.upper())
        if symbol:
            query += " AND symbol = ?"
            params.append(symbol.upper())

        query += " ORDER BY created_at DESC"
        cursor.execute(query, params)
        orders = [dict(o) for o in cursor.fetchall()]

        return {"count": len(orders), "orders": orders}

@router.get("/orders/{order_id}")
def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    """Retrieve specific simulated order."""
    user_id = current_user["id"]
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM orders WHERE id = ? AND user_id = ?", (order_id, user_id))
        order = cursor.fetchone()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found.")
        return {"order": dict(order)}

@router.post("/orders/{order_id}/cancel")
def cancel_order(order_id: str, current_user: dict = Depends(get_current_user)):
    """Cancel a pending simulated limit order."""
    res = trading_engine.cancel_order(current_user["id"], order_id)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Cancel failed"))
    return res

@router.get("/trades")
def list_trades(
    symbol: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Retrieve executed trade transactions ledger."""
    user_id = current_user["id"]
    with get_db() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM trades WHERE user_id = ?"
        params = [user_id]
        if symbol:
            query += " AND symbol = ?"
            params.append(symbol.upper())
        query += " ORDER BY executed_at DESC"
        cursor.execute(query, params)
        trades = [dict(t) for t in cursor.fetchall()]
        return {"count": len(trades), "trades": trades}

@router.get("/ledger")
def list_ledger_entries(current_user: dict = Depends(get_current_user)):
    """Retrieve virtual cash ledger entries with running balance."""
    account = trading_engine.get_or_create_account(current_user["id"])
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM simulated_cash_ledger
            WHERE account_id = ?
            ORDER BY created_at DESC
        """, (account["id"],))
        entries = [dict(e) for e in cursor.fetchall()]
        return {"count": len(entries), "ledger": entries}
