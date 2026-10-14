import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)

class SignUpRequest(BaseModel):
    email: str
    password: str
    full_name: str

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(credentials.credentials)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload["sub"]
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, full_name, is_active, created_at FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        if not user or not user["is_active"]:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
        return dict(user)

@router.post("/signup", response_model=TokenResponse)
def signup(req: SignUpRequest):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE email = ?", (req.email.lower(),))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="An account with this email already exists.")

        user_id = str(uuid.uuid4())
        hashed_pw = get_password_hash(req.password)
        now_iso = datetime.now(timezone.utc).isoformat()

        # Insert user
        cursor.execute("""
            INSERT INTO users (id, email, hashed_password, full_name, is_active, created_at)
            VALUES (?, ?, ?, ?, 1, ?)
        """, (user_id, req.email.lower(), hashed_pw, req.full_name, now_iso))

        # Default preferences
        cursor.execute("""
            INSERT INTO user_preferences (user_id, risk_profile, investment_horizon, theme, updated_at)
            VALUES (?, 'moderate', 'medium_term', 'dark', ?)
        """, (user_id, now_iso))

        # Default paper trading account with ₹10,00,000 virtual balance
        account_id = str(uuid.uuid4())
        initial_balance = settings.DEFAULT_STARTING_BALANCE
        cursor.execute("""
            INSERT INTO paper_trading_accounts (id, user_id, virtual_balance, currency, created_at, updated_at)
            VALUES (?, ?, ?, 'INR', ?, ?)
        """, (account_id, user_id, initial_balance, now_iso, now_iso))

        # Initial ledger record
        ledger_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO simulated_cash_ledger (id, account_id, type, amount, balance_after, description, created_at)
            VALUES (?, ?, 'INITIAL_DEPOSIT', ?, ?, 'Initial simulated trading deposit', ?)
        """, (ledger_id, account_id, initial_balance, initial_balance, now_iso))

        # Default watchlist with top 5 bellwether stocks
        watchlist_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO watchlists (id, user_id, name, is_default, created_at)
            VALUES (?, ?, 'My Favorites', 1, ?)
        """, (watchlist_id, user_id, now_iso))
        
        default_symbols = ["TCS", "RELIANCE", "HDFCBANK", "INFY", "TATASTEEL"]
        for idx, sym in enumerate(default_symbols):
            cursor.execute("""
                INSERT INTO watchlist_items (id, watchlist_id, symbol, sort_order, added_at)
                VALUES (?, ?, ?, ?, ?)
            """, (str(uuid.uuid4()), watchlist_id, sym, idx, now_iso))

        token = create_access_token(user_id)
        user_data = {"id": user_id, "email": req.email.lower(), "full_name": req.full_name, "created_at": now_iso}
        return {"access_token": token, "token_type": "bearer", "user": user_data}

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ?", (req.email.lower(),))
        user = cursor.fetchone()
        if not user or not verify_password(req.password, user["hashed_password"]):
            raise HTTPException(status_code=400, detail="Invalid email or password.")
        
        if not user["is_active"]:
            raise HTTPException(status_code=403, detail="Account is disabled.")

        token = create_access_token(user["id"])
        user_data = {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "created_at": user["created_at"]
        }
        return {"access_token": token, "token_type": "bearer", "user": user_data}

@router.post("/demo-login", response_model=TokenResponse)
def demo_login():
    """Instant 1-click guest/demo login for testing."""
    demo_email = "demo.investor@vibefinance.in"
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ?", (demo_email,))
        user = cursor.fetchone()
        
        if not user:
            # Create demo account
            user_id = str(uuid.uuid4())
            now_iso = datetime.now(timezone.utc).isoformat()
            hashed_pw = get_password_hash("VibeInvestor2026!")
            
            cursor.execute("""
                INSERT INTO users (id, email, hashed_password, full_name, is_active, created_at)
                VALUES (?, ?, ?, 'Demo Pro Trader', 1, ?)
            """, (user_id, demo_email, hashed_pw, now_iso))
            
            cursor.execute("""
                INSERT INTO user_preferences (user_id, risk_profile, investment_horizon, theme, updated_at)
                VALUES (?, 'moderate', 'long_term', 'dark', ?)
            """, (user_id, now_iso))

            account_id = str(uuid.uuid4())
            initial_balance = settings.DEFAULT_STARTING_BALANCE
            cursor.execute("""
                INSERT INTO paper_trading_accounts (id, user_id, virtual_balance, currency, created_at, updated_at)
                VALUES (?, ?, ?, 'INR', ?, ?)
            """, (account_id, user_id, initial_balance, now_iso, now_iso))

            ledger_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO simulated_cash_ledger (id, account_id, type, amount, balance_after, description, created_at)
                VALUES (?, ?, 'INITIAL_DEPOSIT', ?, ?, 'Initial simulated trading deposit', ?)
            """, (ledger_id, account_id, initial_balance, initial_balance, now_iso))

            # Default Watchlist
            watchlist_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO watchlists (id, user_id, name, is_default, created_at)
                VALUES (?, ?, 'Core Bluechips', 1, ?)
            """, (watchlist_id, user_id, now_iso))
            for idx, sym in enumerate(["TCS", "RELIANCE", "HDFCBANK", "MARUTI", "LT"]):
                cursor.execute("""
                    INSERT INTO watchlist_items (id, watchlist_id, symbol, sort_order, added_at)
                    VALUES (?, ?, ?, ?, ?)
                """, (str(uuid.uuid4()), watchlist_id, sym, idx, now_iso))

            token = create_access_token(user_id)
            return {
                "access_token": token,
                "token_type": "bearer",
                "user": {"id": user_id, "email": demo_email, "full_name": "Demo Pro Trader", "created_at": now_iso}
            }
        else:
            token = create_access_token(user["id"])
            return {
                "access_token": token,
                "token_type": "bearer",
                "user": {"id": user["id"], "email": user["email"], "full_name": user["full_name"], "created_at": user["created_at"]}
            }

@router.post("/logout")
def logout(current_user: dict = Depends(get_current_user)):
    return {"message": "Successfully logged out."}
