import json
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.ai.intelligence import ai_intelligence
from app.api.v1.auth import get_current_user
from app.core.database import get_db

router = APIRouter(prefix="/ai", tags=["AI Investment Intelligence"])

class CompanyResearchRequest(BaseModel):
    symbol: str

@router.post("/market-analysis")
def post_market_analysis():
    """Generate high-level AI analysis of Indian equity markets and sector leadership."""
    return ai_intelligence.analyze_market()

@router.post("/company-research")
def post_company_research(req: CompanyResearchRequest):
    """Generate comprehensive AI research report for any symbol from the 100-stock universe."""
    res = ai_intelligence.research_company(req.symbol)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res

@router.post("/portfolio-analysis")
def post_portfolio_analysis(current_user: dict = Depends(get_current_user)):
    """Generate AI diagnostic report on user's active holdings, risk, and concentration."""
    return ai_intelligence.analyze_portfolio(current_user["id"])

@router.post("/behavior-analysis")
def post_behavior_analysis(current_user: dict = Depends(get_current_user)):
    """Analyze simulated trading patterns, win rate, and emotional discipline."""
    return ai_intelligence.analyze_behavior(current_user["id"])

@router.post("/comprehensive-analysis")
def post_comprehensive_analysis(req: Optional[CompanyResearchRequest] = None, current_user: dict = Depends(get_current_user)):
    """Multi-factor synthesis combining market regime, company research, and user portfolio."""
    market_rep = ai_intelligence.analyze_market()
    portfolio_rep = ai_intelligence.analyze_portfolio(current_user["id"])
    company_rep = ai_intelligence.research_company(req.symbol) if req and req.symbol else None

    return {
        "market_regime": market_rep,
        "portfolio_audit": portfolio_rep,
        "company_research": company_rep,
        "disclaimer": "AI investment intelligence generated using normalized historical and market indicators. Not financial advice."
    }

@router.get("/analysis-history")
def list_analysis_history(current_user: dict = Depends(get_current_user)):
    """List persistent AI analysis runs."""
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
        return run_dict
