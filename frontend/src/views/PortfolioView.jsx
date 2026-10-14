import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Briefcase, TrendingUp, TrendingDown, Wallet, AlertTriangle, PieChart, RotateCcw } from 'lucide-react';

export default function PortfolioView({ onSelectStock, onOpenOrder, onResetBalance }) {
  const [portfolioData, setPortfolioData] = useState(null);
  const [allocationData, setAllocationData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadPortfolio = () => {
    Promise.all([
      api.portfolio.summary(),
      api.portfolio.allocation(),
    ])
      .then(([summary, alloc]) => {
        setPortfolioData(summary);
        setAllocationData(alloc);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load portfolio:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  const summary = portfolioData?.summary || {};
  const holdings = portfolioData?.holdings || [];
  const sectorAlloc = allocationData?.sector_allocation || [];

  const isUnrealizedUp = (summary.unrealized_pnl || 0) >= 0;
  const isOverallUp = (summary.total_pnl || 0) >= 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      {/* Portfolio Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Briefcase size={22} style={{ color: 'var(--accent-blue)' }} /> Portfolio & Holdings Dashboard
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Simulated portfolio tracking with weighted average acquisition cost and real-time P&L analytics
          </p>
        </div>

        {onResetBalance && (
          <button
            onClick={() => {
              if (confirm('Reset your portfolio holdings and cash balance back to ₹10,00,000?')) {
                onResetBalance();
                setTimeout(loadPortfolio, 500);
              }
            }}
            className="btn btn-secondary"
            style={{ fontSize: '0.78rem' }}
          >
            <RotateCcw size={14} /> Reset Virtual Portfolio
          </button>
        )}
      </div>

      {/* Metrics Summary Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div className="glass-card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL WEALTH</span>
          <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px' }}>
            ₹{summary.total_portfolio_wealth ? summary.total_portfolio_wealth.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '10,00,000.00'}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Invested + Virtual Cash</span>
        </div>

        <div className="glass-card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>CURRENT VALUE</span>
          <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px' }}>
            ₹{summary.total_market_value ? summary.total_market_value.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Invested: ₹{summary.total_invested ? summary.total_invested.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}</span>
        </div>

        <div className="glass-card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>AVAILABLE CASH</span>
          <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px', color: 'var(--gain-color)' }}>
            ₹{summary.available_cash ? summary.available_cash.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '10,00,000.00'}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Simulated virtual funds</span>
        </div>

        <div className="glass-card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>UNREALIZED P&L</span>
          <div className={`font-mono ${isUnrealizedUp ? 'text-gain' : 'text-loss'}`} style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px' }}>
            {isUnrealizedUp ? '+' : ''}₹{summary.unrealized_pnl ? summary.unrealized_pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Realized: ₹{summary.realized_pnl || 0}</span>
        </div>

        <div className="glass-card" style={{ padding: '16px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL P&L (%)</span>
          <div className={`font-mono ${isOverallUp ? 'text-gain' : 'text-loss'}`} style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px' }}>
            {isOverallUp ? '+' : ''}{summary.total_pnl_pct || 0}%
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Overall return on invested</span>
        </div>
      </div>

      {/* Sector Allocation Breakdown */}
      {sectorAlloc.length > 0 && (
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChart size={16} style={{ color: 'var(--accent-blue)' }} /> Portfolio Asset & Sector Allocation
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>By Total Portfolio Wealth</span>
          </div>

          {/* Allocation Progress Bar */}
          <div style={{ display: 'flex', width: '100%', height: '14px', borderRadius: 'var(--radius-full)', overflow: 'hidden', background: 'var(--bg-secondary)', marginBottom: '14px' }}>
            {sectorAlloc.map((item, idx) => {
              const colors = ['#3b82f6', '#00d09c', '#ec4899', '#f59e0b', '#8b5cf6', '#06b6d4', '#e2e8f0'];
              return (
                <div
                  key={item.sector}
                  style={{
                    width: `${item.weight_pct}%`,
                    background: colors[idx % colors.length],
                    transition: 'width 0.3s'
                  }}
                  title={`${item.sector}: ${item.weight_pct}% (₹${item.value})`}
                />
              );
            })}
          </div>

          {/* Allocation Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
            {sectorAlloc.map((item, idx) => {
              const colors = ['#3b82f6', '#00d09c', '#ec4899', '#f59e0b', '#8b5cf6', '#06b6d4', '#e2e8f0'];
              return (
                <div key={item.sector} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors[idx % colors.length] }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{item.sector}:</span>
                  <span className="font-mono" style={{ fontWeight: 600 }}>{item.weight_pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Holdings Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Active Stock Holdings</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{holdings.length} position(s) active</span>
          </div>
        </div>

        {holdings.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Briefcase size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              No active holdings
            </h4>
            <p style={{ fontSize: '0.82rem' }}>
              Browse the 100-Stock Universe and place a simulated buy order to begin tracking positions.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Instrument</th>
                  <th>Quantity</th>
                  <th style={{ textAlign: 'right' }}>Avg. Cost (₹)</th>
                  <th style={{ textAlign: 'right' }}>Latest Price (₹)</th>
                  <th style={{ textAlign: 'right' }}>Invested (₹)</th>
                  <th style={{ textAlign: 'right' }}>Market Value (₹)</th>
                  <th style={{ textAlign: 'right' }}>Unrealized P&L</th>
                  <th style={{ textAlign: 'right' }}>Weight %</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => {
                  const isUp = (h.unrealized_pnl || 0) >= 0;
                  return (
                    <tr
                      key={h.symbol}
                      onClick={() => onSelectStock(h.symbol)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <strong style={{ fontSize: '0.9rem' }}>{h.symbol}</strong>
                            <span className="badge badge-outline" style={{ fontSize: '0.62rem' }}>{h.exchange || 'NSE'}</span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{h.name}</span>
                        </div>
                      </td>
                      <td className="font-mono" style={{ fontWeight: 600 }}>{h.quantity}</td>
                      <td style={{ textAlign: 'right' }} className="font-mono">₹{h.average_price?.toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }} className="font-mono">₹{h.current_price?.toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }} className="font-mono">₹{h.invested_value?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }} className="font-mono">
                        ₹{h.market_value?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={`badge ${isUp ? 'bg-gain' : 'bg-loss'}`} style={{ fontSize: '0.78rem' }}>
                          {isUp ? '+' : ''}₹{h.unrealized_pnl?.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({isUp ? '+' : ''}{h.unrealized_pnl_pct}%)
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-secondary)' }} className="font-mono">
                        {h.portfolio_weight_pct || 0}%
                      </td>
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn btn-sell"
                          style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                          onClick={() => onOpenOrder({ ...h, price: h.current_price }, 'SELL')}
                        >
                          Sell Position
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
