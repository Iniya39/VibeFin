import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
import yfinance as yf
from app.market_data.provider_base import MarketDataProvider, NormalizedQuote, HistoricalBar, Fundamentals
from app.core.config import settings

logger = logging.getLogger(__name__)

class YFinanceProvider(MarketDataProvider):
    """
    Concrete market data adapter using Yahoo Finance via yfinance package.
    Clearly acknowledged as best-effort free development data adapter with possible delays,
    rate limits, and non-realtime guarantees.
    """

    def __init__(self):
        self.source_label = settings.MARKET_DATA_PROVIDER

    def get_quote(self, symbol: str, provider_symbol: str, exchange: str = "NSE") -> NormalizedQuote:
        now_iso = datetime.now(timezone.utc).isoformat()
        warnings_list = []
        
        try:
            ticker = yf.Ticker(provider_symbol)
            fast_info = getattr(ticker, "fast_info", None)
            
            price = None
            prev_close = None
            open_price = None
            day_high = None
            day_low = None
            volume = None
            market_cap = None
            currency = "INR"
            market_ts = None
            market_state = None

            if fast_info:
                try:
                    price = float(fast_info.last_price) if fast_info.last_price is not None else None
                except Exception:
                    pass
                
                try:
                    prev_close = float(fast_info.previous_close) if fast_info.previous_close is not None else None
                except Exception:
                    pass

                try:
                    open_price = float(fast_info.open) if fast_info.open is not None else None
                except Exception:
                    pass

                try:
                    day_high = float(fast_info.day_high) if fast_info.day_high is not None else None
                except Exception:
                    pass

                try:
                    day_low = float(fast_info.day_low) if fast_info.day_low is not None else None
                except Exception:
                    pass

                try:
                    volume = int(fast_info.last_volume) if fast_info.last_volume is not None else None
                except Exception:
                    pass

                try:
                    market_cap = float(fast_info.market_cap) if fast_info.market_cap is not None else None
                except Exception:
                    pass

                try:
                    currency = str(fast_info.currency or "INR")
                except Exception:
                    pass

            # Fallback to recent history if fast_info is incomplete
            if price is None:
                hist = ticker.history(period="5d", interval="1d")
                if not hist.empty:
                    last_row = hist.iloc[-1]
                    price = float(last_row["Close"])
                    open_price = float(last_row["Open"])
                    day_high = float(last_row["High"])
                    day_low = float(last_row["Low"])
                    volume = int(last_row["Volume"])
                    if len(hist) > 1:
                        prev_close = float(hist.iloc[-2]["Close"])
                    else:
                        prev_close = open_price
                    market_ts = str(hist.index[-1].isoformat())
                    warnings_list.append("Quote derived from latest daily close series.")

            if price is None:
                return NormalizedQuote(
                    symbol=symbol,
                    exchange=exchange,
                    provider_symbol=provider_symbol,
                    price=None,
                    fetched_at=now_iso,
                    data_status="unavailable",
                    source=self.source_label,
                    warnings="Provider returned empty quote data"
                )

            # Calculate price changes
            change = None
            change_pct = None
            if prev_close and prev_close > 0:
                change = round(price - prev_close, 2)
                change_pct = round((change / prev_close) * 100, 2)

            # Determine freshness
            data_status = "fresh"

            return NormalizedQuote(
                symbol=symbol,
                exchange=exchange,
                provider_symbol=provider_symbol,
                price=round(price, 2),
                previous_close=round(prev_close, 2) if prev_close else None,
                open_price=round(open_price, 2) if open_price else None,
                day_high=round(day_high, 2) if day_high else None,
                day_low=round(day_low, 2) if day_low else None,
                volume=volume,
                market_cap=market_cap,
                currency=currency,
                change=change,
                change_pct=change_pct,
                source=self.source_label,
                market_timestamp=market_ts,
                fetched_at=now_iso,
                data_status=data_status,
                market_state=market_state,
                warnings="; ".join(warnings_list) if warnings_list else None
            )

        except Exception as e:
            logger.warning(f"Error fetching quote for {provider_symbol}: {e}")
            return NormalizedQuote(
                symbol=symbol,
                exchange=exchange,
                provider_symbol=provider_symbol,
                price=None,
                fetched_at=now_iso,
                data_status="unavailable",
                source=self.source_label,
                warnings=f"Provider request error: {str(e)}"
            )

    def get_history(self, provider_symbol: str, period: str = "1mo", interval: str = "1d") -> List[HistoricalBar]:
        try:
            ticker = yf.Ticker(provider_symbol)
            # Map intervals to valid Yahoo Finance intervals
            valid_intervals = ["1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h", "1d", "5d", "1wk", "1mo", "3mo"]
            valid_periods = ["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max"]
            
            clean_period = period if period in valid_periods else "1mo"
            clean_interval = interval if interval in valid_intervals else "1d"
            
            # Intraday constraint: Yahoo only supports 1m for 7 days, 5m/15m for 60 days
            if clean_period in ["1y", "5y", "max"] and clean_interval in ["1m", "5m", "15m", "30m", "60m", "1h"]:
                clean_interval = "1d"

            df = ticker.history(period=clean_period, interval=clean_interval)
            bars = []
            if df.empty:
                return bars

            for idx, row in df.iterrows():
                # Normalize timestamp
                ts_str = idx.isoformat() if hasattr(idx, "isoformat") else str(idx)
                bars.append(HistoricalBar(
                    timestamp=ts_str,
                    open=round(float(row["Open"]), 2),
                    high=round(float(row["High"]), 2),
                    low=round(float(row["Low"]), 2),
                    close=round(float(row["Close"]), 2),
                    volume=int(row["Volume"]) if "Volume" in row else 0
                ))
            return bars
        except Exception as e:
            logger.error(f"Error fetching history for {provider_symbol}: {e}")
            return []

    def get_fundamentals(self, symbol: str, provider_symbol: str) -> Fundamentals:
        now_iso = datetime.now(timezone.utc).isoformat()
        try:
            ticker = yf.Ticker(provider_symbol)
            info = {}
            try:
                info = ticker.info or {}
            except Exception as e:
                logger.warning(f"Could not load full ticker.info for {provider_symbol}: {e}")

            # Safe extraction
            def safe_float(val):
                try:
                    return float(val) if val is not None else None
                except Exception:
                    return None

            statements_summary = {}
            try:
                income = ticker.income_stmt
                if income is not None and not income.empty:
                    # Take up to 3 most recent columns
                    cols = [str(c)[:10] for c in income.columns[:3]]
                    statements_summary["periods"] = cols
                    key_rows = ["Total Revenue", "Operating Income", "Net Income"]
                    rev_dict = {}
                    for k in key_rows:
                        if k in income.index:
                            rev_dict[k] = [safe_float(v) for v in income.loc[k][:3]]
                    statements_summary["income_metrics"] = rev_dict
            except Exception:
                pass

            return Fundamentals(
                symbol=symbol,
                provider_symbol=provider_symbol,
                name=info.get("longName") or info.get("shortName"),
                sector=info.get("sector"),
                industry=info.get("industry"),
                market_cap=safe_float(info.get("marketCap")),
                pe_ratio=safe_float(info.get("trailingPE")),
                pb_ratio=safe_float(info.get("priceToBook")),
                dividend_yield=safe_float(info.get("dividendYield")),
                eps=safe_float(info.get("trailingEps")),
                high_52w=safe_float(info.get("fiftyTwoWeekHigh")),
                low_52w=safe_float(info.get("fiftyTwoWeekLow")),
                roe=safe_float(info.get("returnOnEquity")),
                debt_to_equity=safe_float(info.get("debtToEquity")),
                business_summary=info.get("longBusinessSummary"),
                financial_statements=statements_summary if statements_summary else None,
                source=self.source_label,
                fetched_at=now_iso
            )
        except Exception as e:
            logger.error(f"Error fetching fundamentals for {provider_symbol}: {e}")
            return Fundamentals(
                symbol=symbol,
                provider_symbol=provider_symbol,
                source=self.source_label,
                fetched_at=now_iso
            )

    def get_indices(self) -> List[Dict[str, Any]]:
        from app.market_data.symbols import BENCHMARK_INDICES
        results = []
        now_iso = datetime.now(timezone.utc).isoformat()
        
        for idx in BENCHMARK_INDICES:
            try:
                t = yf.Ticker(idx["provider_symbol"])
                fast_info = getattr(t, "fast_info", None)
                price = None
                prev_close = None
                
                if fast_info:
                    try:
                        price = float(fast_info.last_price)
                        prev_close = float(fast_info.previous_close)
                    except Exception:
                        pass
                
                if price is None:
                    hist = t.history(period="5d", interval="1d")
                    if not hist.empty:
                        price = float(hist.iloc[-1]["Close"])
                        if len(hist) > 1:
                            prev_close = float(hist.iloc[-2]["Close"])
                        else:
                            prev_close = price

                change = None
                change_pct = None
                if price and prev_close:
                    change = round(price - prev_close, 2)
                    change_pct = round((change / prev_close) * 100, 2)

                results.append({
                    "symbol": idx["symbol"],
                    "name": idx["name"],
                    "exchange": idx["exchange"],
                    "provider_symbol": idx["provider_symbol"],
                    "price": round(price, 2) if price else None,
                    "previous_close": round(prev_close, 2) if prev_close else None,
                    "change": change,
                    "change_pct": change_pct,
                    "currency": "INR",
                    "source": self.source_label,
                    "fetched_at": now_iso,
                    "status": "fresh" if price else "unavailable"
                })
            except Exception as e:
                logger.warning(f"Error fetching index {idx['symbol']}: {e}")
                results.append({
                    "symbol": idx["symbol"],
                    "name": idx["name"],
                    "exchange": idx["exchange"],
                    "provider_symbol": idx["provider_symbol"],
                    "price": None,
                    "previous_close": None,
                    "change": None,
                    "change_pct": None,
                    "source": self.source_label,
                    "fetched_at": now_iso,
                    "status": "unavailable"
                })
        return results
