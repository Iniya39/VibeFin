import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpDown, TrendingUp, TrendingDown, LayoutGrid, List } from 'lucide-react';

export default function StocksView({ stocks = [], onSelectStock, onOpenOrder, sectors = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedExchange, setSelectedExchange] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'gainers' | 'losers'
  const [sortBy, setSortBy] = useState('market_cap'); // 'market_cap' | 'price' | 'change_pct' | 'name'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  const filteredStocks = useMemo(() => {
    return stocks.filter((s) => {
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchSym = s.symbol.toLowerCase().includes(term);
        const matchName = s.name.toLowerCase().includes(term);
        const matchSub = s.subsector?.toLowerCase().includes(term);
        if (!matchSym && !matchName && !matchSub) return false;
      }
      // Sector filter
      if (selectedSector && s.sector_id !== selectedSector) {
        return false;
      }
      // Exchange filter
      if (selectedExchange && s.exchange !== selectedExchange) {
        return false;
      }
      // Gainers / Losers filter
      if (filterType === 'gainers' && (s.change_pct || 0) <= 0) return false;
      if (filterType === 'losers' && (s.change_pct || 0) >= 0) return false;

      return true;
    }).sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (valA === undefined || valA === null) valA = 0;
      if (valB === undefined || valB === null) valB = 0;

      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [stocks, searchTerm, selectedSector, selectedExchange, filterType, sortBy, sortOrder]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
      {/* Controls Bar */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Curated 100-Stock Universe</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Showing {filteredStocks.length} of 100 verified Indian market constituents across 10 sectors
            </p>
          </div>

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
            <button
              onClick={() => setViewMode('table')}
              className={`btn btn-secondary ${viewMode === 'table' ? 'badge-fresh' : ''}`}
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            >
              <List size={14} /> Table
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`btn btn-secondary ${viewMode === 'grid' ? 'badge-fresh' : ''}`}
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            >
              <LayoutGrid size={14} /> Cards
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '220px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search ticker or company name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '32px' }}
            />
          </div>

          {/* Sector Filter */}
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="input-field"
            style={{ width: 'auto', minWidth: '180px' }}
          >
            <option value="">All 10 Sectors</option>
            {sectors.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.name} ({sec.stock_count || 10})
              </option>
            ))}
          </select>

          {/* Exchange Filter */}
          <select
            value={selectedExchange}
            onChange={(e) => setSelectedExchange(e.target.value)}
            className="input-field"
            style={{ width: 'auto', minWidth: '110px' }}
          >
            <option value="">Exchange: All</option>
            <option value="NSE">NSE Only</option>
            <option value="BSE">BSE Only</option>
          </select>

          {/* Gainers / Losers Pills */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setFilterType(filterType === 'gainers' ? 'all' : 'gainers')}
              className={`btn btn-secondary ${filterType === 'gainers' ? 'bg-gain' : ''}`}
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              <TrendingUp size={13} /> Gainers
            </button>
            <button
              onClick={() => setFilterType(filterType === 'losers' ? 'all' : 'losers')}
              className={`btn btn-secondary ${filterType === 'losers' ? 'bg-loss' : ''}`}
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              <TrendingDown size={13} /> Losers
            </button>
          </div>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' ? (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => toggleSort('symbol')} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Instrument <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th onClick={() => toggleSort('sector_name')} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Sector <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th onClick={() => toggleSort('price')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                      Price (₹) <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th onClick={() => toggleSort('change_pct')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                      Change % <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th onClick={() => toggleSort('volume')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                      Volume <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th style={{ textAlign: 'center' }}>Simulated Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map((stock) => {
                  const isUp = (stock.change_pct || 0) >= 0;
                  return (
                    <tr
                      key={stock.symbol}
                      onClick={() => onSelectStock(stock.symbol)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <strong style={{ fontSize: '0.9rem' }}>{stock.symbol}</strong>
                              <span className="badge badge-outline" style={{ fontSize: '0.65rem' }}>{stock.exchange}</span>
                              {stock.is_semiconductor_adjacent && (
                                <span className="badge badge-outline" style={{ fontSize: '0.62rem', color: 'var(--warning-color)' }}>
                                  EMS / Adjacent
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                              {stock.name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-outline" style={{ fontSize: '0.72rem' }}>
                          {stock.sector_name}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }} className="font-mono">
                        <strong style={{ fontSize: '0.9rem' }}>
                          ₹{stock.price ? stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '---'}
                        </strong>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={`badge ${isUp ? 'bg-gain' : 'bg-loss'}`} style={{ fontSize: '0.78rem' }}>
                          {isUp ? '+' : ''}{stock.change || 0} ({isUp ? '+' : ''}{stock.change_pct || 0}%)
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }} className="font-mono">
                        {stock.volume ? stock.volume.toLocaleString() : '---'}
                      </td>
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            className="btn btn-buy"
                            style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                            onClick={() => onOpenOrder(stock, 'BUY')}
                          >
                            Buy
                          </button>
                          <button
                            className="btn btn-sell"
                            style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                            onClick={() => onOpenOrder(stock, 'SELL')}
                          >
                            Sell
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Card View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {filteredStocks.map((stock) => {
            const isUp = (stock.change_pct || 0) >= 0;
            return (
              <div
                key={stock.symbol}
                className="glass-card"
                onClick={() => onSelectStock(stock.symbol)}
                style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: '1rem' }}>{stock.symbol}</strong>
                      <span className="badge badge-outline">{stock.exchange}</span>
                    </div>
                    <span className={`badge ${isUp ? 'bg-gain' : 'bg-loss'}`}>
                      {isUp ? '+' : ''}{stock.change_pct || 0}%
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {stock.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <span className="font-mono" style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                      ₹{stock.price ? stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '---'}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Vol: {stock.volume ? (stock.volume / 1000).toFixed(0) + 'k' : '---'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn btn-buy"
                    style={{ padding: '6px', fontSize: '0.78rem' }}
                    onClick={() => onOpenOrder(stock, 'BUY')}
                  >
                    Buy
                  </button>
                  <button
                    className="btn btn-sell"
                    style={{ padding: '6px', fontSize: '0.78rem' }}
                    onClick={() => onOpenOrder(stock, 'SELL')}
                  >
                    Sell
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
