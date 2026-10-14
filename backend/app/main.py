import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db, seed_master_data
from app.market_data.scheduler import start_market_scheduler
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.stocks import router as stocks_router
from app.api.v1.market import router as market_router
from app.api.v1.watchlists import router as watchlists_router
from app.api.v1.trading import router as trading_router
from app.api.v1.portfolio import router as portfolio_router
from app.api.v1.ai import router as ai_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("vibefinance")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing VibeFinance Database & Master Seeding...")
    init_db()
    seed_master_data()
    logger.info("Database and curated 100 stock universe ready.")

    # Start 5-minute background market refresh scheduler
    scheduler_task = asyncio.create_task(start_market_scheduler())
    
    yield

    logger.info("Shutting down VibeFinance...")
    scheduler_task.cancel()
    try:
        await scheduler_task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title="VibeFinance — Indian Stock Market & AI Investment Intelligence Platform",
    description="""
    Comprehensive Indian stock market intelligence platform inspired by Zerodha Kite and INDmoney.
    Features:
    - Exactly 100 stocks across exactly 10 sectors.
    - Free development Yahoo Finance (yfinance) adapter with 5-minute refresh cadence and honest freshness status.
    - Simulated paper-trading engine with virtual starting funds (₹10,00,000), double-entry cash ledger, and FIFO/weighted average cost accounting.
    - Interactive technical charting and indicators (SMA, EMA, RSI, MACD, Bollinger Bands).
    - AI-powered macro market pulse, company deep research, portfolio concentration risk audit, and behavioral trading analytics.
    """,
    version=settings.VERSION,
    lifespan=lifespan
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers under /api/v1
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(users_router, prefix=settings.API_V1_STR)
app.include_router(stocks_router, prefix=settings.API_V1_STR)
app.include_router(market_router, prefix=settings.API_V1_STR)
app.include_router(watchlists_router, prefix=settings.API_V1_STR)
app.include_router(trading_router, prefix=settings.API_V1_STR)
app.include_router(portfolio_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "mode": "Simulated Paper Trading & Market Intelligence"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
