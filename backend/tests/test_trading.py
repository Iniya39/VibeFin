import pytest
import uuid
from datetime import datetime, timezone
from app.core.database import init_db, seed_master_data, get_db
from app.trading.engine import trading_engine
from app.core.config import settings

@pytest.fixture(autouse=True)
def setup_db():
    init_db()
    seed_master_data()

def create_test_user():
    user_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO users (id, email, hashed_password, full_name, is_active, created_at)
            VALUES (?, ?, 'dummyhash', 'Test User', 1, ?)
        """, (user_id, f"test_{user_id[:8]}@vibefinance.in", now_iso))
    return user_id

def test_paper_trading_account_creation():
    user_id = create_test_user()
    account = trading_engine.get_or_create_account(user_id)
    assert account is not None
    assert account["virtual_balance"] == settings.DEFAULT_STARTING_BALANCE
    assert account["currency"] == "INR"

def test_market_buy_and_sell_execution():
    user_id = create_test_user()
    account = trading_engine.get_or_create_account(user_id)
    starting_balance = account["virtual_balance"]

    # 1. Buy 10 shares of TCS at fixed simulated price 3500.0
    res = trading_engine.place_order(
        user_id=user_id,
        symbol="TCS",
        side="BUY",
        order_type="MARKET",
        quantity=10,
        current_market_price=3500.0
    )
    assert res["success"] is True
    assert res["order"]["status"] == "EXECUTED"
    assert res["order"]["execution_price"] == 3500.0

    # Verify balance decreased
    acc_after = trading_engine.get_or_create_account(user_id)
    gross_cost = 10 * 3500.0
    fee = gross_cost * settings.SIMULATED_COMMISSION_PCT
    expected_balance = starting_balance - (gross_cost + fee)
    assert round(acc_after["virtual_balance"], 2) == round(expected_balance, 2)

    # Verify holdings
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM holdings WHERE account_id = ? AND symbol = 'TCS'", (account["id"],))
        holding = cursor.fetchone()
        assert holding is not None
        assert holding["quantity"] == 10
        assert holding["average_price"] == 3500.0

    # 2. Buy additional 10 shares at 3700.0 to test weighted average cost
    res2 = trading_engine.place_order(
        user_id=user_id,
        symbol="TCS",
        side="BUY",
        order_type="MARKET",
        quantity=10,
        current_market_price=3700.0
    )
    assert res2["success"] is True
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM holdings WHERE account_id = ? AND symbol = 'TCS'", (account["id"],))
        holding = cursor.fetchone()
        assert holding["quantity"] == 20
        # Expected average cost: (10*3500 + 10*3700)/20 = 3600.0
        assert holding["average_price"] == 3600.0

    # 3. Sell 5 shares at 4000.0
    res_sell = trading_engine.place_order(
        user_id=user_id,
        symbol="TCS",
        side="SELL",
        order_type="MARKET",
        quantity=5,
        current_market_price=4000.0
    )
    assert res_sell["success"] is True
    assert res_sell["order"]["status"] == "EXECUTED"

    # Verify holding updated
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM holdings WHERE account_id = ? AND symbol = 'TCS'", (account["id"],))
        holding = cursor.fetchone()
        assert holding["quantity"] == 15
        assert holding["average_price"] == 3600.0  # Avg price remains same after partial sale
        # Realized PnL: 5 * (4000 - 3600) = 2000 - fee
        assert holding["realized_pnl"] > 1900.0

def test_insufficient_funds_rejection():
    user_id = create_test_user()
    trading_engine.get_or_create_account(user_id)

    # Attempt to buy more than 10 Lakhs worth of Reliance
    res = trading_engine.place_order(
        user_id=user_id,
        symbol="RELIANCE",
        side="BUY",
        order_type="MARKET",
        quantity=100000,
        current_market_price=3000.0
    )
    assert res["success"] is False
    assert "Insufficient funds" in res["error"]

def test_insufficient_holdings_rejection():
    user_id = create_test_user()
    trading_engine.get_or_create_account(user_id)

    # Attempt to sell without owning shares
    res = trading_engine.place_order(
        user_id=user_id,
        symbol="INFY",
        side="SELL",
        order_type="MARKET",
        quantity=5,
        current_market_price=1600.0
    )
    assert res["success"] is False
    assert "Insufficient holdings" in res["error"]

def test_limit_order_placement_and_cancellation():
    user_id = create_test_user()
    trading_engine.get_or_create_account(user_id)

    # Place limit order
    res = trading_engine.place_order(
        user_id=user_id,
        symbol="HDFCBANK",
        side="BUY",
        order_type="LIMIT",
        quantity=10,
        limit_price=1400.0
    )
    assert res["success"] is True
    order = res["order"]
    assert order["status"] == "PENDING"
    assert order["limit_price"] == 1400.0

    # Cancel order
    cancel_res = trading_engine.cancel_order(user_id, order["id"])
    assert cancel_res["success"] is True

    # Verify status is CANCELLED
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT status FROM orders WHERE id = ?", (order["id"],))
        assert cursor.fetchone()["status"] == "CANCELLED"
