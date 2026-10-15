import logging
import math
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
import yfinance as yf
from app.market_data.provider_base import MarketDataProvider, NormalizedQuote, HistoricalBar, Fundamentals
from app.core.config import settings

logger = logging.getLogger(__name__)

def safe_float(val) -> Optional[float]:
    """Convert value to float safely, returning None for NaN, Inf, or invalid input."""
    if val is None:
        return None
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return None
        return f
    except Exception:
        return None

def safe_int(val) -> Optional[int]:
    """Convert value to int safely, returning None for NaN, Inf, or invalid input."""
    if val is None:
        return None
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return None
        return int(f)
    except Exception:
        return None

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
                price = safe_float(getattr(fast_info, "last_price", None))
                prev_close = safe_float(getattr(fast_info, "previous_close", None))
                open_price = safe_float(getattr(fast_info, "open", None))
                day_high = safe_float(getattr(fast_info, "day_high", None))
                day_low = safe_float(getattr(fast_info, "day_low", None))
                volume = safe_int(getattr(fast_info, "last_volume", None))
                market_cap = safe_float(getattr(fast_info, "market_cap", None))
                try:
                    currency = str(getattr(fast_info, "currency", None) or "INR")
                except Exception:
                    currency = "INR"

            # Fallback to recent history if fast_info is incomplete
            if price is None:
                hist = ticker.history(period="5d", interval="1d")
                if not hist.empty:
                    last_row = hist.iloc[-1]
                    price = safe_float(last_row["Close"])
                    open_price = safe_float(last_row["Open"])
                    day_high = safe_float(last_row["High"])
                    day_low = safe_float(last_row["Low"])
                    volume = safe_int(last_row["Volume"]) or 0
                    if len(hist) > 1:
                        prev_close = safe_float(hist.iloc[-2]["Close"])
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
                o = safe_float(row["Open"]) or 0.0
                h = safe_float(row["High"]) or 0.0
                l = safe_float(row["Low"]) or 0.0
                c = safe_float(row["Close"]) or 0.0
                v = safe_int(row.get("Volume", 0)) or 0
                bars.append(HistoricalBar(
                    timestamp=ts_str,
                    open=round(o, 2),
                    high=round(h, 2),
                    low=round(l, 2),
                    close=round(c, 2),
                    volume=v
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
                            row_vals = income.loc[k]
                            if hasattr(row_vals, "iloc"):
                                if len(getattr(row_vals, "shape", ())) > 1:
                                    row_vals = row_vals.iloc[0]
                                vals = [safe_float(v) for v in row_vals.iloc[:3]]
                            else:
                                vals = [safe_float(v) for v in row_vals[:3]]
                            rev_dict[k] = vals
                    statements_summary["income_metrics"] = rev_dict
            except Exception:
                pass

            # Balance sheet metrics & Debt-to-Equity validation
            balance_sheet_debt = None
            balance_sheet_equity = None
            balance_sheet_period = None
            capital_leases = None
            calculated_de = None
            debt_classification = "Unable to Verify"
            debt_notes = None

            try:
                bs = ticker.balance_sheet
                if bs is not None and not bs.empty:
                    bs_cols = [str(c)[:10] for c in bs.columns[:2]]
                    if bs_cols:
                        balance_sheet_period = bs_cols[0]
                    
                    if "Total Debt" in bs.index:
                        row = bs.loc["Total Debt"]
                        balance_sheet_debt = safe_float(row.iloc[0] if hasattr(row, "iloc") else row[0])
                    elif "Long Term Debt" in bs.index or "Current Debt" in bs.index:
                        lt = safe_float(bs.loc["Long Term Debt"].iloc[0]) if "Long Term Debt" in bs.index and hasattr(bs.loc["Long Term Debt"], "iloc") else 0.0
                        st = safe_float(bs.loc["Current Debt"].iloc[0]) if "Current Debt" in bs.index and hasattr(bs.loc["Current Debt"], "iloc") else 0.0
                        balance_sheet_debt = (lt or 0.0) + (st or 0.0)

                    if "Capital Lease Obligations" in bs.index:
                        row_cl = bs.loc["Capital Lease Obligations"]
                        capital_leases = safe_float(row_cl.iloc[0] if hasattr(row_cl, "iloc") else row_cl[0])

                    if "Stockholders Equity" in bs.index:
                        row_eq = bs.loc["Stockholders Equity"]
                        balance_sheet_equity = safe_float(row_eq.iloc[0] if hasattr(row_eq, "iloc") else row_eq[0])
                    elif "Common Stock Equity" in bs.index:
                        row_eq = bs.loc["Common Stock Equity"]
                        balance_sheet_equity = safe_float(row_eq.iloc[0] if hasattr(row_eq, "iloc") else row_eq[0])

                    if balance_sheet_debt is not None and balance_sheet_equity is not None:
                        if balance_sheet_equity > 0:
                            calculated_de = round(balance_sheet_debt / balance_sheet_equity, 3)
                        elif balance_sheet_equity <= 0:
                            calculated_de = None
                            debt_classification = "Data Inconsistency Detected"
                            debt_notes = "Negative or zero shareholders' equity reported on balance sheet."
            except Exception as bs_err:
                logger.debug(f"Could not load balance sheet for {provider_symbol}: {bs_err}")

            raw_info_de = safe_float(info.get("debtToEquity"))
            normalized_info_de = None
            if raw_info_de is not None:
                # Yahoo Finance reports debtToEquity as a percentage (e.g. 9.83 = 9.83%)
                normalized_info_de = round(raw_info_de / 100.0, 3)

            final_de = calculated_de if calculated_de is not None else normalized_info_de

            sec_name = (info.get("sector") or "").lower()
            is_bank_or_fin = "bank" in sec_name or "financial" in sec_name
            is_utility_infra = "utility" in sec_name or "utilities" in sec_name or "infrastructure" in sec_name or "energy" in sec_name

            if is_bank_or_fin:
                debt_classification = "Banking Capital Adequacy Context"
                debt_notes = "Commercial banks & financial institutions operate on customer deposit leverage; standard D/E ratio is not a distress indicator."
            elif final_de is not None:
                if is_utility_infra:
                    if final_de < 1.0:
                        debt_classification = "Low Debt Concern"
                    elif final_de <= 2.5:
                        debt_classification = "Moderate Debt Concern"
                    else:
                        debt_classification = "High Debt Concern"
                else:
                    if final_de < 0.5:
                        debt_classification = "Low Debt Concern"
                    elif final_de <= 1.5:
                        debt_classification = "Moderate Debt Concern"
                    else:
                        debt_classification = "High Debt Concern"

                notes_parts = []
                if balance_sheet_debt is not None and balance_sheet_equity is not None:
                    notes_parts.append(f"Balance sheet verified ({balance_sheet_period or 'Latest'}): Total Debt ₹{balance_sheet_debt/1e7:,.1f} Cr / Equity ₹{balance_sheet_equity/1e7:,.1f} Cr = {final_de:.2f}x.")
                if capital_leases:
                    notes_parts.append(f"Includes ₹{capital_leases/1e7:,.1f} Cr capital lease liabilities under Ind AS 116.")
                debt_notes = " ".join(notes_parts) if notes_parts else f"Ratio verified from trailing disclosures: {final_de:.2f}x."
            else:
                debt_classification = "Unable to Verify"
                debt_notes = "Debt or equity metrics not disclosed in provider feed."

            # Sanitize dividend yield and RoE
            raw_div = safe_float(info.get("dividendYield"))
            val_div = None
            if raw_div is not None:
                if 0.0 < raw_div < 0.20:
                    val_div = round(raw_div * 100.0, 2)
                elif 0.20 <= raw_div <= 25.0:
                    val_div = round(raw_div, 2)

            raw_roe = safe_float(info.get("returnOnEquity"))
            val_roe = None
            if raw_roe is not None:
                val_roe = raw_roe if raw_roe < 2.0 else raw_roe / 100.0

            return Fundamentals(
                symbol=symbol,
                provider_symbol=provider_symbol,
                name=info.get("longName") or info.get("shortName"),
                sector=info.get("sector"),
                industry=info.get("industry"),
                market_cap=safe_float(info.get("marketCap")),
                pe_ratio=safe_float(info.get("trailingPE")),
                pb_ratio=safe_float(info.get("priceToBook")),
                dividend_yield=val_div,
                eps=safe_float(info.get("trailingEps")),
                high_52w=safe_float(info.get("fiftyTwoWeekHigh")),
                low_52w=safe_float(info.get("fiftyTwoWeekLow")),
                roe=val_roe,
                debt_to_equity=final_de,
                balance_sheet_debt=balance_sheet_debt,
                balance_sheet_equity=balance_sheet_equity,
                balance_sheet_period=balance_sheet_period,
                capital_lease_obligations=capital_leases,
                debt_to_equity_ratio=final_de,
                debt_classification=debt_classification,
                debt_validation_notes=debt_notes,
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
