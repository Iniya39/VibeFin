import pytest
import uuid
from datetime import datetime, timezone
from app.core.database import init_db, seed_master_data, get_db
from app.trading.engine import trading_engine
from app.ai.market_agent import market_analysis_agent
from app.ai.financial_agent import financial_research_agent
from app.ai.portfolio_agent import portfolio_analysis_agent
from app.ai.behavior_agent import trading_behavior_agent
from app.ai.orchestrator import central_ai_orchestrator
from app.ai.schemas import AgentResponse, OrchestratedAnalysis

@pytest.fixture(autouse=True)
def setup_db():
    init_db()
    seed_master_data()

def create_agent_test_user():
    user_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO users (id, email, hashed_password, full_name, is_active, created_at)
            VALUES (?, ?, 'dummyhash', 'Agent Tester', 1, ?)
        """, (user_id, f"test_{user_id[:8]}@vibefinance.in", now_iso))
        cursor.execute("""
            INSERT INTO user_preferences (user_id, risk_profile, investment_horizon, updated_at)
            VALUES (?, 'moderate', 'medium_term', ?)
        """, (user_id, now_iso))
    return user_id

def test_market_analysis_agent_macro():
    res = market_analysis_agent.analyze()
    assert isinstance(res, AgentResponse)
    assert res.agent_name == "Market Analysis Agent"
    assert res.entity == "INDIAN_MARKET"
    assert res.signal in ["Bullish", "Bearish", "Neutral / Consolidating"]
    assert len(res.key_findings) > 0
    assert "nifty" in res.supporting_data
    assert len(res.sources) >= 2

def test_market_analysis_agent_stock_selection():
    res = market_analysis_agent.analyze("RELIANCE")
    assert isinstance(res, AgentResponse)
    assert res.entity == "RELIANCE"
    assert any(w in res.signal.lower() for w in ["bullish", "bearish", "neutral", "overbought", "oversold", "sideways"])
    assert "rsi_14" in res.supporting_data
    assert "sma_20" in res.supporting_data
    assert "volume_anomaly_ratio" in res.supporting_data
    assert res.scenarios is not None
    assert len(res.scenarios) == 3

def test_market_analysis_agent_unsupported_symbol():
    res = market_analysis_agent.analyze("NONEXISTENT_XYZ")
    assert isinstance(res, AgentResponse)
    assert res.signal == "Unavailable"
    assert res.data_freshness == "unavailable"

def test_financial_research_agent():
    res = financial_research_agent.analyze("TCS")
    assert isinstance(res, AgentResponse)
    assert res.agent_name == "Financial Research Agent"
    assert res.entity == "TCS"
    assert "pe_ratio" in res.supporting_data
    assert "swot_analysis" in res.supporting_data
    assert "verified_metrics" in res.supporting_data
    assert len(res.sources) >= 2
    assert len(res.scenarios) == 3

def test_financial_research_agent_invalid_symbol():
    res = financial_research_agent.analyze("FAKE_TICKER")
    assert res.signal == "Unavailable"
    assert res.data_freshness == "unavailable"

def test_portfolio_agent_and_behavior_agent_workflow():
    user_id = create_agent_test_user()

    # 1. Test empty portfolio state
    empty_port = portfolio_analysis_agent.analyze(user_id)
    assert empty_port.agent_name == "Portfolio Analysis Agent"
    assert "100% Cash" in empty_port.signal or "Inactive" in empty_port.signal
    assert empty_port.supporting_data["holdings_count"] == 0

    # 2. Test empty behavior state
    empty_behav = trading_behavior_agent.analyze(user_id)
    assert empty_behav.agent_name == "Trading Behavior Analysis Agent"
    assert empty_behav.signal == "Insufficient Trade History"

    # 3. Execute a trade to generate portfolio holdings and transactions
    trade_res = trading_engine.place_order(
        user_id=user_id,
        symbol="INFY",
        side="BUY",
        order_type="MARKET",
        quantity=5,
        current_market_price=1800.0
    )
    assert trade_res["success"] is True
    assert trade_res["order"]["status"] == "EXECUTED"

    # 4. Re-test Portfolio Analysis Agent with active position
    active_port = portfolio_analysis_agent.analyze(user_id)
    assert active_port.agent_name == "Portfolio Analysis Agent"
    assert active_port.supporting_data["active_positions_count"] >= 1
    assert active_port.supporting_data["total_invested"] > 0
    assert len(active_port.supporting_data["holdings"]) >= 1
    assert len(active_port.scenarios) == 3

    # 5. Re-test Behavior Agent with trade record
    active_behav = trading_behavior_agent.analyze(user_id)
    assert active_behav.agent_name == "Trading Behavior Analysis Agent"
    assert active_behav.supporting_data["total_trades"] >= 1
    assert active_behav.supporting_data["average_trade_size"] > 0
    assert len(active_behav.supporting_data["observable_patterns"]) >= 1

def test_central_orchestrator_comprehensive_workflow():
    res = central_ai_orchestrator.orchestrate(
        query="comprehensive_test",
        symbol="RELIANCE",
        requested_agents=["market", "financial"]
    )
    assert isinstance(res, OrchestratedAnalysis)
    assert "market" in res.agent_results
    assert "financial" in res.agent_results
    assert len(res.agents_involved) == 2
    assert res.overall_sentiment is not None
    assert isinstance(res.cross_agent_conflicts, list)
    assert isinstance(res.key_risks, list)
