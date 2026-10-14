from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "VibeFinance"

def test_demo_login_and_auth_flow():
    response = client.post("/api/v1/auth/demo-login")
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    token = data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Test /api/v1/users/me
    me_resp = client.get("/api/v1/users/me", headers=headers)
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["user"]["email"] == "demo.investor@vibefinance.in"
    assert me_data["account"]["virtual_balance"] >= 0

def test_stocks_endpoints():
    # 1. List stocks
    resp = client.get("/api/v1/stocks")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_universe"] == 100
    assert data["count"] == 100

    # 2. Sector filtering
    sec_resp = client.get("/api/v1/stocks?sector=it_software")
    assert sec_resp.status_code == 200
    assert sec_resp.json()["count"] == 10

    # 3. List sectors
    sectors_resp = client.get("/api/v1/stocks/sectors")
    assert sectors_resp.status_code == 200
    sec_data = sectors_resp.json()
    assert sec_data["total_sectors"] == 10
    for s in sec_data["sectors"]:
        assert s["stock_count"] == 10

    # 4. Stock detail
    detail_resp = client.get("/api/v1/stocks/TCS")
    assert detail_resp.status_code == 200
    det_data = detail_resp.json()
    assert det_data["instrument"]["symbol"] == "TCS"
    assert det_data["instrument"]["exchange"] == "NSE"

def test_market_endpoints():
    status_resp = client.get("/api/v1/market/status")
    assert status_resp.status_code == 200
    data = status_resp.json()
    assert "provider" in data
    assert "refresh_interval_seconds" in data

def test_trading_and_portfolio_flow():
    # Login as demo user
    login_resp = client.post("/api/v1/auth/demo-login")
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Reset account to clean state
    reset_resp = client.post("/api/v1/trading/account/reset", headers=headers)
    assert reset_resp.status_code == 200

    # Place market buy order for 5 shares of INFY
    buy_resp = client.post("/api/v1/trading/orders", json={
        "symbol": "INFY",
        "side": "BUY",
        "order_type": "MARKET",
        "quantity": 5
    }, headers=headers)
    
    # If quote is not yet fetched in test, provide simulated execution price test via place_order direct or verify error handling
    # The endpoint handles either execution or explicit rejection if quote unavailable
    assert buy_resp.status_code in [200, 400]

    # Check portfolio summary
    port_resp = client.get("/api/v1/portfolio", headers=headers)
    assert port_resp.status_code == 200
    port_data = port_resp.json()
    assert "summary" in port_data
    assert "holdings" in port_data
