from fastapi import APIRouter, Depends
from app.api.v1.auth import get_current_user
from app.trading.engine import trading_engine
from app.market_data.service import market_data_service
from app.market_data.symbols import SYMBOL_MAP
from app.core.database import get_db

router = APIRouter(prefix="/portfolio", tags=["Portfolio & Holdings"])

@router.get("")
def get_portfolio_summary(current_user: dict = Depends(get_current_user)):
    """Complete portfolio dashboard summary."""
    account = trading_engine.get_or_create_account(current_user["id"])
    account_id = account["id"]
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM holdings WHERE account_id = ?", (account_id,))
        holdings_raw = [dict(h) for h in cursor.fetchall()]

    total_invested = 0.0
    total_market_val = 0.0
    total_realized_pnl = 0.0
    enriched_holdings = []
    sector_weights = {}

    for h in holdings_raw:
        sym = h["symbol"]
        meta = SYMBOL_MAP.get(sym, {})
        sec_name = meta.get("sector_name", "Other")

        quote = market_data_service.get_stock_quote(sym)
        curr_price = quote.price if quote.price is not None else h["average_price"]
        
        m_val = round(h["quantity"] * curr_price, 2)
        inv_val = round(h["quantity"] * h["average_price"], 2)
        unreal_pnl = round(m_val - inv_val, 2)
        unreal_pnl_pct = round((unreal_pnl / inv_val * 100), 2) if inv_val > 0 else 0.0

        total_invested += inv_val
        total_market_val += m_val
        total_realized_pnl += h.get("realized_pnl", 0.0)
        sector_weights[sec_name] = sector_weights.get(sec_name, 0.0) + m_val

        enriched_holdings.append({
            "id": h["id"],
            "symbol": sym,
            "name": meta.get("name", sym),
            "exchange": meta.get("exchange", "NSE"),
            "sector": sec_name,
            "quantity": h["quantity"],
            "average_price": h["average_price"],
            "current_price": curr_price,
            "invested_value": inv_val,
            "market_value": m_val,
            "unrealized_pnl": unreal_pnl,
            "unrealized_pnl_pct": unreal_pnl_pct,
            "realized_pnl": h.get("realized_pnl", 0.0),
            "price_data_status": quote.data_status,
            "price_fetched_at": quote.fetched_at
        })

    virtual_cash = account["virtual_balance"]
    total_portfolio_wealth = round(total_market_val + virtual_cash, 2)
    total_unrealized_pnl = round(total_market_val - total_invested, 2)
    overall_pnl = round(total_unrealized_pnl + total_realized_pnl, 2)
    overall_pnl_pct = round((overall_pnl / total_invested * 100), 2) if total_invested > 0 else 0.0

    for eh in enriched_holdings:
        eh["portfolio_weight_pct"] = round((eh["market_value"] / total_portfolio_wealth * 100), 2) if total_portfolio_wealth > 0 else 0.0

    return {
        "summary": {
            "total_portfolio_wealth": total_portfolio_wealth,
            "total_market_value": round(total_market_val, 2),
            "total_invested": round(total_invested, 2),
            "available_cash": virtual_cash,
            "unrealized_pnl": total_unrealized_pnl,
            "realized_pnl": round(total_realized_pnl, 2),
            "total_pnl": overall_pnl,
            "total_pnl_pct": overall_pnl_pct,
            "currency": "INR"
        },
        "holdings_count": len(enriched_holdings),
        "holdings": enriched_holdings,
        "disclaimer": "Simulated holdings & P&L. Not real financial assets."
    }

@router.get("/holdings")
def get_holdings(current_user: dict = Depends(get_current_user)):
    """Retrieve detailed holdings list."""
    summary = get_portfolio_summary(current_user)
    return {"holdings": summary["holdings"], "count": summary["holdings_count"]}

@router.get("/allocation")
def get_allocation(current_user: dict = Depends(get_current_user)):
    """Retrieve sector and asset class allocation breakdown."""
    summary = get_portfolio_summary(current_user)
    holdings = summary["holdings"]
    total_wealth = summary["summary"]["total_portfolio_wealth"]
    cash = summary["summary"]["available_cash"]

    sector_map = {}
    for h in holdings:
        s = h["sector"]
        sector_map[s] = sector_map.get(s, 0.0) + h["market_value"]

    sector_breakdown = [
        {"sector": sec, "value": round(val, 2), "weight_pct": round(val / total_wealth * 100, 2)}
        for sec, val in sector_map.items()
    ]
    sector_breakdown.append({
        "sector": "Simulated Cash",
        "value": round(cash, 2),
        "weight_pct": round(cash / total_wealth * 100, 2) if total_wealth > 0 else 100.0
    })

    stock_breakdown = [
        {"symbol": h["symbol"], "name": h["name"], "value": h["market_value"], "weight_pct": h["portfolio_weight_pct"]}
        for h in holdings
    ]

    return {
        "sector_allocation": sector_breakdown,
        "stock_allocation": stock_breakdown,
        "total_portfolio_wealth": total_wealth
    }

@router.get("/transactions")
def get_transactions(current_user: dict = Depends(get_current_user)):
    """Combined executed trades and cash ledger history."""
    user_id = current_user["id"]
    account = trading_engine.get_or_create_account(user_id)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM trades WHERE user_id = ? ORDER BY executed_at DESC", (user_id,))
        trades = [dict(t) for t in cursor.fetchall()]

        cursor.execute("SELECT * FROM simulated_cash_ledger WHERE account_id = ? ORDER BY created_at DESC", (account["id"],))
        ledger = [dict(l) for l in cursor.fetchall()]

        return {"trades": trades, "ledger": ledger}

@router.get("/risk")
def get_risk_metrics(current_user: dict = Depends(get_current_user)):
    """Calculate portfolio concentration warnings and diversification index."""
    summary = get_portfolio_summary(current_user)
    holdings = summary["holdings"]
    
    warnings = []
    for h in holdings:
        if h["portfolio_weight_pct"] > 30:
            warnings.append(f"High single-stock concentration: {h['symbol']} represents {h['portfolio_weight_pct']}% of total portfolio value.")

    return {
        "concentration_warnings": warnings,
        "active_positions": len(holdings),
        "diversification_status": "Healthy" if len(holdings) >= 5 and len(warnings) == 0 else "Concentrated"
    }
