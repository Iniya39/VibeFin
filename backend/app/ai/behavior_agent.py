import math
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from app.core.database import get_db
from app.core.utils import sanitize_for_json
from app.market_data.symbols import SYMBOL_MAP
from app.ai.schemas import AgentResponse, Citation, Scenario

class TradingBehaviorAnalysisAgent:
    """
    Agent 4: Trading Behavior Analysis Agent.
    Evaluates observable transaction sequences, position-size variance,
    trading frequency, potential overtrading, and alignment with stated risk preferences.
    Uses transparent, rule-based quantitative formulas.
    Does NOT make clinical, medical, or psychological diagnosis claims.
    """
    agent_name = "Trading Behavior Analysis Agent"

    def analyze(self, user_id: str) -> AgentResponse:
        now_iso = datetime.now(timezone.utc).isoformat()

        # 1. Fetch user profile, orders, and executed trades
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT u.id, u.full_name, COALESCE(up.risk_profile, 'moderate') as risk_profile
                FROM users u
                LEFT JOIN user_preferences up ON u.id = up.user_id
                WHERE u.id = ?
            """, (user_id,))
            user_row = cursor.fetchone()
            user_dict = dict(user_row) if user_row else {}
            stated_risk = (user_dict.get("risk_profile") or "moderate").upper()

            cursor.execute("""
                SELECT * FROM trades 
                WHERE user_id = ? 
                ORDER BY executed_at ASC
            """, (user_id,))
            trades = [dict(t) for t in cursor.fetchall()]

            cursor.execute("""
                SELECT * FROM orders 
                WHERE user_id = ? 
                ORDER BY created_at ASC
            """, (user_id,))
            orders = [dict(o) for o in cursor.fetchall()]

            cursor.execute("SELECT virtual_balance FROM paper_trading_accounts WHERE user_id = ?", (user_id,))
            acct_row = cursor.fetchone()
            virtual_balance = acct_row["virtual_balance"] if acct_row else 1000000.0

        # 2. Check for empty trading record
        if not trades:
            return AgentResponse(
                agent_name=self.agent_name,
                entity="TRADER",
                summary=(
                    "No executed trade records found in your paper trading account. "
                    "At least 1 to 3 completed orders are required to evaluate observable execution habits, "
                    "position-sizing consistency, and turnover velocity."
                ),
                signal="Insufficient Trade History",
                key_findings=[
                    "Zero completed trades recorded on ledger.",
                    f"User risk profile registered as '{stated_risk}'.",
                    "Awaiting initial executions to compute statistical behavior metrics."
                ],
                supporting_data={
                    "total_trades": 0,
                    "total_orders": len(orders),
                    "stated_risk_profile": stated_risk,
                    "overtrading_index": 0.0,
                    "sizing_variance_pct": 0.0,
                    "trades": []
                },
                scenarios=[
                    Scenario(
                        case="Recommended First Execution Rule",
                        target_range="Position size < 5% of capital",
                        probability_assessment="Disciplined Baseline",
                        catalysts=[
                            "Establish an initial position with a pre-set limit price.",
                            "Record investment rationale before execution."
                        ]
                    )
                ],
                sources=[
                    Citation(
                        source="VibeFinance Trades Audit Table",
                        metric="Completed Trades Count",
                        value=0,
                        timestamp=now_iso
                    )
                ],
                risks_and_limitations=["Behavioral patterns require historical trade records for empirical calculation."],
                data_freshness="fresh",
                confidence={"score": 1.0, "scale": "0-1.0", "factors": ["Direct audit query returned 0 trade records."]},
                missing_data=["Executed buy/sell transactions"],
                warnings=["Insufficient transaction history for behavioral profiling."],
                disclaimer="Behavioral analytics on simulated trading. Strictly objective transaction analysis; not psychological advice."
            )

        # 3. Quantitative Analysis on Observable Transactions
        total_trades = len(trades)
        buy_trades = [t for t in trades if t["side"] == "BUY"]
        sell_trades = [t for t in trades if t["side"] == "SELL"]
        trade_amounts = [t["gross_amount"] for t in trades]

        # Sizing statistics
        avg_trade_size = round(sum(trade_amounts) / total_trades, 2)
        variance = sum((a - avg_trade_size) ** 2 for a in trade_amounts) / total_trades
        std_dev_size = round(math.sqrt(variance), 2)
        sizing_cv = round((std_dev_size / avg_trade_size * 100), 1) if avg_trade_size > 0 else 0.0

        # Frequency / Overtrading metric
        # Count trades per distinct day
        days_traded = len(set(t["executed_at"][:10] for t in trades))
        trades_per_day = round(total_trades / max(1, days_traded), 1)
        
        # Transparent overtrading heuristic:
        # > 6 trades/day or > 20 total trades with high turnover relative to capital
        is_high_frequency = trades_per_day >= 6.0
        
        # Rapid re-entry check (trades in the same symbol within 15 minutes)
        rapid_reentries = []
        for i in range(1, len(trades)):
            prev = trades[i-1]
            curr = trades[i]
            if prev["symbol"] == curr["symbol"]:
                try:
                    t_prev = datetime.fromisoformat(prev["executed_at"].replace("Z", "+00:00"))
                    t_curr = datetime.fromisoformat(curr["executed_at"].replace("Z", "+00:00"))
                    diff_mins = (t_curr - t_prev).total_seconds() / 60.0
                    if 0 < diff_mins <= 15:
                        rapid_reentries.append({
                            "symbol": curr["symbol"],
                            "interval_minutes": round(diff_mins, 1),
                            "timestamp": curr["executed_at"]
                        })
                except Exception:
                    pass

        # Position Concentration per Trade
        # Check if single trade exceeded 25% of virtual balance
        large_positions = [
            t for t in trades 
            if virtual_balance > 0 and (t["gross_amount"] / virtual_balance) > 0.25
        ]

        # 4. Behavioral Pattern Synthesis & Rule-Based Logic
        observable_patterns = []
        warnings = []
        recurring_mistakes = []

        if sizing_cv > 60.0:
            observable_patterns.append({
                "pattern": "High Position-Size Inconsistency",
                "evidence": f"Coefficient of variation in position sizing is {sizing_cv}% (Avg: ₹{avg_trade_size:,.0f}, Std Dev: ₹{std_dev_size:,.0f}).",
                "rule": "Flagged when standard deviation of trade amounts exceeds 60% of average trade size."
            })
            warnings.append("Erratic position sizing observed. Wide size swings increase risk of disproportionate losses.")
            recurring_mistakes.append("Varying trade capital arbitrarily without risk-weighted position sizing formula.")
        else:
            observable_patterns.append({
                "pattern": "Consistent Position Sizing",
                "evidence": f"Position sizing variation is contained at {sizing_cv}% (Avg: ₹{avg_trade_size:,.0f}).",
                "rule": "Standard deviation remains below 60% of average execution value."
            })

        if is_high_frequency:
            observable_patterns.append({
                "pattern": "Elevated Trading Velocity / Potential Overtrading",
                "evidence": f"Averaging {trades_per_day} trades per active session across {days_traded} active trading day(s).",
                "rule": "Flagged when trade rate exceeds 6.0 executions per active day."
            })
            warnings.append("High transaction frequency can accumulate friction and indicate overactive order placement.")
            recurring_mistakes.append("Excessive intra-day churn instead of allowing theses time to play out.")
        else:
            observable_patterns.append({
                "pattern": "Measured Trading Cadence",
                "evidence": f"Trading pace averages {trades_per_day} execution(s) per active day.",
                "rule": "Execution rate within healthy non-churn threshold (< 6.0/day)."
            })

        if rapid_reentries:
            observable_patterns.append({
                "pattern": "Rapid Same-Instrument Re-Entry",
                "evidence": f"Detected {len(rapid_reentries)} trade(s) re-entering the same stock within 15 minutes.",
                "rule": "Flagged when subsequent order in identical ticker executes within 15 minutes of prior fill."
            })
            warnings.append("Rapid re-entries may indicate impulsive reactions to short-term price fluctuations.")
            recurring_mistakes.append("Immediate re-entry after order execution without reassessing overall setup.")

        if large_positions:
            observable_patterns.append({
                "pattern": "Aggressive Single-Order Exposure",
                "evidence": f"{len(large_positions)} order(s) allocated > 25% of total capital into a single fill.",
                "rule": "Single trade gross amount > 25% of account cash balance."
            })
            warnings.append("Placing oversized single orders exposes capital to severe single-stock drawdown risk.")

        # Stated Risk vs Observed Sizing Alignment
        risk_alignment = "Aligned"
        if stated_risk == "CONSERVATIVE" and (large_positions or sizing_cv > 50):
            risk_alignment = "Misaligned: Aggressive position sizes conflict with stated Conservative risk preference."
            warnings.append("Trade sizes exceed Conservative guidelines (< 5% per position recommended).")
        elif stated_risk == "AGGRESSIVE":
            risk_alignment = "Aligned with aggressive risk appetite; ensure strict stop-loss rules."

        # Overall Behavioral Signal
        if len(warnings) == 0:
            behavior_signal = "Disciplined & Consistent Execution"
        elif is_high_frequency or len(large_positions) >= 2:
            behavior_signal = "High Turnover / Risk Exposure Alert"
        elif rapid_reentries:
            behavior_signal = "Impulsive Execution Tendencies"
        else:
            behavior_signal = "Moderate Execution Discipline"

        summary = (
            f"Evaluated {total_trades} executed transactions ({len(buy_trades)} buys, {len(sell_trades)} sells) "
            f"across {days_traded} active day(s). Execution discipline reflects '{behavior_signal}' with an average "
            f"trade value of ₹{avg_trade_size:,.2f} and sizing coefficient of variation of {sizing_cv}%. "
            f"Stated risk profile ({stated_risk}) is evaluated as: {risk_alignment}."
        )

        key_findings = [
            f"Execution activity: {total_trades} total fills ({len(buy_trades)} BUY / {len(sell_trades)} SELL).",
            f"Trading cadence: {trades_per_day} trades/day across {days_traded} market day(s).",
            f"Capital deployment per trade: Mean fill size of ₹{avg_trade_size:,.2f} (± ₹{std_dev_size:,.2f}).",
            f"Behavioral status: Classified as '{behavior_signal}' with {len(observable_patterns)} key observable patterns.",
            f"Risk profile congruence: {risk_alignment}."
        ]

        discipline_suggestions = [
            "Implement a maximum allocation cap (e.g. 10% of portfolio) per trade to enforce systematic sizing.",
            "Enforce a mandatory 30-minute cooldown period after closing a position before re-entering the same ticker.",
            "Maintain a pre-trade checklist: verify stop-loss, profit target, and fundamental catalyst prior to order transmission.",
            "Periodically reconcile your stated risk profile against actual transaction position sizes."
        ]

        scenarios = [
            Scenario(
                case="Disciplined Rule-Based Execution",
                target_range="Max 5% risk per trade",
                probability_assessment="Optimal Consistency",
                catalysts=[
                    "Fixed-percentage position sizing reduces drawdown variance.",
                    "Reduced trading frequency minimizes unnecessary transaction friction."
                ]
            ),
            Scenario(
                case="Current Observed Execution Trajectory",
                target_range=f"Avg ₹{avg_trade_size:,.0f} per fill",
                probability_assessment="Status Quo",
                catalysts=[
                    f"Ongoing trading cadence of {trades_per_day} trades/session.",
                    "Sizing variation remains within observable historical limits."
                ]
            )
        ]

        citations = [
            Citation(
                source="VibeFinance Trades Audit Table",
                metric="Executed Order Fills",
                value=total_trades,
                timestamp=now_iso,
                details={"buy_trades": len(buy_trades), "sell_trades": len(sell_trades)}
            ),
            Citation(
                source="VibeFinance Orders Ledger",
                metric="Order Creation Timestamps",
                value=len(orders),
                timestamp=now_iso,
                details={"active_days": days_traded}
            ),
            Citation(
                source="User Account Metadata",
                metric="Stated Risk Profile",
                value=stated_risk,
                timestamp=now_iso,
                details={"risk_alignment": risk_alignment}
            )
        ]

        supporting_data = {
            "total_trades": total_trades,
            "buy_trades_count": len(buy_trades),
            "sell_trades_count": len(sell_trades),
            "average_trade_size": avg_trade_size,
            "std_dev_trade_size": std_dev_size,
            "sizing_cv_pct": sizing_cv,
            "trades_per_active_day": trades_per_day,
            "active_days_count": days_traded,
            "rapid_reentries_count": len(rapid_reentries),
            "rapid_reentries": rapid_reentries,
            "large_positions_count": len(large_positions),
            "stated_risk_profile": stated_risk,
            "risk_alignment": risk_alignment,
            "observable_patterns": observable_patterns,
            "recurring_mistakes": recurring_mistakes,
            "discipline_suggestions": discipline_suggestions,
            "recent_trades_sample": trades[-8:]
        }

        clean_supporting = sanitize_for_json(supporting_data)

        return AgentResponse(
            agent_name=self.agent_name,
            entity="TRADER",
            summary=summary,
            signal=behavior_signal,
            key_findings=key_findings,
            supporting_data=clean_supporting,
            scenarios=scenarios,
            sources=citations,
            risks_and_limitations=[
                "Behavioral patterns are quantitative observations of paper-trading transaction history.",
                "Metrics do not diagnose emotions, mental states, or psychological conditions.",
                "Paper-trading execution behavior may differ from real-capital psychological stress."
            ],
            timestamp=now_iso,
            data_freshness="fresh",
            confidence={
                "score": 0.92,
                "scale": "0-1.0",
                "factors": [
                    "Direct mathematical calculation over entire transaction record.",
                    "No subjective or ungrounded assumptions introduced."
                ]
            },
            missing_data=[] if total_trades >= 5 else ["Longer transaction history (recommended > 5 trades for statistical power)"],
            warnings=warnings,
            disclaimer="Simulated behavioral analysis based on observable transaction records. Not psychological or financial advice."
        )

trading_behavior_agent = TradingBehaviorAnalysisAgent()
