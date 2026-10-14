import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Star, Plus, Trash2, ArrowUpRight, ArrowDownRight, Search, X } from 'lucide-react';

export default function WatchlistsView({ onSelectStock, onOpenOrder, allStocks = [] }) {
  const [watchlists, setWatchlists] = useState([]);
  const [activeWatchlistId, setActiveWatchlistId] = useState(null);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [addStockSymbol, setAddStockSymbol] = useState('');
  const [loading, setLoading] = useState(true);

  const loadWatchlists = () => {
    api.watchlists.list()
      .then((res) => {
        setWatchlists(res.watchlists || []);
        if (res.watchlists?.length && !activeWatchlistId) {
          setActiveWatchlistId(res.watchlists[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading watchlists:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadWatchlists();
  }, []);

  const handleCreateWatchlist = async (e) => {
    e.preventDefault();
    if (!newWatchlistName.trim()) return;
    try {
      const res = await api.watchlists.create(newWatchlistName.trim());
      setNewWatchlistName('');
      setShowCreateModal(false);
      loadWatchlists();
      if (res.watchlist) setActiveWatchlistId(res.watchlist.id);
    } catch (err) {
      alert(err.message || 'Error creating watchlist');
    }
  };

  const handleDeleteWatchlist = async (id) => {
    if (!confirm('Are you sure you want to delete this watchlist?')) return;
    try {
      await api.watchlists.delete(id);
      loadWatchlists();
      setActiveWatchlistId(null);
    } catch (err) {
      alert(err.message || 'Error deleting watchlist');
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    if (!addStockSymbol || !activeWatchlistId) return;
    try {
      await api.watchlists.addStock(activeWatchlistId, addStockSymbol.toUpperCase());
      setAddStockSymbol('');
      loadWatchlists();
    } catch (err) {
      alert(err.message || 'Error adding stock');
    }
  };

  const handleRemoveStock = async (symbol) => {
    if (!activeWatchlistId) return;
    try {
      await api.watchlists.removeStock(activeWatchlistId, symbol);
      loadWatchlists();
    } catch (err) {
      alert(err.message || 'Error removing stock');
    }
  };

  const currentWatchlist = watchlists.find((w) => w.id === activeWatchlistId) || watchlists[0];
  const items = currentWatchlist?.items || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
      {/* Header and Watchlist Tabs */}
      <div className="glass-card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Star size={20} style={{ color: 'var(--warning-color)' }} /> Watchlists
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Organize favorite Indian instruments with live pricing and quick order execution
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            <Plus size={15} /> New Watchlist
          </button>
        </div>

        {/* Watchlist Tabs Bar */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
          {watchlists.map((w) => (
            <button
              key={w.id}
              onClick={() => setActiveWatchlistId(w.id)}
              className={`btn btn-secondary ${activeWatchlistId === w.id ? 'badge-fresh' : ''}`}
              style={{ fontSize: '0.82rem', padding: '6px 14px' }}
            >
              {w.name} ({w.item_count || w.items?.length || 0})
            </button>
          ))}
        </div>

        {/* Add Stock to Current Watchlist Form */}
        {currentWatchlist && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <form onSubmit={handleAddStock} style={{ display: 'flex', gap: '8px', flex: '1 1 300px' }}>
              <select
                value={addStockSymbol}
                onChange={(e) => setAddStockSymbol(e.target.value)}
                className="input-field"
                style={{ flex: 1, fontSize: '0.82rem' }}
              >
                <option value="">Select stock from 100 Universe to add...</option>
                {allStocks.map((s) => (
                  <option key={s.symbol} value={s.symbol}>
                    {s.symbol} — {s.name} ({s.sector_name})
                  </option>
                ))}
              </select>
              <button type="submit" className="btn btn-secondary" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                <Plus size={14} /> Add
              </button>
            </form>

            {!currentWatchlist.is_default && (
              <button
                onClick={() => handleDeleteWatchlist(currentWatchlist.id)}
                className="btn btn-secondary"
                style={{ color: 'var(--loss-color)', fontSize: '0.75rem', padding: '6px 12px' }}
              >
                <Trash2 size={13} /> Delete Watchlist
              </button>
            )}
          </div>
        )}
      </div>

      {/* Watchlist Items Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {items.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Star size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              This watchlist is empty
            </h4>
            <p style={{ fontSize: '0.82rem' }}>
              Select a stock from the dropdown above or browse the 100-Stock Universe to add instruments.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Instrument</th>
                  <th>Sector</th>
                  <th style={{ textAlign: 'right' }}>Latest Price (₹)</th>
                  <th style={{ textAlign: 'right' }}>Change %</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const isUp = (item.change_pct || 0) >= 0;
                  return (
                    <tr
                      key={item.symbol}
                      onClick={() => onSelectStock(item.symbol)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <strong style={{ fontSize: '0.9rem' }}>{item.symbol}</strong>
                              <span className="badge badge-outline" style={{ fontSize: '0.65rem' }}>{item.exchange || 'NSE'}</span>
                            </div>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                              {item.name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-outline" style={{ fontSize: '0.72rem' }}>
                          {item.sector_name || 'Large Cap'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }} className="font-mono">
                        <strong style={{ fontSize: '0.9rem' }}>
                          ₹{item.price ? item.price.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '---'}
                        </strong>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={`badge ${isUp ? 'bg-gain' : 'bg-loss'}`} style={{ fontSize: '0.78rem' }}>
                          {isUp ? '+' : ''}{item.change || 0} ({isUp ? '+' : ''}{item.change_pct || 0}%)
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            className="btn btn-buy"
                            style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                            onClick={() => onOpenOrder(item, 'BUY')}
                          >
                            Buy
                          </button>
                          <button
                            className="btn btn-sell"
                            style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                            onClick={() => onOpenOrder(item, 'SELL')}
                          >
                            Sell
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', color: 'var(--text-muted)' }}
                            onClick={() => handleRemoveStock(item.symbol)}
                            title="Remove from watchlist"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Watchlist Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Create New Watchlist</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateWatchlist} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Watchlist Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. EV & Green Mobility"
                  value={newWatchlistName}
                  onChange={(e) => setNewWatchlistName(e.target.value)}
                  className="input-field"
                  autoFocus
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px' }}>
                Create Watchlist
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
