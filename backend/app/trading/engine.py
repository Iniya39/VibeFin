import uuid
import logging
import sqlite3
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from app.core.database import get_db
from app.core.config import settings
from app.trading.accounting import calculate_new_average_cost, calculate_realized_pnl_on_sale
from app.market_data.symbols import SYMBOL_MAP

logger = logging.getLogger(__name__)

class TradingEngine:
    """
    Simulated Paper Trading Engine.
    Executes simulated orders with realistic balance checks, atomic database transactions,
    idempotency enforcement, cash ledger audit trail, and average acquisition cost accounting.
    """

    def get_or_create_account(self, user_id: str, conn: Optional[sqlite3.Connection] = None) -> Dict[str, Any]:
        if conn is not None:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM paper_trading_accounts WHERE user_id = ?", (user_id,))
            account = cursor.fetchone()
            
            if not account:
                account_id = str(uuid.uuid4())
                now_iso = datetime.now(timezone.utc).isoformat()
                initial_balance = settings.DEFAULT_STARTING_BALANCE
                
                cursor.execute("""
                    INSERT INTO paper_trading_accounts (id, user_id, virtual_balance, currency, created_at, updated_at)
                    VALUES (?, ?, ?, 'INR', ?, ?)
                """, (account_id, user_id, initial_balance, now_iso, now_iso))
                
                # Create initial ledger entry
                ledger_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO simulated_cash_ledger (id, account_id, type, amount, balance_after, description, created_at)
                    VALUES (?, ?, 'INITIAL_DEPOSIT', ?, ?, 'Initial simulated trading balance', ?)
                """, (ledger_id, account_id, initial_balance, initial_balance, now_iso))
                
                cursor.execute("SELECT * FROM paper_trading_accounts WHERE id = ?", (account_id,))
                account = cursor.fetchone()
                
            return dict(account)
        else:
            with get_db() as c:
                return self.get_or_create_account(user_id, conn=c)

    def place_order(
        self,
        user_id: str,
        symbol: str,
        side: str,              # 'BUY' | 'SELL'
        order_type: str,        # 'MARKET' | 'LIMIT'
        quantity: int,
        limit_price: Optional[float] = None,
        trigger_price: Optional[float] = None,
        idempotency_key: Optional[str] = None,
        current_market_price: Optional[float] = None
    ) -> Dict[str, Any]:
        symbol = symbol.upper()
        side = side.upper()
        order_type = order_type.upper()
        
        # Validations
        if symbol not in SYMBOL_MAP:
            return {"success": False, "error": f"Instrument {symbol} is not active in the 100-stock universe."}
        
        if quantity <= 0:
            return {"success": False, "error": "Order quantity must be a positive integer."}

        if side not in ["BUY", "SELL"]:
            return {"success": False, "error": "Order side must be BUY or SELL."}

        if order_type not in ["MARKET", "LIMIT"]:
            return {"success": False, "error": "Order type must be MARKET or LIMIT."}

        if order_type == "LIMIT" and (limit_price is None or limit_price <= 0):
            return {"success": False, "error": "Limit orders require a valid positive limit price."}

        account = self.get_or_create_account(user_id)
        account_id = account["id"]
        now_iso = datetime.now(timezone.utc).isoformat()
        
        with get_db() as conn:
            cursor = conn.cursor()

            # Check idempotency
            if idempotency_key:
                cursor.execute("SELECT * FROM orders WHERE idempotency_key = ?", (idempotency_key,))
                existing = cursor.fetchone()
                if existing:
                    return {
                        "success": True,
                        "order": dict(existing),
                        "message": "Order already processed (idempotency hit)."
                    }

            order_id = str(uuid.uuid4())
            
            # --- MARKET ORDER EXECUTION ---
            if order_type == "MARKET":
                # Ensure we have a valid current price
                exec_price = current_market_price
                if exec_price is None or exec_price <= 0:
                    # Look up latest cached quote from DB
                    cursor.execute("SELECT price FROM market_quotes WHERE symbol = ?", (symbol,))
                    q_row = cursor.fetchone()
                    if q_row and q_row["price"] is not None:
                        exec_price = float(q_row["price"])
                
                if exec_price is None or exec_price <= 0:
                    # Reject order
                    cursor.execute("""
                        INSERT INTO orders (
                            id, user_id, account_id, symbol, side, order_type, quantity,
                            status, rejection_reason, idempotency_key, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'REJECTED', 'Market price unavailable for immediate execution.', ?, ?, ?)
                    """, (order_id, user_id, account_id, symbol, side, order_type, quantity, idempotency_key, now_iso, now_iso))
                    return {"success": False, "error": "Market price unavailable for simulated market order."}

                gross_amount = round(quantity * exec_price, 2)
                fee_amount = round(gross_amount * settings.SIMULATED_COMMISSION_PCT, 2)

                if side == "BUY":
                    total_required = round(gross_amount + fee_amount, 2)
                    if account["virtual_balance"] < total_required:
                        cursor.execute("""
                            INSERT INTO orders (
                                id, user_id, account_id, symbol, side, order_type, quantity,
                                status, rejection_reason, idempotency_key, created_at, updated_at
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'REJECTED', 'Insufficient virtual cash balance.', ?, ?, ?)
                        """, (order_id, user_id, account_id, symbol, side, order_type, quantity, idempotency_key, now_iso, now_iso))
                        return {
                            "success": False,
                            "error": f"Insufficient funds: Required ₹{total_required:,.2f}, Available ₹{account['virtual_balance']:,.2f}"
                        }

                    # Deduct cash
                    new_balance = round(account["virtual_balance"] - total_required, 2)
                    cursor.execute("UPDATE paper_trading_accounts SET virtual_balance = ?, updated_at = ? WHERE id = ?", (new_balance, now_iso, account_id))

                    # Insert Ledger
                    ledger_id = str(uuid.uuid4())
                    cursor.execute("""
                        INSERT INTO simulated_cash_ledger (id, account_id, type, amount, balance_after, reference_order_id, description, created_at)
                        VALUES (?, ?, 'ORDER_BUY', ?, ?, ?, ?, ?)
                    """, (ledger_id, account_id, -total_required, new_balance, order_id, f"Buy {quantity} {symbol} @ ₹{exec_price}", now_iso))

                    # Update Holdings
                    cursor.execute("SELECT * FROM holdings WHERE account_id = ? AND symbol = ?", (account_id, symbol))
                    curr_holding = cursor.fetchone()
                    if curr_holding:
                        tot_qty, new_avg, tot_cost = calculate_new_average_cost(
                            curr_holding["quantity"], curr_holding["average_price"], quantity, exec_price
                        )
                        cursor.execute("""
                            UPDATE holdings SET quantity = ?, average_price = ?, total_invested = ?, updated_at = ?
                            WHERE id = ?
                        """, (tot_qty, new_avg, tot_cost, now_iso, curr_holding["id"]))
                    else:
                        holding_id = str(uuid.uuid4())
                        cursor.execute("""
                            INSERT INTO holdings (id, account_id, symbol, quantity, average_price, total_invested, realized_pnl, updated_at)
                            VALUES (?, ?, ?, ?, ?, ?, 0.0, ?)
                        """, (holding_id, account_id, symbol, quantity, exec_price, gross_amount, now_iso))

                    # Create Executed Order
                    cursor.execute("""
                        INSERT INTO orders (
                            id, user_id, account_id, symbol, side, order_type, quantity,
                            status, execution_price, idempotency_key, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, 'BUY', 'MARKET', ?, 'EXECUTED', ?, ?, ?, ?)
                    """, (order_id, user_id, account_id, symbol, quantity, exec_price, idempotency_key, now_iso, now_iso))

                    # Create Trade
                    trade_id = str(uuid.uuid4())
                    cursor.execute("""
                        INSERT INTO trades (id, order_id, user_id, account_id, symbol, side, quantity, price, gross_amount, fee_amount, net_amount, executed_at)
                        VALUES (?, ?, ?, ?, ?, 'BUY', ?, ?, ?, ?, ?, ?)
                    """, (trade_id, order_id, user_id, account_id, symbol, quantity, exec_price, gross_amount, fee_amount, total_required, now_iso))

                    cursor.execute("SELECT * FROM orders WHERE id = ?", (order_id,))
                    order_record = cursor.fetchone()
                    return {
                        "success": True,
                        "order": dict(order_record),
                        "message": f"Successfully bought {quantity} shares of {symbol} at ₹{exec_price:,.2f}"
                    }

                elif side == "SELL":
                    # Check existing holding
                    cursor.execute("SELECT * FROM holdings WHERE account_id = ? AND symbol = ?", (account_id, symbol))
                    curr_holding = cursor.fetchone()
                    if not curr_holding or curr_holding["quantity"] < quantity:
                        avail = curr_holding["quantity"] if curr_holding else 0
                        cursor.execute("""
                            INSERT INTO orders (
                                id, user_id, account_id, symbol, side, order_type, quantity,
                                status, rejection_reason, idempotency_key, created_at, updated_at
                            ) VALUES (?, ?, ?, ?, 'SELL', 'MARKET', ?, 'REJECTED', 'Insufficient share holdings.', ?, ?, ?)
                        """, (order_id, user_id, account_id, symbol, quantity, idempotency_key, now_iso, now_iso))
                        return {
                            "success": False,
                            "error": f"Insufficient holdings: Attempted to sell {quantity}, available {avail} shares."
                        }

                    # Calculate proceeds and P&L
                    gross_proceeds, cost_basis, net_pnl = calculate_realized_pnl_on_sale(
                        curr_holding["average_price"], quantity, exec_price, fee_amount
                    )
                    net_cash_added = round(gross_proceeds - fee_amount, 2)
                    new_balance = round(account["virtual_balance"] + net_cash_added, 2)
                    
                    # Update account balance
                    cursor.execute("UPDATE paper_trading_accounts SET virtual_balance = ?, updated_at = ? WHERE id = ?", (new_balance, now_iso, account_id))

                    # Add to cash ledger
                    ledger_id = str(uuid.uuid4())
                    cursor.execute("""
                        INSERT INTO simulated_cash_ledger (id, account_id, type, amount, balance_after, reference_order_id, description, created_at)
                        VALUES (?, ?, 'ORDER_SELL', ?, ?, ?, ?, ?)
                    """, (ledger_id, account_id, net_cash_added, new_balance, order_id, f"Sell {quantity} {symbol} @ ₹{exec_price} (Realized P&L: ₹{net_pnl})", now_iso))

                    # Update holdings
                    remaining_qty = curr_holding["quantity"] - quantity
                    new_realized_pnl = round(curr_holding["realized_pnl"] + net_pnl, 2)
                    
                    if remaining_qty == 0:
                        cursor.execute("DELETE FROM holdings WHERE id = ?", (curr_holding["id"],))
                    else:
                        new_total_invested = round(remaining_qty * curr_holding["average_price"], 2)
                        cursor.execute("""
                            UPDATE holdings SET quantity = ?, total_invested = ?, realized_pnl = ?, updated_at = ?
                            WHERE id = ?
                        """, (remaining_qty, new_total_invested, new_realized_pnl, now_iso, curr_holding["id"]))

                    # Create Executed Order
                    cursor.execute("""
                        INSERT INTO orders (
                            id, user_id, account_id, symbol, side, order_type, quantity,
                            status, execution_price, idempotency_key, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, 'SELL', 'MARKET', ?, 'EXECUTED', ?, ?, ?, ?)
                    """, (order_id, user_id, account_id, symbol, quantity, exec_price, idempotency_key, now_iso, now_iso))

                    # Create Trade
                    trade_id = str(uuid.uuid4())
                    cursor.execute("""
                        INSERT INTO trades (id, order_id, user_id, account_id, symbol, side, quantity, price, gross_amount, fee_amount, net_amount, executed_at)
                        VALUES (?, ?, ?, ?, ?, 'SELL', ?, ?, ?, ?, ?, ?)
                    """, (trade_id, order_id, user_id, account_id, symbol, quantity, exec_price, gross_proceeds, fee_amount, net_cash_added, now_iso))

                    cursor.execute("SELECT * FROM orders WHERE id = ?", (order_id,))
                    order_record = cursor.fetchone()
                    return {
                        "success": True,
                        "order": dict(order_record),
                        "message": f"Successfully sold {quantity} shares of {symbol} at ₹{exec_price:,.2f} (Realized P&L: ₹{net_pnl:,.2f})"
                    }

            # --- LIMIT ORDER PLACEMENT (PENDING STATUS) ---
            elif order_type == "LIMIT":
                # For BUY limit, ensure virtual balance can cover limit price
                if side == "BUY":
                    est_total = round(quantity * limit_price * (1 + settings.SIMULATED_COMMISSION_PCT), 2)
                    if account["virtual_balance"] < est_total:
                        return {
                            "success": False,
                            "error": f"Insufficient funds for limit order: Estimated ₹{est_total:,.2f}, Available ₹{account['virtual_balance']:,.2f}"
                        }
                elif side == "SELL":
                    cursor.execute("SELECT quantity FROM holdings WHERE account_id = ? AND symbol = ?", (account_id, symbol))
                    curr_holding = cursor.fetchone()
                    if not curr_holding or curr_holding["quantity"] < quantity:
                        avail = curr_holding["quantity"] if curr_holding else 0
                        return {
                            "success": False,
                            "error": f"Insufficient holdings for limit order: Need {quantity}, available {avail} shares."
                        }

                cursor.execute("""
                    INSERT INTO orders (
                        id, user_id, account_id, symbol, side, order_type, quantity, limit_price, trigger_price,
                        status, idempotency_key, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, 'LIMIT', ?, ?, ?, 'PENDING', ?, ?, ?)
                """, (order_id, user_id, account_id, symbol, side, quantity, limit_price, trigger_price, idempotency_key, now_iso, now_iso))

                cursor.execute("SELECT * FROM orders WHERE id = ?", (order_id,))
                order_record = cursor.fetchone()
                return {
                    "success": True,
                    "order": dict(order_record),
                    "message": f"Pending {side} limit order placed for {quantity} {symbol} at ₹{limit_price:,.2f}."
                }

    def cancel_order(self, user_id: str, order_id: str) -> Dict[str, Any]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM orders WHERE id = ? AND user_id = ?", (order_id, user_id))
            order = cursor.fetchone()
            
            if not order:
                return {"success": False, "error": "Order not found or access denied."}

            if order["status"] != "PENDING":
                return {"success": False, "error": f"Cannot cancel order in status '{order['status']}'."}

            now_iso = datetime.now(timezone.utc).isoformat()
            cursor.execute("UPDATE orders SET status = 'CANCELLED', updated_at = ? WHERE id = ?", (now_iso, order_id))
            
            return {"success": True, "message": "Order successfully cancelled."}

    def evaluate_pending_orders(self, current_quotes: Dict[str, float]) -> List[str]:
        """
        Check all pending limit orders against latest market prices and execute
        matching orders.
        """
        executed_orders = []
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM orders WHERE status = 'PENDING'")
            pending = cursor.fetchall()

            for order in pending:
                symbol = order["symbol"]
                market_price = current_quotes.get(symbol)
                if not market_price:
                    continue

                should_execute = False
                exec_price = order["limit_price"] or market_price

                if order["side"] == "BUY" and market_price <= order["limit_price"]:
                    should_execute = True
                    exec_price = min(market_price, order["limit_price"])
                elif order["side"] == "SELL" and market_price >= order["limit_price"]:
                    should_execute = True
                    exec_price = max(market_price, order["limit_price"])

                if should_execute:
                    # Execute the pending order
                    res = self.place_order(
                        user_id=order["user_id"],
                        symbol=symbol,
                        side=order["side"],
                        order_type="MARKET",
                        quantity=order["quantity"],
                        current_market_price=exec_price
                    )
                    if res["success"]:
                        now_iso = datetime.now(timezone.utc).isoformat()
                        cursor.execute("UPDATE orders SET status = 'EXECUTED', execution_price = ?, updated_at = ? WHERE id = ?", (exec_price, now_iso, order["id"]))
                        executed_orders.append(order["id"])

        return executed_orders

    def reset_account(self, user_id: str) -> Dict[str, Any]:
        """Reset virtual balance to initial ₹10,00,000 and clear holdings."""
        with get_db() as conn:
            cursor = conn.cursor()
            account = self.get_or_create_account(user_id, conn=conn)
            account_id = account["id"]
            now_iso = datetime.now(timezone.utc).isoformat()
            initial_balance = settings.DEFAULT_STARTING_BALANCE

            # Clear holdings
            cursor.execute("DELETE FROM holdings WHERE account_id = ?", (account_id,))
            
            # Cancel pending orders
            cursor.execute("UPDATE orders SET status = 'CANCELLED', updated_at = ? WHERE account_id = ? AND status = 'PENDING'", (now_iso, account_id))

            # Reset virtual cash balance
            cursor.execute("UPDATE paper_trading_accounts SET virtual_balance = ?, updated_at = ? WHERE id = ?", (initial_balance, now_iso, account_id))

            # Add ledger entry
            ledger_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO simulated_cash_ledger (id, account_id, type, amount, balance_after, description, created_at)
                VALUES (?, ?, 'RESET', ?, ?, 'Account balance reset to default virtual funds', ?)
            """, (ledger_id, account_id, initial_balance - account["virtual_balance"], initial_balance, now_iso))

            return {
                "success": True,
                "virtual_balance": initial_balance,
                "message": "Simulated portfolio and cash balance successfully reset to ₹10,00,000."
            }

    def deposit_funds(self, user_id: str, amount: float, method: str = "UPI (Simulated)", description: Optional[str] = None) -> Dict[str, Any]:
        """Deposit simulated funds to increase trading buying power."""
        if amount <= 0:
            return {"success": False, "error": "Deposit amount must be greater than zero."}
        
        with get_db() as conn:
            cursor = conn.cursor()
            account = self.get_or_create_account(user_id, conn=conn)
            account_id = account["id"]
            current_bal = float(account["virtual_balance"] or 0.0)
            new_balance = round(current_bal + amount, 2)
            now_iso = datetime.now(timezone.utc).isoformat()

            cursor.execute("UPDATE paper_trading_accounts SET virtual_balance = ?, updated_at = ? WHERE id = ?", (new_balance, now_iso, account_id))

            ledger_id = str(uuid.uuid4())
            desc = description or f"Simulated funds deposit via {method}"
            cursor.execute("""
                INSERT INTO simulated_cash_ledger (id, account_id, type, amount, balance_after, description, created_at)
                VALUES (?, ?, 'DEPOSIT', ?, ?, ?, ?)
            """, (ledger_id, account_id, amount, new_balance, desc, now_iso))

            return {
                "success": True,
                "amount": amount,
                "virtual_balance": new_balance,
                "message": f"Successfully added ₹{amount:,.2f} to buying power."
            }

    def withdraw_funds(self, user_id: str, amount: float, method: str = "Bank Transfer (Simulated)") -> Dict[str, Any]:
        """Withdraw simulated funds from available buying power."""
        if amount <= 0:
            return {"success": False, "error": "Withdrawal amount must be greater than zero."}

        with get_db() as conn:
            cursor = conn.cursor()
            account = self.get_or_create_account(user_id, conn=conn)
            account_id = account["id"]
            current_bal = float(account["virtual_balance"] or 0.0)
            if current_bal < amount:
                return {"success": False, "error": f"Insufficient funds. Available buying power: ₹{current_bal:,.2f}"}

            new_balance = round(current_bal - amount, 2)
            now_iso = datetime.now(timezone.utc).isoformat()

            cursor.execute("UPDATE paper_trading_accounts SET virtual_balance = ?, updated_at = ? WHERE id = ?", (new_balance, now_iso, account_id))

            ledger_id = str(uuid.uuid4())
            desc = f"Simulated funds withdrawal to {method}"
            cursor.execute("""
                INSERT INTO simulated_cash_ledger (id, account_id, type, amount, balance_after, description, created_at)
                VALUES (?, ?, 'WITHDRAWAL', ?, ?, ?, ?)
            """, (ledger_id, account_id, -amount, new_balance, desc, now_iso))

            return {
                "success": True,
                "amount": amount,
                "virtual_balance": new_balance,
                "message": f"Successfully withdrew ₹{amount:,.2f} virtual funds."
            }

trading_engine = TradingEngine()
