from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.core.database import get_db
from app.api.v1.auth import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

class UpdatePreferencesRequest(BaseModel):
    risk_profile: Optional[str] = None
    investment_horizon: Optional[str] = None
    theme: Optional[str] = None
    notification_prefs: Optional[str] = None

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Get preferences
        cursor.execute("SELECT * FROM user_preferences WHERE user_id = ?", (user_id,))
        prefs = cursor.fetchone()
        
        # Get paper trading account
        cursor.execute("SELECT * FROM paper_trading_accounts WHERE user_id = ?", (user_id,))
        account = cursor.fetchone()

        return {
            "user": current_user,
            "preferences": dict(prefs) if prefs else None,
            "account": dict(account) if account else None
        }

@router.patch("/me/preferences")
def update_preferences(req: UpdatePreferencesRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    now_iso = datetime.now(timezone.utc).isoformat()
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM user_preferences WHERE user_id = ?", (user_id,))
        current = cursor.fetchone()
        
        risk = req.risk_profile or (current["risk_profile"] if current else "moderate")
        horizon = req.investment_horizon or (current["investment_horizon"] if current else "medium_term")
        theme = req.theme or (current["theme"] if current else "dark")
        notifs = req.notification_prefs or (current["notification_prefs"] if current else "")

        cursor.execute("""
            INSERT INTO user_preferences (user_id, risk_profile, investment_horizon, theme, notification_prefs, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                risk_profile = excluded.risk_profile,
                investment_horizon = excluded.investment_horizon,
                theme = excluded.theme,
                notification_prefs = excluded.notification_prefs,
                updated_at = excluded.updated_at;
        """, (user_id, risk, horizon, theme, notifs, now_iso))

        return {
            "success": True,
            "preferences": {
                "risk_profile": risk,
                "investment_horizon": horizon,
                "theme": theme,
                "notification_prefs": notifs
            }
        }
