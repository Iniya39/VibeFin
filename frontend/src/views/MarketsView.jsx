import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Layers,
  Sparkles,
  BarChart2,
  ShieldAlert,
  Search,
  RotateCcw,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';

export default function MarketsView({ onSelectStock }) {
  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview' | 'agent'
  const [marketOverview, setMarketOverview] = useState(null);
  const [sectors, setSectors] = useState([]);
  const [stocksList, setStocksList] = useState([]);
  const [loadingOverview, setLoadingOverview] = useState(true);

  // Market Analysis Agent state
  const [selectedEntity, setSelectedEntity] = useState('MACRO'); // 'MACRO' or symbol e.g. 'RELIANCE'
  const [agentData, setAgentData] = useState(null);
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentError, setAgentError] = useState(null);
  const [chartPeriod, setChartPeriod] = useState('1y');

  useEffect(() => {
    Promise.all([
      api.market.overview(),
      api.stocks.sectors(),
      api.stocks.list()
    ])
      .then(([overview, secRes, stocksRes]) => {
        setMarketOverview(overview);
        setSectors(secRes.sectors || []);
        setStocksList(stocksRes.stocks || []);
        setLoadingOverview(false);
      })
      .catch((err) => {
        console.error('Error loading markets view:', err);
        setLoadingOverview(false);
      });
  }, []);

  const fetchAgentAnalysis = async (entity) => {
    setAgentLoading(true);
    setAgentError(null);
    try {
      const sym = entity === 'MACRO' ? null : entity;
      const res = await api.ai.marketAgent(sym);
      setAgentData(res);
    } catch (err) {
      console.error('Error fetching market agent analysis:', err);
      setAgentError(err.message || 'Failed to retrieve market intelligence.');
    } finally {
      setAgentLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'agent' && !agentData) {
      fetchAgentAnalysis(selectedEntity);
    }
  }, [activeSubTab]);

  const handleSelectEntity = (val) => {
    setSelectedEntity(val);
    fetchAgentAnalysis(val);
  };

  const indices = marketOverview?.indices || [];
  const sectorPerf = marketOverview?.sector_performance || {};
  const supporting = agentData?.supporting_data || {};
  const scenarios = agentData?.scenarios || [];
  const sources = agentData?.sources || [];
  const risks = agentData?.risks_and_limitations || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
      {/* Header and Sub-Tab Navigation */}
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
                <Activity size={22} style={{ color: 'var(--accent-blue)' }} /> Indian Markets & Technical Intelligence
              </h2>
              <span className="badge badge-outline" style={{ borderColor: 'rgba(59, 130, 246, 0.5)', color: 'var(--accent-blue)' }}>
                Markets Hub
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              NSE/BSE benchmark tracking, sector relative strength, and specialized Market Analysis Agent
            </p>
          </div>

          {/* Subtabs */}
          <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
            <button
              onClick={() => setActiveSubTab('overview')}
              className={`btn btn-secondary ${activeSubTab === 'overview' ? 'badge-fresh' : ''}`}
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            >
              <BarChart2 size={14} /> Market Overview & Matrix
            </button>
            <button
              onClick={() => {
                setActiveSubTab('agent');
                if (!agentData) fetchAgentAnalysis(selectedEntity);
              }}
              className={`btn btn-secondary ${activeSubTab === 'agent' ? 'badge-fresh' : ''}`}
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            >
              <Sparkles size={14} /> Market Analysis Agent
            </button>
          </div>
        </div>
      </div>

      {/* --- SUBTAB 1: OVERVIEW & HEATMAP --- */}
      {activeSubTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Index Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {indices.map((idx) => {
              const isUp = (idx.change_pct || 0) >= 0;
              return (
                <div
                  key={idx.symbol}
                  className="glass-card"
                  style={{
                    padding: '20px',
                    borderLeft: `4px solid ${isUp ? 'var(--gain-color)' : 'var(--loss-color)'}`,
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setActiveSubTab('agent');
                    handleSelectEntity('MACRO');
                  }}
                  title="Click to view full Market Analysis Agent pulse"
                >
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
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Provider: Yahoo Finance ({idx.provider_symbol})</span>
                    <span style={{ color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      Open Agent <ChevronRight size={12} />
                    </span>
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
      )}

      {/* --- SUBTAB 2: MARKET ANALYSIS AGENT --- */}
      {activeSubTab === 'agent' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Instrument Selector Toolbar */}
          <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Target Market / Stock:
              </span>

              <select
                value={selectedEntity}
                onChange={(e) => handleSelectEntity(e.target.value)}
                className="input-field"
                style={{ width: 'auto', minWidth: '240px', padding: '6px 12px', fontSize: '0.85rem' }}
              >
                <option value="MACRO">🌐 Macro Indian Market Pulse (NIFTY & SENSEX)</option>
                <optgroup label="Select from 100 Indian Stocks">
                  {stocksList.map((s) => (
                    <option key={s.symbol} value={s.symbol}>
                      {s.symbol} — {s.name} ({s.sector_name})
                    </option>
                  ))}
                </optgroup>
              </select>

              {selectedEntity !== 'MACRO' && (
                <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-secondary)', padding: '2px', borderRadius: 'var(--radius-sm)' }}>
                  {['1mo', '3mo', '1y'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setChartPeriod(p)}
                      className={`btn btn-secondary ${chartPeriod === p ? 'badge-fresh' : ''}`}
                      style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                    >
                      {p.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => fetchAgentAnalysis(selectedEntity)}
              disabled={agentLoading}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={14} className={agentLoading ? 'animate-spin' : ''} />
              Re-Analyze Technicals
            </button>
          </div>

          {/* Loading */}
          {agentLoading && (
            <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Activity size={32} className="animate-spin" style={{ color: 'var(--accent-blue)', margin: '0 auto 12px' }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Analyzing Market Technicals & Volume Dynamics...
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Computing RSI(14), moving averages, volume anomaly ratio, and support/resistance...
              </p>
            </div>
          )}

          {/* Error */}
          {agentError && !agentLoading && (
            <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid var(--loss-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--loss-color)', fontWeight: 700 }}>
                <ShieldAlert size={18} /> Market Analysis Limitation
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>{agentError}</p>
            </div>
          )}

          {/* Agent Results View */}
          {agentData && !agentLoading && (
            <>
              {/* Signal Header Card */}
              <div
                className="glass-card"
                style={{
                  padding: '20px',
                  borderLeft: `4px solid ${
                    (agentData.signal || '').includes('Bullish') ? 'var(--gain-color)' :
                    (agentData.signal || '').includes('Bearish') ? 'var(--loss-color)' :
                    'var(--accent-blue)'
                  }`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                        {supporting.name ? `${supporting.name} (${agentData.entity})` : 'Macro Indian Market Pulse'}
                      </span>
                      <span
                        className={`badge ${
                          (agentData.signal || '').includes('Bullish') ? 'bg-gain' :
                          (agentData.signal || '').includes('Bearish') ? 'bg-loss' :
                          'badge-outline'
                        }`}
                        style={{ fontSize: '0.85rem', fontWeight: 700 }}
                      >
                        {agentData.signal}
                      </span>
                    </div>

                    {supporting.current_price !== undefined && (
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '6px' }}>
                        <span className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800 }}>
                          ₹{supporting.current_price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        <span className={`badge ${(supporting.change_pct || 0) >= 0 ? 'bg-gain' : 'bg-loss'}`} style={{ fontSize: '0.85rem' }}>
                          {(supporting.change_pct || 0) >= 0 ? '+' : ''}{supporting.change_pct}%
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {supporting.sector} · {supporting.exchange}
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="badge badge-fresh">Freshness: {agentData.data_freshness}</span>
                    {agentData.confidence && (
                      <span className="badge badge-outline">
                        Confidence: {Math.round((agentData.confidence.score || 0) * 100)}%
                      </span>
                    )}
                  </div>
                </div>

                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '12px', lineHeight: 1.6 }}>
                  {agentData.summary}
                </p>
              </div>

              {/* Technical Indicator Metric Cards (when analyzing a stock) */}
              {selectedEntity !== 'MACRO' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                  {/* RSI */}
                  <div className="glass-card" style={{ padding: '16px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                      RSI (14-Day)
                    </span>
                    <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px', color: (supporting.rsi_14 || 50) >= 70 ? 'var(--loss-color)' : (supporting.rsi_14 || 50) <= 30 ? 'var(--gain-color)' : 'var(--text-primary)' }}>
                      {supporting.rsi_14 !== null ? supporting.rsi_14 : 'N/A'}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {(supporting.rsi_14 || 50) >= 70 ? 'Overbought (> 70)' : (supporting.rsi_14 || 50) <= 30 ? 'Oversold (< 30)' : 'Neutral Momentum'}
                    </span>
                  </div>

                  {/* Volume Anomaly */}
                  <div className="glass-card" style={{ padding: '16px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                      Volume Anomaly Ratio
                    </span>
                    <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px', color: (supporting.volume_anomaly_ratio || 1) >= 1.75 ? 'var(--accent-blue)' : 'var(--text-primary)' }}>
                      {supporting.volume_anomaly_ratio || 1.0}x
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {supporting.volume_status || 'Normal Trading Volume'}
                    </span>
                  </div>

                  {/* 30D Volatility */}
                  <div className="glass-card" style={{ padding: '16px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                      30D Annualized Volatility
                    </span>
                    <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px' }}>
                      {supporting.volatility_30d_pct !== null && supporting.volatility_30d_pct !== undefined ? `${supporting.volatility_30d_pct}%` : 'N/A'}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Standard log-return variance
                    </span>
                  </div>

                  {/* Support & Resistance */}
                  <div className="glass-card" style={{ padding: '16px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                      Support & Resistance
                    </span>
                    <div className="font-mono" style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: '6px' }}>
                      S: ₹{supporting.support_level || 'N/A'}
                    </div>
                    <div className="font-mono" style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent-blue)', marginTop: '2px' }}>
                      R: ₹{supporting.resistance_level || 'N/A'}
                    </div>
                  </div>

                  {/* Moving Averages */}
                  <div className="glass-card" style={{ padding: '16px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                      Moving Averages (SMA)
                    </span>
                    <div style={{ fontSize: '0.78rem', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <span className="font-mono">SMA 20: <strong>₹{supporting.sma_20 || 'N/A'}</strong></span>
                      <span className="font-mono">SMA 50: <strong>₹{supporting.sma_50 || 'N/A'}</strong></span>
                      <span className="font-mono">SMA 200: <strong>₹{supporting.sma_200 || 'N/A'}</strong></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Numerical Evidence & Key Findings */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <CheckCircle2 size={18} style={{ color: 'var(--accent-blue)' }} /> Quantitative Market Evidence
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                  {agentData.key_findings.map((f, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(15, 23, 42, 0.5)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.82rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5
                      }}
                    >
                      <span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>•</span> {f}
                    </div>
                  ))}
                </div>
              </div>

              {/* Scenarios (Bullish, Base, Bearish) */}
              {scenarios.length > 0 && (
                <div className="glass-card" style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <TrendingUp size={18} style={{ color: 'var(--accent-blue)' }} /> Technical Scenarios & Target Ranges
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                    {scenarios.map((sc, idx) => {
                      const isBull = sc.case.includes('Bullish');
                      const isBear = sc.case.includes('Bearish');
                      return (
                        <div
                          key={idx}
                          style={{
                            padding: '16px',
                            borderRadius: 'var(--radius-sm)',
                            background: isBull ? 'rgba(0, 208, 156, 0.05)' : isBear ? 'rgba(235, 91, 60, 0.05)' : 'rgba(15, 23, 42, 0.7)',
                            border: `1px solid ${isBull ? 'rgba(0, 208, 156, 0.25)' : isBear ? 'rgba(235, 91, 60, 0.25)' : 'var(--border-subtle)'}`,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: isBull ? 'var(--gain-color)' : isBear ? 'var(--loss-color)' : 'var(--text-primary)' }}>
                                {sc.case} Scenario
                              </span>
                              <span className="badge badge-outline" style={{ fontSize: '0.7rem' }}>
                                {sc.probability_assessment}
                              </span>
                            </div>
                            <div className="font-mono" style={{ fontSize: '1.15rem', fontWeight: 800, margin: '10px 0', color: 'var(--text-primary)' }}>
                              {sc.target_range}
                            </div>
                            <ul style={{ paddingLeft: '16px', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {sc.catalysts?.map((c, cIdx) => (
                                <li key={cIdx}>{c}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Risks & Limitations */}
              {risks.length > 0 && (
                <div className="glass-card" style={{ padding: '16px 20px', borderLeft: '3px solid #f59e0b' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <ShieldAlert size={15} /> Model Limitations & Volatility Risks
                  </div>
                  <ul style={{ paddingLeft: '18px', fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {risks.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sources */}
              {sources.length > 0 && (
                <div className="glass-card" style={{ padding: '14px 20px', background: 'rgba(10, 14, 23, 0.6)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Source Verification & Attribution
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
                {agentData.disclaimer}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
