import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { History, ReceiptText, Wallet } from 'lucide-react';

export default function TransactionsView({ onSelectStock, virtualBalance }) {
  const [activeTab, setActiveTab] = useState('trades'); // 'trades' | 'ledger'
  const [trades, setTrades] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.trading.trades(),
      api.trading.ledger(),
    ])
      .then(([tradeRes, ledgerRes]) => {
        setTrades(tradeRes.trades || []);
        setLedger(ledgerRes.ledger || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading transactions:', err);
        setLoading(false);
      });
  }, [virtualBalance]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={20} style={{ color: 'var(--accent-blue)' }} /> Transactions & Financial Ledger
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Immutable double-entry audit records for executed trades and virtual cash movements
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
          <button
            onClick={() => setActiveTab('trades')}
            className={`btn btn-secondary ${activeTab === 'trades' ? 'badge-fresh' : ''}`}
            style={{ fontSize: '0.78rem', padding: '6px 14px' }}
          >
            <ReceiptText size={14} /> Executed Trades ({trades.length})
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`btn btn-secondary ${activeTab === 'ledger' ? 'badge-fresh' : ''}`}
            style={{ fontSize: '0.78rem', padding: '6px 14px' }}
          >
            <Wallet size={14} /> Cash Ledger ({ledger.length})
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading audit records...
          </div>
        ) : activeTab === 'trades' ? (
          trades.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <ReceiptText size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                No executed trades
              </h4>
              <p style={{ fontSize: '0.82rem' }}>
                Execute a simulated market or limit trade to record your first transaction.
              </p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Trade ID</th>
                    <th>Order Ref</th>
                    <th>Instrument</th>
                    <th>Side</th>
                    <th>Quantity</th>
                    <th style={{ textAlign: 'right' }}>Price (₹)</th>
                    <th style={{ textAlign: 'right' }}>Gross (₹)</th>
                    <th style={{ textAlign: 'right' }}>Fee (0.05%)</th>
                    <th style={{ textAlign: 'right' }}>Net Cash Impact</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((t) => (
                    <tr key={t.id}>
                      <td className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        #{t.id.slice(0, 8)}
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        #{t.order_id?.slice(0, 8)}
                      </td>
                      <td>
                        <strong
                          onClick={() => onSelectStock && onSelectStock(t.symbol)}
                          style={{ cursor: 'pointer', color: 'var(--accent-blue)' }}
                        >
                          {t.symbol}
                        </strong>
                      </td>
                      <td>
                        <span className={`badge ${t.side === 'BUY' ? 'bg-gain' : 'bg-loss'}`}>
                          {t.side}
                        </span>
                      </td>
                      <td className="font-mono">{t.quantity}</td>
                      <td style={{ textAlign: 'right' }} className="font-mono">₹{t.price?.toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }} className="font-mono">₹{t.gross_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'right', color: 'var(--text-muted)' }} className="font-mono">₹{t.fee_amount?.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }} className={`font-mono ${t.side === 'BUY' ? 'text-loss' : 'text-gain'}`}>
                        {t.side === 'BUY' ? '-' : '+'}₹{t.net_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {t.executed_at ? new Date(t.executed_at).toLocaleString() : '---'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Cash Ledger View */
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Entry ID</th>
                  <th>Transaction Type</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'right' }}>Balance After (₹)</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((l) => {
                  const isCredit = l.amount >= 0;
                  return (
                    <tr key={l.id}>
                      <td className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        #{l.id.slice(0, 8)}
                      </td>
                      <td>
                        <span className="badge badge-outline" style={{ fontSize: '0.72rem' }}>
                          {l.type}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>{l.description}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }} className={`font-mono ${isCredit ? 'text-gain' : 'text-loss'}`}>
                        {isCredit ? '+' : ''}₹{l.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }} className="font-mono">
                        ₹{l.balance_after?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {l.created_at ? new Date(l.created_at).toLocaleString() : '---'}
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
