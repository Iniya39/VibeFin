from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, BackgroundTasks
from app.market_data.service import market_data_service
from app.core.config import settings

router = APIRouter(prefix="/market", tags=["Market Overview & Indices"])

@router.get("/overview")
def get_market_overview():
    """Returns top-level market dashboard overview."""
    return market_data_service.get_market_overview()

@router.get("/indices")
def get_indices():
    """Returns key benchmark indices (NIFTY 50, SENSEX)."""
    return {"indices": market_data_service.provider.get_indices()}

@router.get("/gainers")
def get_top_gainers():
    """Top 10 gainers across the 100-stock universe."""
    overview = market_data_service.get_market_overview()
    return {"gainers": overview.get("gainers", [])}

@router.get("/losers")
def get_top_losers():
    """Top 10 losers across the 100-stock universe."""
    overview = market_data_service.get_market_overview()
    return {"losers": overview.get("losers", [])}

@router.get("/sectors")
def get_sector_performance():
    """Returns sector performance aggregations."""
    overview = market_data_service.get_market_overview()
    return {"sector_performance": overview.get("sector_performance", {})}

@router.get("/status")
def get_market_status():
    """
    Returns data provider operational status, refresh schedules, and data freshness policies.
    """
    now_utc = datetime.now(timezone.utc)
    now_ist = now_utc + timedelta(hours=5, minutes=30)
    weekday = now_ist.weekday()
    if weekday in [5, 6]:
        status_label = "closed (weekend)"
    else:
        time_mins = now_ist.hour * 60 + now_ist.minute
        if 9 * 60 + 15 <= time_mins <= 15 * 60 + 30:
            status_label = "open (regular trading)"
        else:
            status_label = "closed (after-market)"

    return {
        "provider": settings.MARKET_DATA_PROVIDER,
        "market_status": status_label,
        "refresh_interval_seconds": settings.REFRESH_INTERVAL_SECONDS,
        "stale_threshold_seconds": settings.STALE_THRESHOLD_SECONDS,
        "last_refresh_attempt": market_data_service.last_refresh_attempt,
        "last_successful_refresh": market_data_service.last_successful_refresh,
        "disclaimer": "yfinance is a best-effort development adapter with no guaranteed real-time or redistribution warranty."
    }

@router.post("/refresh")
def trigger_market_refresh(background_tasks: BackgroundTasks):
    """Trigger background batch refresh of universe quotes."""
    background_tasks.add_task(market_data_service.refresh_universe_quotes)
    return {
        "message": "Market quote refresh initiated in the background.",
        "refresh_schedule": f"Every {settings.REFRESH_INTERVAL_SECONDS} seconds"
    }
