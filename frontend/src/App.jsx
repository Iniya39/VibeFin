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
import StockDetailModal from './components/StockDetailModal';
import OrderModal from './components/OrderModal';
import { ShieldAlert } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [allStocks, setAllStocks] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [marketIndices, setMarketIndices] = useState([]);
  const [virtualBalance, setVirtualBalance] = useState(1000000.0);
  const [userWatchlists, setUserWatchlists] = useState([]);

  // Modals state
  const [selectedStockSymbol, setSelectedStockSymbol] = useState(null);
  const [orderModalData, setOrderModalData] = useState(null); // { stock, side }
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Initialize App with seamless instant demo-session
  useEffect(() => {
    let isMounted = true;

    async function initApp() {
      try {
        // Auto-login to demo account if token missing
        if (!api.token) {
          await api.auth.demoLogin();
        }

        // Fetch parallel initial state
        const [stocksRes, secRes, accRes, wlRes, idxRes] = await Promise.all([
          api.stocks.list(),
          api.stocks.sectors(),
          api.trading.account(),
          api.watchlists.list(),
          api.market.indices(),
        ]);

        if (!isMounted) return;

        setAllStocks(stocksRes.stocks || []);
        setSectors(secRes.sectors || []);
        if (accRes?.account?.virtual_balance !== undefined) {
          setVirtualBalance(accRes.account.virtual_balance);
        }
        setUserWatchlists(wlRes.watchlists || []);
        setMarketIndices(idxRes.indices || []);
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
    setOrderModalData({ stock, side });
  };

  const handleOrderPlaced = () => {
    refreshAccount();
    // Refresh stocks quotes
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
    if (!defaultWatchlist) return;
    const isMember = isInDefaultWatchlist(symbol);
    try {
      if (isMember) {
        await api.watchlists.removeStock(defaultWatchlist.id, symbol);
      } else {
        await api.watchlists.addStock(defaultWatchlist.id, symbol);
      }
      const updatedWl = await api.watchlists.list();
      setUserWatchlists(updatedWl.watchlists || []);
    } catch (err) {
      console.error('Error updating watchlist:', err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        virtualBalance={virtualBalance}
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
        />
      )}

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
            100 Stocks • 10 Sectors • Powered by FastAPI & React
          </div>
        </div>
      </footer>
    </div>
  );
}
