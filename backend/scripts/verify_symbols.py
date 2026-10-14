import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import yfinance as yf
from app.market_data.symbols import STOCK_UNIVERSE

def check_universe():
    print(f"Checking all {len(STOCK_UNIVERSE)} stocks against Yahoo Finance...")
    missing = []
    success = []
    
    for s in STOCK_UNIVERSE:
        prov = s["provider_symbol"]
        try:
            t = yf.Ticker(prov)
            price = None
            try:
                price = t.fast_info.last_price
            except Exception:
                pass
            
            if price is None:
                hist = t.history(period="2d")
                if not hist.empty:
                    price = float(hist.iloc[-1]["Close"])

            if price is not None:
                success.append((s["symbol"], prov, price))
            else:
                missing.append((s["symbol"], prov, s["sector_name"]))
        except Exception as e:
            missing.append((s["symbol"], prov, str(e)))

    print(f"\nSUCCESSFUL ({len(success)}/{len(STOCK_UNIVERSE)}):")
    print(f"FAILED / DELISTED / MISSING ({len(missing)}):")
    for m in missing:
        print("  -->", m)

if __name__ == "__main__":
    check_universe()
