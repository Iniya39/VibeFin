from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List
from pydantic import BaseModel

class NormalizedQuote(BaseModel):
    symbol: str
    exchange: str
    provider_symbol: str
    price: Optional[float] = None
    previous_close: Optional[float] = None
    open_price: Optional[float] = None
    day_high: Optional[float] = None
    day_low: Optional[float] = None
    volume: Optional[int] = None
    market_cap: Optional[float] = None
    currency: str = "INR"
    change: Optional[float] = None
    change_pct: Optional[float] = None
    source: str = "Yahoo Finance via yfinance"
    market_timestamp: Optional[str] = None
    fetched_at: str
    data_status: str  # 'fresh' | 'stale' | 'unavailable'
    market_state: Optional[str] = None
    warnings: Optional[str] = None

class HistoricalBar(BaseModel):
    timestamp: str
    open: float
    high: float
    low: float
    close: float
    volume: int

class Fundamentals(BaseModel):
    symbol: str
    provider_symbol: str
    name: Optional[str] = None
    sector: Optional[str] = None
    industry: Optional[str] = None
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None
    pb_ratio: Optional[float] = None
    dividend_yield: Optional[float] = None
    eps: Optional[float] = None
    high_52w: Optional[float] = None
    low_52w: Optional[float] = None
    roe: Optional[float] = None
    debt_to_equity: Optional[float] = None
    balance_sheet_debt: Optional[float] = None
    balance_sheet_equity: Optional[float] = None
    balance_sheet_period: Optional[str] = None
    capital_lease_obligations: Optional[float] = None
    debt_to_equity_ratio: Optional[float] = None
    debt_classification: Optional[str] = None
    debt_validation_notes: Optional[str] = None
    business_summary: Optional[str] = None
    financial_statements: Optional[Dict[str, Any]] = None
    source: str = "Yahoo Finance via yfinance"
    fetched_at: str

class MarketDataProvider(ABC):
    @abstractmethod
    def get_quote(self, symbol: str, provider_symbol: str, exchange: str = "NSE") -> NormalizedQuote:
        """Fetch latest available quote for a given instrument."""
        pass

    @abstractmethod
    def get_history(self, provider_symbol: str, period: str = "1mo", interval: str = "1d") -> List[HistoricalBar]:
        """Fetch historical price bars for the given period and interval."""
        pass

    @abstractmethod
    def get_fundamentals(self, symbol: str, provider_symbol: str) -> Fundamentals:
        """Fetch company profile, valuation ratios, and financial metrics."""
        pass

    @abstractmethod
    def get_indices(self) -> List[Dict[str, Any]]:
        """Fetch key benchmark indices (NIFTY 50, SENSEX)."""
        pass
