import pytest
from app.market_data.symbols import SECTORS, STOCK_UNIVERSE, SYMBOL_MAP, PROVIDER_MAP

def test_sector_count():
    """Verify that there are exactly 10 sectors."""
    assert len(SECTORS) == 10, f"Expected exactly 10 sectors, found {len(SECTORS)}"

def test_stock_universe_total_count():
    """Verify that there are exactly 100 distinct stocks in the universe."""
    assert len(STOCK_UNIVERSE) == 100, f"Expected exactly 100 stocks, found {len(STOCK_UNIVERSE)}"

def test_stocks_per_sector():
    """Verify that every single sector contains exactly 10 stocks."""
    sector_counts = {}
    for stock in STOCK_UNIVERSE:
        sec_id = stock["sector_id"]
        sector_counts[sec_id] = sector_counts.get(sec_id, 0) + 1

    for sec in SECTORS:
        sec_id = sec["id"]
        cnt = sector_counts.get(sec_id, 0)
        assert cnt == 10, f"Sector '{sec['name']}' ({sec_id}) must have exactly 10 stocks, got {cnt}"

def test_unique_symbols():
    """Verify no duplicate symbols or provider symbols exist."""
    symbols = [s["symbol"] for s in STOCK_UNIVERSE]
    assert len(symbols) == len(set(symbols)), "Duplicate symbols detected in STOCK_UNIVERSE"

    provider_symbols = [s["provider_symbol"] for s in STOCK_UNIVERSE]
    assert len(provider_symbols) == len(set(provider_symbols)), "Duplicate provider symbols detected in STOCK_UNIVERSE"

def test_valid_exchanges():
    """Verify all stocks have valid exchange and currency."""
    for s in STOCK_UNIVERSE:
        assert s["exchange"] in ["NSE", "BSE"], f"Invalid exchange for {s['symbol']}: {s['exchange']}"
        assert s.get("currency") == "INR", f"Invalid currency for {s['symbol']}"
        assert s["provider_symbol"].endswith(".NS") or s["provider_symbol"].endswith(".BO") or s["provider_symbol"].startswith("^"), f"Invalid provider symbol format: {s['provider_symbol']}"
