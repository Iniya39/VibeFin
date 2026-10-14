import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { ClipboardList, Clock, CheckCircle2, XCircle, AlertCircle, Trash2 } from 'lucide-react';

export default function OrdersView({ onSelectStock }) {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const loadOrders = () => {
    api.trading.listOrders({ status: statusFilter })
      .then((res) => {
        setOrders(res.orders || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load orders:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const handleCancelOrder = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this pending limit order?')) return;
    try {
      await api.trading.cancelOrder(orderId);
      loadOrders();
    } catch (err) {
      alert(err.message || 'Error cancelling order');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'EXECUTED':
        return <span className="badge bg-gain"><CheckCircle2 size={12} /> Executed</span>;
      case 'PENDING':
        return <span className="badge badge-stale"><Clock size={12} /> Pending</span>;
      case 'CANCELLED':
        return <span className="badge badge-unavailable"><XCircle size={12} /> Cancelled</span>;
      case 'REJECTED':
        return <span className="badge bg-loss"><AlertCircle size={12} /> Rejected</span>;
      default:
        return <span className="badge badge-outline">{status}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
      {/* Header & Filter Controls */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={20} style={{ color: 'var(--accent-blue)' }} /> Order Book
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Complete audit trail of simulated market and limit order submissions
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['ALL', 'PENDING', 'EXECUTED', 'CANCELLED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`btn btn-secondary ${statusFilter === st ? 'badge-fresh' : ''}`}
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading order records...
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <ClipboardList size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              No orders found
            </h4>
            <p style={{ fontSize: '0.82rem' }}>
              You haven't placed any simulated orders in this category yet.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Instrument</th>
                  <th>Side</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th style={{ textAlign: 'right' }}>Limit / Target (₹)</th>
                  <th style={{ textAlign: 'right' }}>Exec. Price (₹)</th>
                  <th>Status</th>
                  <th>Time (UTC)</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      #{o.id.slice(0, 8)}
                    </td>
                    <td>
                      <span
                        onClick={() => onSelectStock && onSelectStock(o.symbol)}
                        style={{ fontWeight: 700, cursor: 'pointer', color: 'var(--accent-blue)' }}
                      >
                        {o.symbol}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${o.side === 'BUY' ? 'bg-gain' : 'bg-loss'}`}>
                        {o.side}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-outline">{o.order_type}</span>
                    </td>
                    <td className="font-mono">{o.quantity}</td>
                    <td style={{ textAlign: 'right' }} className="font-mono">
                      {o.limit_price ? `₹${o.limit_price.toFixed(2)}` : '---'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }} className="font-mono">
                      {o.execution_price ? `₹${o.execution_price.toFixed(2)}` : '---'}
                    </td>
                    <td>{getStatusBadge(o.status)}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {o.created_at ? new Date(o.created_at).toLocaleString() : '---'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {o.status === 'PENDING' ? (
                        <button
                          onClick={() => handleCancelOrder(o.id)}
                          className="btn btn-secondary"
                          style={{ padding: '3px 8px', fontSize: '0.72rem', color: 'var(--loss-color)' }}
                        >
                          Cancel
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
