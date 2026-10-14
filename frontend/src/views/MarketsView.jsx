import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Activity, TrendingUp, TrendingDown, Layers, BarChart2 } from 'lucide-react';

export default function MarketsView({ onSelectStock }) {
  const [marketOverview, setMarketOverview] = useState(null);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.market.overview(),
      api.stocks.sectors(),
    ])
      .then(([overview, secRes]) => {
        setMarketOverview(overview);
        setSectors(secRes.sectors || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading markets view:', err);
        setLoading(false);
      });
  }, []);

  const indices = marketOverview?.indices || [];
  const sectorPerf = marketOverview?.sector_performance || {};
  const gainers = marketOverview?.gainers || [];
  const losers = marketOverview?.losers || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={22} style={{ color: 'var(--accent-blue)' }} /> Indian Markets & Benchmark Indices
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Real-time benchmark tracking, sector relative strength, and market breadth indicators
        </p>
      </div>

      {/* Index Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {indices.map((idx) => {
          const isUp = (idx.change_pct || 0) >= 0;
          return (
            <div key={idx.symbol} className="glass-card" style={{ padding: '20px', borderLeft: `4px solid ${isUp ? 'var(--gain-color)' : 'var(--loss-color)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{idx.name}</span>
                <span className="badge badge-outline">{idx.exchange}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '10px' }}>
                <span className="font-mono" style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                  ₹{idx.price !== null ? idx.price?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '---'}
                </span>
                <span className={`badge ${isUp ? 'bg-gain' : 'bg-loss'}`} style={{ fontSize: '0.85rem' }}>
                  {isUp ? '+' : ''}{idx.change || 0} ({isUp ? '+' : ''}{idx.change_pct || 0}%)
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '10px' }}>
                Provider: Yahoo Finance via yfinance ({idx.provider_symbol})
              </div>
            </div>
          );
        })}
      </div>

      {/* Sector Relative Strength Heatmap */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} style={{ color: 'var(--accent-blue)' }} /> Sector Relative Strength Matrix
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>10 Distinct Configured Sectors</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
          {Object.entries(sectorPerf).map(([id, perf]) => {
            const isUp = (perf.avg_change_pct || 0) >= 0;
            return (
              <div
                key={id}
                style={{
                  background: isUp ? 'rgba(0, 208, 156, 0.08)' : 'rgba(235, 91, 60, 0.08)',
                  border: `1px solid ${isUp ? 'rgba(0, 208, 156, 0.25)' : 'rgba(235, 91, 60, 0.25)'}`,
                  padding: '14px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{perf.sector_name}</span>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{perf.stock_count} stocks</div>
                </div>
                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span className={`badge ${isUp ? 'bg-gain' : 'bg-loss'}`} style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                    {isUp ? '+' : ''}{perf.avg_change_pct}%
                  </span>
                  <span style={{ fontSize: '0.72rem', color: isUp ? 'var(--gain-color)' : 'var(--loss-color)', fontWeight: 600 }}>
                    {isUp ? 'Bullish' : 'Bearish'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
