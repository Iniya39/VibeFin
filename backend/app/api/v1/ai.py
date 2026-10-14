import json
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from app.ai.intelligence import ai_intelligence
from app.ai.market_agent import market_analysis_agent
from app.ai.financial_agent import financial_research_agent
from app.ai.portfolio_agent import portfolio_analysis_agent
from app.ai.behavior_agent import trading_behavior_agent
from app.ai.orchestrator import central_ai_orchestrator
from app.api.v1.auth import get_current_user
from app.core.database import get_db
from app.core.utils import sanitize_for_json

router = APIRouter(prefix="/ai", tags=["AI Investment Intelligence & Specialized Agents"])

class CompanyResearchRequest(BaseModel):
    symbol: str

class OrchestrationRequest(BaseModel):
    query: Optional[str] = "comprehensive_audit"
    symbol: Optional[str] = None
    requested_agents: Optional[List[str]] = None

# --- Specialized Agents Endpoints ---

@router.get("/agents/market")
@router.post("/agents/market")
def get_market_agent_analysis(
    symbol: Optional[str] = Query(None),
    req: Optional[CompanyResearchRequest] = None
):
    """
    Agent 1: Market Analysis Agent.
    Evaluates historical trends, technical momentum, volume anomalies,
    RSI, moving averages, support/resistance, and volatility for macro market or specific stock.
    """
    target_sym = (req.symbol if req and req.symbol else symbol)
    res = market_analysis_agent.analyze(target_sym)
    return sanitize_for_json(res.model_dump())

@router.get("/agents/financial/{symbol}")
def get_financial_agent_by_symbol(symbol: str):
    """
    Agent 2: Financial Research Agent (GET).
    Analyzes fundamentals, valuation multiples, balance sheet, cash flow, SWOT, and verified filings.
    """
    res = financial_research_agent.analyze(symbol)
    return sanitize_for_json(res.model_dump())

@router.post("/agents/financial")
def post_financial_agent_analysis(req: CompanyResearchRequest):
    """
    Agent 2: Financial Research Agent (POST).
    Analyzes fundamentals, valuation multiples, balance sheet, cash flow, SWOT, and verified filings.
    """
    res = financial_research_agent.analyze(req.symbol)
    return sanitize_for_json(res.model_dump())

@router.get("/agents/portfolio")
@router.post("/agents/portfolio")
def get_portfolio_agent_analysis(current_user: dict = Depends(get_current_user)):
    """
    Agent 3: Portfolio Analysis Agent.
    Audits actual user holdings, unrealized/realized P&L, sector weights, concentration risks, and rebalancing scenarios.
    """
    res = portfolio_analysis_agent.analyze(current_user["id"])
    return sanitize_for_json(res.model_dump())

@router.get("/agents/behavior")
@router.post("/agents/behavior")
def get_behavior_agent_analysis(current_user: dict = Depends(get_current_user)):
    """
    Agent 4: Trading Behavior Analysis Agent.
    Evaluates observable transaction sequences, position-size variance, overtrading metrics, and risk alignment.
    """
    res = trading_behavior_agent.analyze(current_user["id"])
    return sanitize_for_json(res.model_dump())

# --- Central Orchestrator Endpoint ---

@router.post("/orchestrate")
def post_orchestrated_analysis(
    req: OrchestrationRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Central AI Orchestration Layer.
    Dispatches to requested agents concurrently, isolates cross-agent conflicts,
    synthesizes multi-factor conclusions, and returns a unified report.
    """
    res = central_ai_orchestrator.orchestrate(
        query=req.query or "comprehensive_audit",
        symbol=req.symbol,
        user_id=current_user["id"],
        requested_agents=req.requested_agents
    )
    return sanitize_for_json(res.model_dump())

# --- Legacy Endpoints Preserved for Backwards Compatibility ---

@router.post("/market-analysis")
def post_market_analysis(symbol: Optional[str] = Query(None)):
    """Macro market pulse / stock market intelligence."""
    if symbol:
        res = market_analysis_agent.analyze(symbol)
        return sanitize_for_json(res.model_dump())
    return sanitize_for_json(ai_intelligence.analyze_market())

@router.post("/company-research")
def post_company_research(req: CompanyResearchRequest):
    """Generate comprehensive AI research report for any symbol from the 100-stock universe."""
    res = financial_research_agent.analyze(req.symbol)
    return sanitize_for_json(res.model_dump())

@router.post("/portfolio-analysis")
def post_portfolio_analysis(current_user: dict = Depends(get_current_user)):
    """Generate AI diagnostic report on user's active holdings, risk, and concentration."""
    res = portfolio_analysis_agent.analyze(current_user["id"])
    return sanitize_for_json(res.model_dump())

@router.post("/behavior-analysis")
def post_behavior_analysis(current_user: dict = Depends(get_current_user)):
    """Analyze simulated trading patterns, win rate, and emotional discipline."""
    res = trading_behavior_agent.analyze(current_user["id"])
    return sanitize_for_json(res.model_dump())

@router.post("/comprehensive-analysis")
def post_comprehensive_analysis(
    req: Optional[CompanyResearchRequest] = None,
    current_user: dict = Depends(get_current_user)
):
    """Multi-factor synthesis combining market regime, company research, and user portfolio."""
    res = central_ai_orchestrator.orchestrate(
        query="comprehensive_analysis",
        symbol=req.symbol if req else None,
        user_id=current_user["id"]
    )
    return sanitize_for_json(res.model_dump())

@router.get("/analysis-history")
def list_analysis_history(current_user: dict = Depends(get_current_user)):
    """List persistent AI analysis runs (retained for backend logging / compliance)."""
    user_id = current_user["id"]
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, user_id, analysis_type, target_symbol, title, summary, created_at
            FROM ai_analysis_runs
            WHERE user_id = ? OR user_id IS NULL
            ORDER BY created_at DESC LIMIT 20
        """, (user_id,))
        runs = [dict(r) for r in cursor.fetchall()]
        return {"count": len(runs), "runs": runs}

@router.get("/analysis-history/{run_id}")
def get_analysis_run(run_id: str):
    """Retrieve full details of a saved AI analysis run."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM ai_analysis_runs WHERE id = ?", (run_id,))
        run = cursor.fetchone()
        if not run:
            raise HTTPException(status_code=404, detail="Analysis run not found.")
        
        run_dict = dict(run)
        run_dict["details"] = json.loads(run_dict["details_json"])
        run_dict["evidence_citations"] = json.loads(run_dict["evidence_citations_json"])
        del run_dict["details_json"]
        del run_dict["evidence_citations_json"]
        return sanitize_for_json(run_dict)
