import React, { useState, useEffect } from 'react';
import { api } from './api/client';
import Navbar from './components/Navbar';
import MarketOverviewView from './views/MarketOverviewView';
import MarketsView from './views/MarketsView';
import StocksView from './views/StocksView';
import SectorsView from './views/SectorsView';
import WatchlistsView from './views/WatchlistsView';
import PortfolioView from './views/PortfolioView';
import OrdersView from './views/OrdersView';
import TransactionsView from './views/TransactionsView';
import AIInsightsView from './views/AIInsightsView';
import TradingBehaviorView from './views/TradingBehaviorView';
import LoginPage from './views/LoginPage';
import StockDetailModal from './components/StockDetailModal';
import OrderModal from './components/OrderModal';
import AddFundsModal from './components/AddFundsModal';
import { ShieldAlert } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);
  const [showLoginView, setShowLoginView] = useState(false);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);

  const [allStocks, setAllStocks] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [marketIndices, setMarketIndices] = useState([]);
  const [virtualBalance, setVirtualBalance] = useState(0.0);
  const [userWatchlists, setUserWatchlists] = useState([]);

  // Modals state
  const [selectedStockSymbol, setSelectedStockSymbol] = useState(null);
  const [orderModalData, setOrderModalData] = useState(null); // { stock, side }
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Initialize App: Check existing authentication or open login
  useEffect(() => {
    let isMounted = true;

    async function initApp() {
      try {
        // Parallel fetch universe & market data
        const [stocksRes, secRes, idxRes] = await Promise.all([
          api.stocks.list().catch(() => ({ stocks: [] })),
          api.stocks.sectors().catch(() => ({ sectors: [] })),
          api.market.indices().catch(() => ({ indices: [] })),
        ]);

        if (isMounted) {
          setAllStocks(stocksRes.stocks || []);
          setSectors(secRes.sectors || []);
          setMarketIndices(idxRes.indices || []);
        }

        // Check if user has an active session
        if (api.token) {
          try {
            const userRes = await api.users.getMe();
            if (userRes?.user && isMounted) {
              setCurrentUser(userRes.user);
              // Fetch user-specific account & watchlists
              const [accRes, wlRes] = await Promise.all([
                api.trading.account().catch(() => null),
                api.watchlists.list().catch(() => null),
              ]);
              if (accRes?.account?.virtual_balance !== undefined && isMounted) {
                setVirtualBalance(accRes.account.virtual_balance);
              }
              if (wlRes?.watchlists && isMounted) {
                setUserWatchlists(wlRes.watchlists);
              }
            }
          } catch (err) {
            console.warn('Session expired or invalid token:', err);
            api.setToken(null);
            if (isMounted) {
              setCurrentUser(null);
              setShowLoginView(true);
            }
          }
        } else {
          // No token saved: show login view
          if (isMounted) {
            setShowLoginView(true);
          }
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        if (isMounted) setLoadingInitial(false);
      }
    }

    initApp();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshAccount = async () => {
    try {
      const res = await api.trading.account();
      if (res?.account?.virtual_balance !== undefined) {
        setVirtualBalance(res.account.virtual_balance);
      }
    } catch (err) {
      console.error('Error refreshing account balance:', err);
    }
  };

  const refreshWatchlists = async () => {
    try {
      const res = await api.watchlists.list();
      if (res?.watchlists) {
        setUserWatchlists(res.watchlists);
      }
    } catch (err) {
      console.error('Error refreshing watchlists:', err);
    }
  };

  const handleLoginSuccess = async (user) => {
    setCurrentUser(user);
    setShowLoginView(false);
    await refreshAccount();
    await refreshWatchlists();
  };

  const handleLogout = async () => {
    await api.auth.logout();
    setCurrentUser(null);
    setVirtualBalance(0.0);
    setUserWatchlists([]);
    setShowLoginView(true);
  };

  const handleResetBalance = async () => {
    try {
      const res = await api.trading.resetAccount();
      if (res?.virtual_balance !== undefined) {
        setVirtualBalance(res.virtual_balance);
        alert(res.message || 'Simulated balance reset to ₹10,00,000!');
      }
    } catch (err) {
      alert(err.message || 'Failed to reset balance');
    }
  };

  const handleOpenOrder = (stock, side = 'BUY') => {
    if (!currentUser) {
      setShowLoginView(true);
      return;
    }
    setOrderModalData({ stock, side });
  };

  const handleOrderPlaced = () => {
    refreshAccount();
    api.stocks.list().then((res) => {
      if (res.stocks) setAllStocks(res.stocks);
    });
  };

  // Watchlist membership check
  const defaultWatchlist = userWatchlists.find((w) => w.is_default) || userWatchlists[0];
  const isInDefaultWatchlist = (symbol) => {
    if (!defaultWatchlist?.items) return false;
    return defaultWatchlist.items.some((i) => i.symbol === symbol);
  };

  const handleToggleWatchlist = async (symbol) => {
    if (!currentUser) {
      setShowLoginView(true);
      return;
    }
    if (!defaultWatchlist) return;
    const isMember = isInDefaultWatchlist(symbol);
    try {
      if (isMember) {
        await api.watchlists.removeStock(defaultWatchlist.id, symbol);
      } else {
        await api.watchlists.addStock(defaultWatchlist.id, symbol);
      }
      refreshWatchlists();
    } catch (err) {
      console.error('Error updating watchlist:', err);
    }
  };

  // Render Login Page if user requested or session requires it
  if (showLoginView && !currentUser) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onExploreGuest={() => setShowLoginView(false)}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        virtualBalance={virtualBalance}
        currentUser={currentUser}
        onOpenAddFunds={() => setShowAddFundsModal(true)}
        onLogout={handleLogout}
        onOpenLogin={() => setShowLoginView(true)}
        onResetBalance={handleResetBalance}
        onSelectStock={(sym) => setSelectedStockSymbol(sym)}
        allStocks={allStocks}
        marketIndices={marketIndices}
      />

      {/* Main View Area */}
      <main style={{ flex: 1, maxWidth: '1440px', width: '100%', margin: '0 auto', padding: '24px 20px' }}>
        {loadingInitial ? (
          <div style={{ padding: '100px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Loading VibeFinance Market Engine...
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Connecting to 100-stock universe and Yahoo Finance data adapter...
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <MarketOverviewView
                onSelectStock={(sym) => setSelectedStockSymbol(sym)}
                onOpenOrder={handleOpenOrder}
              />
            )}
            {activeTab === 'markets' && (
              <MarketsView onSelectStock={(sym) => setSelectedStockSymbol(sym)} />
            )}
            {activeTab === 'stocks' && (
              <StocksView
                stocks={allStocks}
                sectors={sectors}
                onSelectStock={(sym) => setSelectedStockSymbol(sym)}
                onOpenOrder={handleOpenOrder}
              />
            )}
            {activeTab === 'sectors' && (
              <SectorsView
                sectors={sectors}
                allStocks={allStocks}
                onSelectStock={(sym) => setSelectedStockSymbol(sym)}
                onOpenOrder={handleOpenOrder}
              />
            )}
            {activeTab === 'watchlists' && (
              <WatchlistsView
                allStocks={allStocks}
                onSelectStock={(sym) => setSelectedStockSymbol(sym)}
                onOpenOrder={handleOpenOrder}
              />
            )}
            {activeTab === 'portfolio' && (
              <PortfolioView
                onSelectStock={(sym) => setSelectedStockSymbol(sym)}
                onOpenOrder={handleOpenOrder}
                onResetBalance={handleResetBalance}
                onOpenAddFunds={() => setShowAddFundsModal(true)}
              />
            )}
            {activeTab === 'orders' && (
              <OrdersView onSelectStock={(sym) => setSelectedStockSymbol(sym)} />
            )}
            {activeTab === 'transactions' && (
              <TransactionsView onSelectStock={(sym) => setSelectedStockSymbol(sym)} />
            )}
            {activeTab === 'ai' && (
              <AIInsightsView
                allStocks={allStocks}
                onSelectStock={(sym) => setSelectedStockSymbol(sym)}
              />
            )}
            {activeTab === 'psychology' && (
              <TradingBehaviorView onSelectStock={(sym) => setSelectedStockSymbol(sym)} />
            )}
          </>
        )}
      </main>

      {/* Stock Detail Modal */}
      {selectedStockSymbol && (
        <StockDetailModal
          symbol={selectedStockSymbol}
          onClose={() => setSelectedStockSymbol(null)}
          onOpenOrder={handleOpenOrder}
          isInWatchlist={isInDefaultWatchlist(selectedStockSymbol)}
          onToggleWatchlist={handleToggleWatchlist}
        />
      )}

      {/* Order Execution Modal */}
      {orderModalData && (
        <OrderModal
          stock={orderModalData.stock}
          side={orderModalData.side}
          availableCash={virtualBalance}
          onClose={() => setOrderModalData(null)}
          onOrderPlaced={handleOrderPlaced}
          onOpenAddFunds={() => setShowAddFundsModal(true)}
        />
      )}

      {/* Add Virtual Funds Modal */}
      <AddFundsModal
        isOpen={showAddFundsModal}
        onClose={() => setShowAddFundsModal(false)}
        currentBalance={virtualBalance}
        onFundsUpdated={(newBal) => {
          setVirtualBalance(newBal);
          refreshAccount();
        }}
      />

      {/* Footer Disclaimer */}
      <footer style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)', padding: '16px 20px', marginTop: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldAlert size={15} style={{ color: 'var(--warning-color)' }} />
            <span>
              <strong>Simulated Financial Intelligence Disclaimer:</strong> VibeFinance operates as a paper-trading simulation platform.
              Market quotes are supplied via development yfinance adapter with 5-minute refresh attempts and no guaranteed real-time redistribution license.
            </span>
          </div>
          <div>
            100 Stocks • 10 Sectors • Multi-User Paper Trading Engine
          </div>
        </div>
      </footer>
    </div>
  );
}
