import React, { useState, useMemo, useEffect } from 'react';
import { api } from '../api/client';
import {
  Search,
  Filter,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  LayoutGrid,
  List,
  Sparkles,
  BarChart3,
  ShieldAlert,
  RotateCcw,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Building2,
  DollarSign
} from 'lucide-react';

export default function StocksView({ stocks = [], onSelectStock, onOpenOrder, sectors = [] }) {
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'research'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedExchange, setSelectedExchange] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'gainers' | 'losers'
  const [sortBy, setSortBy] = useState('market_cap');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Financial Research Agent state
  const [researchSymbol, setResearchSymbol] = useState('TCS');
  const [researchData, setResearchData] = useState(null);
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchError, setResearchError] = useState(null);

  const filteredStocks = useMemo(() => {
    return stocks.filter((s) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchSym = s.symbol.toLowerCase().includes(term);
        const matchName = s.name.toLowerCase().includes(term);
        const matchSub = s.subsector?.toLowerCase().includes(term);
        if (!matchSym && !matchName && !matchSub) return false;
      }
      if (selectedSector && s.sector_id !== selectedSector) return false;
      if (selectedExchange && s.exchange !== selectedExchange) return false;
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

  const fetchResearch = async (symbol) => {
    setResearchLoading(true);
    setResearchError(null);
    try {
      const res = await api.ai.financialAgent(symbol);
      setResearchData(res);
    } catch (err) {
      console.error('Error fetching financial research:', err);
      setResearchError(err.message || 'Failed to generate financial research report.');
    } finally {
      setResearchLoading(false);
    }
  };

  const handleOpenResearchForStock = (symbol) => {
    setResearchSymbol(symbol);
    setActiveTab('research');
    fetchResearch(symbol);
  };

  useEffect(() => {
    if (activeTab === 'research' && !researchData) {
      fetchResearch(researchSymbol);
    }
  }, [activeTab]);

  const supporting = researchData?.supporting_data || {};
  const swot = supporting.swot_analysis || {};
  const verifiedMetrics = supporting.verified_metrics || [];
  const estimatedMetrics = supporting.estimated_metrics || [];
  const announcements = supporting.announcements || [];
  const scenarios = researchData?.scenarios || [];
  const sources = researchData?.sources || [];
  const risks = researchData?.risks_and_limitations || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
      {/* Header with Navigation Toggle */}
      <div
        className="glass-card"
        style={{
          padding: '20px',
          background: 'linear-gradient(135deg, rgba(20, 28, 46, 0.95) 0%, rgba(31, 43, 69, 0.8) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.3)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={22} style={{ color: 'var(--accent-blue)' }} /> Stock Directory & Corporate Research
              </h2>
              <span className="badge badge-outline" style={{ borderColor: 'rgba(59, 130, 246, 0.5)', color: 'var(--accent-blue)' }}>
                Stocks Hub
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Full 100-constituent Indian screener with integrated Financial Research Agent
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
            <button
              onClick={() => setActiveTab('directory')}
              className={`btn btn-secondary ${activeTab === 'directory' ? 'badge-fresh' : ''}`}
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            >
              <List size={14} /> Stock Screener (100)
            </button>
            <button
              onClick={() => {
                setActiveTab('research');
                if (!researchData) fetchResearch(researchSymbol);
              }}
              className={`btn btn-secondary ${activeTab === 'research' ? 'badge-fresh' : ''}`}
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            >
              <Sparkles size={14} /> Financial Research Agent
            </button>
          </div>
        </div>
      </div>

      {/* --- SUBTAB 1: DIRECTORY & SCREENER --- */}
      {activeTab === 'directory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Controls Bar */}
          <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Showing <strong>{filteredStocks.length}</strong> of 100 verified Indian stocks
              </span>

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
              <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '220px' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search ticker, name, or subsector..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '32px' }}
                />
              </div>

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

              <select
                value={selectedExchange}
                onChange={(e) => setSelectedExchange(e.target.value)}
                className="input-field"
                style={{ width: 'auto' }}
              >
                <option value="">All Exchanges</option>
                <option value="NSE">NSE Only</option>
                <option value="BSE">BSE Only</option>
              </select>

              <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-secondary)', padding: '2px', borderRadius: 'var(--radius-sm)' }}>
                {['all', 'gainers', 'losers'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`btn btn-secondary ${filterType === type ? 'badge-fresh' : ''}`}
                    style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                  >
                    {type.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table View */}
          {viewMode === 'table' ? (
            <div className="glass-card" style={{ padding: '0', overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th onClick={() => toggleSort('symbol')} style={{ cursor: 'pointer' }}>
                      Symbol <ArrowUpDown size={12} style={{ display: 'inline' }} />
                    </th>
                    <th onClick={() => toggleSort('name')} style={{ cursor: 'pointer' }}>
                      Company Name <ArrowUpDown size={12} style={{ display: 'inline' }} />
                    </th>
                    <th>Sector</th>
                    <th onClick={() => toggleSort('price')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                      Price (₹) <ArrowUpDown size={12} style={{ display: 'inline' }} />
                    </th>
                    <th onClick={() => toggleSort('change_pct')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                      24h Change <ArrowUpDown size={12} style={{ display: 'inline' }} />
                    </th>
                    <th style={{ textAlign: 'center' }}>AI Research</th>
                    <th style={{ textAlign: 'right' }}>Trade</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStocks.map((stock) => {
                    const isUp = (stock.change_pct || 0) >= 0;
                    return (
                      <tr key={stock.symbol} style={{ cursor: 'pointer' }} onClick={() => onSelectStock && onSelectStock(stock.symbol)}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong className="font-mono">{stock.symbol}</strong>
                            <span className="badge badge-outline" style={{ fontSize: '0.65rem' }}>{stock.exchange}</span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{stock.name}</td>
                        <td>
                          <span className="badge badge-outline" style={{ fontSize: '0.7rem' }}>{stock.sector_name}</span>
                        </td>
                        <td className="font-mono" style={{ textAlign: 'right', fontWeight: 700 }}>
                          ₹{stock.price ? stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '---'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className={`badge ${isUp ? 'bg-gain' : 'bg-loss'}`}>
                            {isUp ? '+' : ''}{stock.change_pct || 0}%
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenResearchForStock(stock.symbol)}
                            className="btn btn-secondary"
                            style={{ padding: '3px 8px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            title="Open Financial Research Agent report"
                          >
                            <Sparkles size={12} color="var(--accent-blue)" /> Research
                          </button>
                        </td>
                        <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              className="btn btn-buy"
                              style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                              onClick={() => onOpenOrder && onOpenOrder(stock, 'BUY')}
                            >
                              Buy
                            </button>
                            <button
                              className="btn btn-sell"
                              style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                              onClick={() => onOpenOrder && onOpenOrder(stock, 'SELL')}
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
          ) : (
            /* Grid View */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
              {filteredStocks.map((stock) => {
                const isUp = (stock.change_pct || 0) >= 0;
                return (
                  <div
                    key={stock.symbol}
                    className="glass-card"
                    style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' }}
                    onClick={() => onSelectStock && onSelectStock(stock.symbol)}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong style={{ fontSize: '1rem' }}>{stock.symbol}</strong>
                          <span className="badge badge-outline">{stock.exchange}</span>
                        </div>
                        <span className={`badge ${isUp ? 'bg-gain' : 'bg-loss'}`}>
                          {isUp ? '+' : ''}{stock.change_pct || 0}%
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                        {stock.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span className="font-mono" style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                          ₹{stock.price ? stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '---'}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {stock.sector_name}
                        </span>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenResearchForStock(stock.symbol)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Sparkles size={12} color="var(--accent-blue)" /> Research
                      </button>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          className="btn btn-buy"
                          style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                          onClick={() => onOpenOrder && onOpenOrder(stock, 'BUY')}
                        >
                          Buy
                        </button>
                        <button
                          className="btn btn-sell"
                          style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                          onClick={() => onOpenOrder && onOpenOrder(stock, 'SELL')}
                        >
                          Sell
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- SUBTAB 2: FINANCIAL RESEARCH AGENT --- */}
      {activeTab === 'research' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Target Stock Selector */}
          <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Target Company:
              </span>
              <select
                value={researchSymbol}
                onChange={(e) => {
                  setResearchSymbol(e.target.value);
                  fetchResearch(e.target.value);
                }}
                className="input-field"
                style={{ width: 'auto', minWidth: '240px', padding: '6px 12px', fontSize: '0.85rem' }}
              >
                {stocks.map((s) => (
                  <option key={s.symbol} value={s.symbol}>
                    {s.symbol} — {s.name} ({s.sector_name})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => fetchResearch(researchSymbol)}
              disabled={researchLoading}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={14} className={researchLoading ? 'animate-spin' : ''} />
              Re-Audit Fundamentals
            </button>
          </div>

          {/* Loading */}
          {researchLoading && (
            <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Building2 size={32} className="animate-spin" style={{ color: 'var(--accent-blue)', margin: '0 auto 12px' }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Generating Deep Financial Research Report...
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Analyzing balance sheet solvency, trailing P/E multiples, audited RoE, and regulatory disclosures...
              </p>
            </div>
          )}

          {/* Error */}
          {researchError && !researchLoading && (
            <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid var(--loss-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--loss-color)', fontWeight: 700 }}>
                <ShieldAlert size={18} /> Research Limitation
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>{researchError}</p>
            </div>
          )}

          {/* Loaded Report */}
          {researchData && !researchLoading && (
            <>
              {/* Executive Summary Card */}
              <div
                className="glass-card"
                style={{
                  padding: '20px',
                  borderLeft: `4px solid ${
                    (researchData.signal || '').includes('Strong') ? 'var(--gain-color)' :
                    (researchData.signal || '').includes('Caution') || (researchData.signal || '').includes('Stretched') ? 'var(--loss-color)' :
                    'var(--accent-blue)'
                  }`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                        {supporting.company_name} ({researchData.entity})
                      </span>
                      <span
                        className={`badge ${
                          (researchData.signal || '').includes('Strong') ? 'bg-gain' :
                          (researchData.signal || '').includes('Caution') ? 'bg-loss' :
                          'badge-outline'
                        }`}
                        style={{ fontSize: '0.85rem', fontWeight: 700 }}
                      >
                        {researchData.signal}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '6px' }}>
                      <span className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800 }}>
                        ₹{supporting.current_price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Sector: <strong>{supporting.sector}</strong> ({supporting.subsector})
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="badge badge-fresh">Freshness: {researchData.data_freshness}</span>
                    {researchData.confidence && (
                      <span className="badge badge-outline">
                        Confidence: {Math.round((researchData.confidence.score || 0) * 100)}%
                      </span>
                    )}
                  </div>
                </div>

                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '12px', lineHeight: 1.6 }}>
                  {researchData.summary}
                </p>

                {/* Business summary */}
                <div style={{ marginTop: '14px', padding: '12px 14px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <strong>Corporate Profile:</strong> {supporting.business_summary}
                </div>
              </div>

              {/* Verified vs Estimated Financial Data Verification Badges */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <CheckCircle2 size={18} style={{ color: 'var(--gain-color)' }} /> Verified Disclosures vs. Model Estimations
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  {verifiedMetrics.map((vm, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(0, 208, 156, 0.05)',
                        border: '1px solid rgba(0, 208, 156, 0.25)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{vm.metric}</div>
                        <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2px' }}>
                          {String(vm.value)}
                        </div>
                      </div>
                      <span className="badge bg-gain" style={{ fontSize: '0.65rem' }}>{vm.status}</span>
                    </div>
                  ))}

                  {estimatedMetrics.map((em, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(245, 158, 11, 0.05)',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{em.metric}</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '2px' }}>
                          {String(em.value)}
                        </div>
                      </div>
                      <span className="badge" style={{ background: '#f59e0b', color: '#000', fontSize: '0.65rem' }}>{em.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fundamental Metrics Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                <div className="glass-card" style={{ padding: '16px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>TRAILING P/E</span>
                  <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px' }}>
                    {supporting.pe_ratio ? `${supporting.pe_ratio}x` : 'N/A'}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{supporting.valuation_verdict}</span>
                </div>

                <div className="glass-card" style={{ padding: '16px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>PRICE TO BOOK (P/B)</span>
                  <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px' }}>
                    {supporting.pb_ratio ? `${supporting.pb_ratio}x` : 'N/A'}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Book Value Multiple</span>
                </div>

                <div className="glass-card" style={{ padding: '16px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>RETURN ON EQUITY (ROE)</span>
                  <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px', color: (supporting.roe || 0) > 18 ? 'var(--gain-color)' : 'var(--text-primary)' }}>
                    {supporting.roe ? `${supporting.roe}%` : 'N/A'}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Shareholder capital efficiency</span>
                </div>

                <div className="glass-card" style={{ padding: '16px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>DEBT-TO-EQUITY</span>
                  <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px', color: (supporting.debt_to_equity || 0) > 2.0 ? 'var(--loss-color)' : 'var(--text-primary)' }}>
                    {supporting.debt_to_equity !== null && supporting.debt_to_equity !== undefined ? `${supporting.debt_to_equity}x` : 'Prudent (<0.8x)'}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Balance Sheet Solvency</span>
                </div>

                <div className="glass-card" style={{ padding: '16px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>MARKET CAPITALIZATION</span>
                  <div className="font-mono" style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '4px' }}>
                    ₹{supporting.market_cap ? (supporting.market_cap / 1e7).toLocaleString('en-IN', { maximumFractionDigits: 0 }) + ' Cr' : 'Large-Cap'}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>NSE Benchmark Weight</span>
                </div>
              </div>

              {/* SWOT Analysis */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <FileText size={18} style={{ color: 'var(--accent-blue)' }} /> Strategic SWOT Analysis
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                  {/* Strengths */}
                  <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', background: 'rgba(0, 208, 156, 0.05)', border: '1px solid rgba(0, 208, 156, 0.2)' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gain-color)', marginBottom: '8px' }}>STRENGTHS</div>
                    <ul style={{ paddingLeft: '16px', fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {swot.strengths?.map((item, idx) => <li key={idx}>{item}</li>)}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', background: 'rgba(235, 91, 60, 0.05)', border: '1px solid rgba(235, 91, 60, 0.2)' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--loss-color)', marginBottom: '8px' }}>WEAKNESSES</div>
                    <ul style={{ paddingLeft: '16px', fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {swot.weaknesses?.map((item, idx) => <li key={idx}>{item}</li>)}
                    </ul>
                  </div>

                  {/* Opportunities */}
                  <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '8px' }}>OPPORTUNITIES</div>
                    <ul style={{ paddingLeft: '16px', fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {swot.opportunities?.map((item, idx) => <li key={idx}>{item}</li>)}
                    </ul>
                  </div>

                  {/* Threats */}
                  <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b', marginBottom: '8px' }}>THREATS</div>
                    <ul style={{ paddingLeft: '16px', fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {swot.threats?.map((item, idx) => <li key={idx}>{item}</li>)}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Corporate Announcements & Filings */}
              {announcements.length > 0 && (
                <div className="glass-card" style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <ExternalLink size={18} style={{ color: 'var(--accent-blue)' }} /> Exchange Filings & Corporate Announcements
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {announcements.map((ann, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(15, 23, 42, 0.5)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{ann.title}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{ann.date}</span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{ann.summary}</p>
                        <span style={{ fontSize: '0.72rem', color: 'var(--accent-blue)' }}>Source: {ann.source}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Scenarios */}
              {scenarios.length > 0 && (
                <div className="glass-card" style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <TrendingUp size={18} style={{ color: 'var(--accent-blue)' }} /> Fundamental Scenarios & Valuation Targets
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                    {scenarios.map((sc, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '16px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(15, 23, 42, 0.7)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{sc.case}</span>
                            <span className="badge badge-outline" style={{ fontSize: '0.7rem' }}>{sc.probability_assessment}</span>
                          </div>
                          <div className="font-mono" style={{ fontSize: '1.15rem', fontWeight: 800, margin: '8px 0', color: 'var(--accent-blue)' }}>
                            {sc.target_range}
                          </div>
                          <ul style={{ paddingLeft: '16px', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {sc.catalysts?.map((c, cIdx) => <li key={cIdx}>{c}</li>)}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risks & Limitations */}
              {risks.length > 0 && (
                <div className="glass-card" style={{ padding: '16px 20px', borderLeft: '3px solid #f59e0b' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <AlertTriangle size={15} /> Business Risks & Model Disclosures
                  </div>
                  <ul style={{ paddingLeft: '18px', fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {risks.map((r, idx) => <li key={idx}>{r}</li>)}
                  </ul>
                </div>
              )}

              {/* Sources */}
              {sources.length > 0 && (
                <div className="glass-card" style={{ padding: '14px 20px', background: 'rgba(10, 14, 23, 0.6)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Audited Source Attribution
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {sources.map((src, idx) => (
                      <div
                        key={idx}
                        style={{
                          fontSize: '0.75rem',
                          background: 'rgba(255, 255, 255, 0.04)',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)'
                        }}
                      >
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{src.metric}: </span>
                        <span className="font-mono" style={{ color: 'var(--accent-blue)' }}>{String(src.value ?? '')}</span>
                        <span style={{ color: 'var(--text-muted)' }}> via {src.source}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>
                {researchData.disclaimer}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
