import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "VibeFinance"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_PATH: str = os.getenv("DATABASE_PATH", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "vibefinance.db")))
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "vibefinance-super-secret-jwt-key-2026-production-ready")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Paper Trading Defaults
    DEFAULT_STARTING_BALANCE: float = 1_000_000.0  # ₹10,00,000 (10 Lakhs Virtual Funds)
    SIMULATED_COMMISSION_PCT: float = 0.05 / 100    # 0.05% brokerage simulation
    
    # Market Data Caching & Freshness
    REFRESH_INTERVAL_SECONDS: int = 300            # 5-minute background refresh attempt
    STALE_THRESHOLD_SECONDS: int = 900             # 15 minutes before marking quote as stale
    QUOTE_MAX_AGE_FOR_MARKET_ORDER: int = 86400 * 4 # Max permitted age for simulated market order (accounting for weekends/holidays)
    
    # AI / Provider Config
    MARKET_DATA_PROVIDER: str = "Yahoo Finance via yfinance"
    ALLOW_MOCK_FALLBACK: bool = False             # Never fabricate live quotes

settings = Settings()
