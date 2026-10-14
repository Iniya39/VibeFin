import math
from typing import Optional, List, Any
from fastapi import APIRouter, HTTPException, Query
from app.market_data.symbols import STOCK_UNIVERSE, SECTORS, SYMBOL_MAP
from app.market_data.service import market_data_service
from app.core.database import get_db

def sanitize_for_json(obj: Any) -> Any:
    """Recursively replace NaN and Inf float values with None to guarantee JSON compliance."""
    if isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_for_json(v) for v in obj]
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    return obj

router = APIRouter(prefix="/stocks", tags=["Stocks & Universe"])

@router.get("")
def list_stocks(
    search: Optional[str] = None,
    sector: Optional[str] = None,
    exchange: Optional[str] = None,
    sort_by: Optional[str] = Query(None, description="price | change_pct | volume | name | symbol"),
    sort_order: Optional[str] = Query("desc", description="asc | desc"),
    filter_type: Optional[str] = Query(None, description="gainers | losers")
):
    """
    Search, filter, and sort across the curated 100-stock Indian stock universe.
    All stock items are enriched with their latest available price quote.
    """
    results = []
    search_term = search.lower().strip() if search else None

    # Fetch cached quotes from DB
    quotes_map = {}
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM market_quotes")
        for q in cursor.fetchall():
            quotes_map[q["symbol"]] = dict(q)

    for s in STOCK_UNIVERSE:
        # Search filter
        if search_term:
            match_sym = search_term in s["symbol"].lower()
            match_name = search_term in s["name"].lower()
            match_sub = search_term in s["subsector"].lower() if s.get("subsector") else False
            if not (match_sym or match_name or match_sub):
                continue

        # Sector filter
        if sector and s["sector_id"] != sector and s["sector_name"].lower() != sector.lower():
            continue

        # Exchange filter
        if exchange and s["exchange"].upper() != exchange.upper():
            continue

        # Attach quote
        q_data = quotes_map.get(s["symbol"], {})
        price = q_data.get("price")
        prev_close = q_data.get("previous_close")
        change = None
        change_pct = None
        if price is not None and prev_close is not None and prev_close > 0:
            change = round(price - prev_close, 2)
            change_pct = round((change / prev_close) * 100, 2)

        item = {
            "symbol": s["symbol"],
            "name": s["name"],
            "exchange": s["exchange"],
            "provider_symbol": s["provider_symbol"],
            "sector_id": s["sector_id"],
            "sector_name": s["sector_name"],
            "subsector": s["subsector"],
            "currency": s["currency"],
            "is_semiconductor_adjacent": s.get("is_semiconductor_adjacent", False),
            "price": price,
            "previous_close": prev_close,
            "change": change,
            "change_pct": change_pct,
            "volume": q_data.get("volume"),
            "data_status": q_data.get("data_status", "unavailable"),
            "fetched_at": q_data.get("fetched_at"),
            "source": q_data.get("source", "Yahoo Finance via yfinance")
        }

        # Gainers / Losers filter
        if filter_type == "gainers" and (change_pct is None or change_pct <= 0):
            continue
        if filter_type == "losers" and (change_pct is None or change_pct >= 0):
            continue

        results.append(item)

    # Sorting
    if sort_by:
        reverse = (sort_order.lower() == "desc")
        if sort_by == "price":
            results.sort(key=lambda x: (x["price"] is not None, x["price"] or 0), reverse=reverse)
        elif sort_by == "change_pct":
            results.sort(key=lambda x: (x["change_pct"] is not None, x["change_pct"] or 0), reverse=reverse)
        elif sort_by == "volume":
            results.sort(key=lambda x: (x["volume"] is not None, x["volume"] or 0), reverse=reverse)
        elif sort_by == "name":
            results.sort(key=lambda x: x["name"], reverse=reverse)
        elif sort_by == "symbol":
            results.sort(key=lambda x: x["symbol"], reverse=reverse)

    return {
        "count": len(results),
        "total_universe": len(STOCK_UNIVERSE),
        "stocks": results
    }

@router.get("/sectors")
def list_sectors():
    """Returns the 10 configured sectors with stock counts derived from database."""
    sectors_list = []
    with get_db() as conn:
        cursor = conn.cursor()
        for sec in SECTORS:
            cursor.execute("SELECT COUNT(*) as count FROM stock_master WHERE sector_id = ?", (sec["id"],))
            cnt = cursor.fetchone()["count"]
            sectors_list.append({
                "id": sec["id"],
                "name": sec["name"],
                "description": sec["description"],
                "icon": sec["icon"],
                "stock_count": cnt
            })
    return {"sectors": sectors_list, "total_sectors": len(sectors_list)}

@router.get("/sectors/{sector_id}")
def get_sector_stocks(sector_id: str):
    """Returns all 10 stocks for a specific sector."""
    sec = next((s for s in SECTORS if s["id"] == sector_id), None)
    if not sec:
        raise HTTPException(status_code=404, detail="Sector not found")

    stocks = [s for s in STOCK_UNIVERSE if s["sector_id"] == sector_id]
    
    # Enrich with latest quotes
    enriched = []
    for s in stocks:
        q = market_data_service.get_stock_quote(s["symbol"])
        enriched.append({
            **s,
            "price": q.price,
            "change": q.change,
            "change_pct": q.change_pct,
            "volume": q.volume,
            "data_status": q.data_status,
            "fetched_at": q.fetched_at
        })

    return {
        "sector": sec,
        "stocks_count": len(enriched),
        "stocks": enriched
    }

@router.get("/{symbol}")
def get_stock_detail(symbol: str):
    """Get complete stock profile, latest quote, fundamentals, and recent orders."""
    symbol = symbol.upper()
    meta = SYMBOL_MAP.get(symbol)
    if not meta:
        raise HTTPException(status_code=404, detail=f"Stock {symbol} not found in 100-stock universe")

    try:
        quote = market_data_service.get_stock_quote(symbol)
        quote_dict = quote.model_dump()
    except Exception:
        quote_dict = {"symbol": symbol, "data_status": "unavailable", "price": None}

    try:
        fundamentals = market_data_service.get_fundamentals(symbol)
        fundamentals_dict = fundamentals.model_dump()
    except Exception:
        fundamentals_dict = {"symbol": symbol, "name": meta.get("name")}

    return sanitize_for_json({
        "instrument": meta,
        "quote": quote_dict,
        "fundamentals": fundamentals_dict,
        "disclaimer": "Simulated trading data adapter. Not official exchange redistribution feed."
    })

@router.get("/{symbol}/quote")
def get_stock_quote(symbol: str, force_refresh: bool = False):
    """Retrieve the latest available quote with explicit freshness status."""
    symbol = symbol.upper()
    if symbol not in SYMBOL_MAP:
        raise HTTPException(status_code=404, detail=f"Stock {symbol} not found")
    
    quote = market_data_service.get_stock_quote(symbol, force_refresh=force_refresh)
    return sanitize_for_json(quote.model_dump())

@router.get("/{symbol}/history")
def get_stock_history(
    symbol: str,
    period: str = Query("1mo", description="1d | 5d | 1mo | 3mo | 6mo | 1y | 5y"),
    interval: str = Query("1d", description="5m | 15m | 1h | 1d | 1wk")
):
    """Retrieve historical price bars with pre-calculated technical indicators."""
    symbol = symbol.upper()
    if symbol not in SYMBOL_MAP:
        raise HTTPException(status_code=404, detail=f"Stock {symbol} not found")

    bars = market_data_service.get_history(symbol, period=period, interval=interval)
    indicators = market_data_service.calculate_indicators(bars)

    return sanitize_for_json({
        "symbol": symbol,
        "period": period,
        "interval": interval,
        "bars_count": len(bars),
        "bars": bars,
        "indicators": indicators
    })

@router.get("/{symbol}/fundamentals")
def get_stock_fundamentals(symbol: str):
    """Retrieve fundamental ratios, financial statements, and business summary."""
    symbol = symbol.upper()
    if symbol not in SYMBOL_MAP:
        raise HTTPException(status_code=404, detail=f"Stock {symbol} not found")

    return sanitize_for_json(market_data_service.get_fundamentals(symbol).model_dump())
