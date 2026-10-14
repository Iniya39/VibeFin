import pytest
from app.market_data.service import MarketDataService
from app.market_data.provider_base import NormalizedQuote

def test_technical_indicator_calculations():
    # Synthetic closing prices (30 data points)
    bars = []
    for i in range(30):
        bars.append({
            "timestamp": f"2026-01-{i+1:02d}T09:15:00",
            "open": 100.0 + i,
            "high": 105.0 + i,
            "low": 98.0 + i,
            "close": 100.0 + i,
            "volume": 1000 + i * 50
        })

    indicators = MarketDataService.calculate_indicators(bars)
    assert "bars_with_indicators" in indicators
    assert len(indicators["bars_with_indicators"]) == 30
    
    latest = indicators["latest"]
    assert latest is not None
    assert latest["sma20"] is not None
    # For strictly increasing sequence 100, 101, ..., 129, SMA 20 of last 20 elements (110..129) is 119.5
    assert latest["sma20"] == 119.5
    assert latest["ema20"] is not None
    assert latest["rsi14"] is not None
    # Strictly increasing prices should have RSI of 100.0
    assert latest["rsi14"] == 100.0
    assert latest["bb_upper"] is not None
    assert latest["bb_lower"] is not None
    assert latest["bb_upper"] > latest["bb_middle"] > latest["bb_lower"]

def test_normalized_quote_contract():
    q = NormalizedQuote(
        symbol="TCS",
        exchange="NSE",
        provider_symbol="TCS.NS",
        price=3850.50,
        previous_close=3800.00,
        change=50.50,
        change_pct=1.33,
        fetched_at="2026-10-14T09:30:00Z",
        data_status="fresh"
    )
    assert q.symbol == "TCS"
    assert q.currency == "INR"
    assert q.price == 3850.50
    assert q.data_status == "fresh"
