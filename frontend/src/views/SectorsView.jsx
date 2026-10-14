import React, { useState } from 'react';
import { Layers, ChevronRight, TrendingUp, TrendingDown, Cpu, Activity, Zap, Landmark, ShoppingBag, Truck, Building2 } from 'lucide-react';

export default function SectorsView({ sectors = [], allStocks = [], onSelectStock, onOpenOrder }) {
  const [expandedSector, setExpandedSector] = useState(null);

  const getSectorIcon = (id) => {
    switch (id) {
      case 'it_software': return Cpu;
      case 'healthcare_pharma': return Activity;
      case 'energy_power': return Zap;
      case 'semiconductors_electronics': return Cpu;
      case 'banking': return Landmark;
      case 'fmcg_consumer': return ShoppingBag;
      case 'auto_ev_mobility': return Truck;
      case 'infra_industrials': return Building2;
      default: return Layers;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Sector Explorer (10 Configured Sectors)</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Each sector represents a verified 10-stock segment of the Indian stock market economy.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
        {sectors.map((sec) => {
          const Icon = getSectorIcon(sec.id);
          const sectorStocks = allStocks.filter((s) => s.sector_id === sec.id);
          const isExpanded = expandedSector === sec.id;

          // Calculate average change
          const avgChange = sectorStocks.length
            ? sectorStocks.reduce((acc, curr) => acc + (curr.change_pct || 0), 0) / sectorStocks.length
            : 0;
          const isUp = avgChange >= 0;

          return (
            <div key={sec.id} className="glass-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)' }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{sec.name}</h3>
                    <span className="badge badge-outline" style={{ fontSize: '0.7rem' }}>
                      {sectorStocks.length || 10} Constituent Stocks
                    </span>
                  </div>
                </div>
                <span className={`badge ${isUp ? 'bg-gain' : 'bg-loss'}`}>
                  {isUp ? '+' : ''}{avgChange.toFixed(2)}%
                </span>
              </div>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
                {sec.description}
              </p>

              {/* Constituents Preview List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-secondary)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                {sectorStocks.slice(0, isExpanded ? 10 : 4).map((stock) => {
                  const stockUp = (stock.change_pct || 0) >= 0;
                  return (
                    <div
                      key={stock.symbol}
                      onClick={() => onSelectStock(stock.symbol)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        transition: 'background var(--transition-fast)'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong style={{ fontSize: '0.85rem' }}>{stock.symbol}</strong>
                          <span className="badge badge-outline" style={{ fontSize: '0.62rem' }}>{stock.exchange}</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{stock.name}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                          ₹{stock.price ? stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '---'}
                        </div>
                        <span className={`badge ${stockUp ? 'bg-gain' : 'bg-loss'}`} style={{ fontSize: '0.68rem' }}>
                          {stockUp ? '+' : ''}{stock.change_pct || 0}%
                        </span>
                      </div>
                    </div>
                  );
                })}

                {sectorStocks.length > 4 && (
                  <button
                    onClick={() => setExpandedSector(isExpanded ? null : sec.id)}
                    className="btn btn-secondary"
                    style={{ width: '100%', padding: '4px', fontSize: '0.75rem', marginTop: '4px' }}
                  >
                    {isExpanded ? 'Collapse' : `View all 10 stocks (${sectorStocks.length})`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
