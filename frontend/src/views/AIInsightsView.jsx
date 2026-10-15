import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  Sparkles,
  Activity,
  Search,
  ShieldCheck,
  PieChart,
  Brain,
  AlertCircle,
  RotateCcw,
  Scale,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  MessageSquare
} from 'lucide-react';
import AISidePanel from '../components/AISidePanel';

export default function AIInsightsView({ allStocks = [], onSelectStock }) {
  const [subTab, setSubTab] = useState('orchestrator'); // 'orchestrator' | 'market' | 'stock' | 'portfolio' | 'behavior'
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  
  // Orchestrator state
  const [orchestratorStock, setOrchestratorStock] = useState('RELIANCE');
  const [orchestrationResult, setOrchestrationResult] = useState(null);
  const [orchestratorLoading, setOrchestratorLoading] = useState(false);

  // Individual Agent states
  const [marketAnalysis, setMarketAnalysis] = useState(null);
  const [selectedStockSymbol, setSelectedStockSymbol] = useState(allStocks[0]?.symbol || 'TCS');
  const [stockResearch, setStockResearch] = useState(null);
  const [portfolioAudit, setPortfolioAudit] = useState(null);
  const [behaviorAudit, setBehaviorAudit] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Run initial orchestration audit
    handleRunOrchestration();
  }, []);

  const handleRunOrchestration = async (sym = orchestratorStock) => {
    setOrchestratorLoading(true);
    try {
      const res = await api.ai.orchestrate('multi_factor_synthesis', sym);
      setOrchestrationResult(res);
    } catch (err) {
      console.error('Error running orchestration:', err);
    } finally {
      setOrchestratorLoading(false);
    }
  };

  const handleFetchMarketPulse = async () => {
    setLoading(true);
    try {
      const res = await api.ai.marketAgent();
      setMarketAnalysis(res);
    } catch (err) {
      console.error('Error fetching market analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchStockResearch = async (sym) => {
    setLoading(true);
    try {
      const res = await api.ai.financialAgent(sym || selectedStockSymbol);
      setStockResearch(res);
    } catch (err) {
      console.error('Error fetching stock research:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchPortfolioAudit = async () => {
    setLoading(true);
    try {
      const res = await api.ai.portfolioAgent();
      setPortfolioAudit(res);
    } catch (err) {
      console.error('Error fetching portfolio audit:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchBehaviorAudit = async () => {
    setLoading(true);
    try {
      const res = await api.ai.behaviorAgent();
      setBehaviorAudit(res);
    } catch (err) {
      console.error('Error fetching behavior audit:', err);
    } finally {
      setLoading(false);
    }
  };

  const agentResults = orchestrationResult?.agent_results || {};
  const conflicts = orchestrationResult?.cross_agent_conflicts || [];
  const keyRisks = orchestrationResult?.key_risks || [];

  return (
    <div className="section-layout-wrapper" style={{ paddingBottom: '40px' }}>
      {/* Left Column: Multi-Agent Analysis Content */}
      <div className="section-main-column">
        {/* Header Banner */}
        <div
          className="glass-card"
          style={{
            padding: '24px',
            background: 'linear-gradient(135deg, rgba(20, 28, 46, 0.95) 0%, rgba(31, 43, 69, 0.8) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.3)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Sparkles size={22} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>AI Intelligence & Multi-Agent Orchestration Hub</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Central orchestrator coordinating Market Analysis, Financial Research, Portfolio Risk, and Trading Behavior agents
              </p>
            </div>
          </div>

          {/* Sub-tab Navigation */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', marginTop: '14px' }}>
            <button
              onClick={() => { setSubTab('orchestrator'); if (!orchestrationResult) handleRunOrchestration(); }}
              className={`btn btn-secondary ${subTab === 'orchestrator' ? 'badge-fresh' : ''}`}
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            >
              <Sparkles size={14} /> Multi-Agent Orchestrator
            </button>
            <button
              onClick={() => { setSubTab('market'); if (!marketAnalysis) handleFetchMarketPulse(); }}
              className={`btn btn-secondary ${subTab === 'market' ? 'badge-fresh' : ''}`}
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            >
              <Activity size={14} /> Market Analysis Agent
            </button>
            <button
              onClick={() => { setSubTab('stock'); if (!stockResearch) handleFetchStockResearch(); }}
              className={`btn btn-secondary ${subTab === 'stock' ? 'badge-fresh' : ''}`}
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            >
              <Search size={14} /> Financial Research Agent
            </button>
            <button
              onClick={() => { setSubTab('portfolio'); if (!portfolioAudit) handleFetchPortfolioAudit(); }}
              className={`btn btn-secondary ${subTab === 'portfolio' ? 'badge-fresh' : ''}`}
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            >
              <PieChart size={14} /> Portfolio Analysis Agent
            </button>
            <button
              onClick={() => { setSubTab('behavior'); if (!behaviorAudit) handleFetchBehaviorAudit(); }}
              className={`btn btn-secondary ${subTab === 'behavior' ? 'badge-fresh' : ''}`}
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            >
              <Brain size={14} /> Trading Behavior Agent
            </button>
          </div>
        </div>

        {/* --- SUBTAB: CENTRAL MULTI-AGENT ORCHESTRATOR --- */}
      {subTab === 'orchestrator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Orchestrator Controls */}
          <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Target Symbol for Multi-Agent Synthesis:
              </span>
              <select
                value={orchestratorStock}
                onChange={(e) => {
                  setOrchestratorStock(e.target.value);
                  handleRunOrchestration(e.target.value);
                }}
                className="input-field"
                style={{ width: 'auto', minWidth: '220px', padding: '6px 12px', fontSize: '0.85rem' }}
              >
                {allStocks.map((s) => (
                  <option key={s.symbol} value={s.symbol}>
                    {s.symbol} — {s.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => handleRunOrchestration(orchestratorStock)}
              disabled={orchestratorLoading}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={14} className={orchestratorLoading ? 'animate-spin' : ''} />
              Re-Run Central Synthesis
            </button>
          </div>

          {/* Loading */}
          {orchestratorLoading && (
            <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Sparkles size={32} className="animate-spin" style={{ color: 'var(--accent-blue)', margin: '0 auto 12px' }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Dispatching to 4 Specialized AI Agents Concurrently...
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Executing Market, Financial, Portfolio, and Behavior checks in parallel...
              </p>
            </div>
          )}

          {/* Results */}
          {orchestrationResult && !orchestratorLoading && (
            <>
              {/* Executive Consensus Banner */}
              <div
                className="glass-card"
                style={{
                  padding: '20px',
                  borderLeft: `4px solid ${
                    orchestrationResult.overall_sentiment?.includes('Bullish') ? 'var(--gain-color)' :
                    orchestrationResult.overall_sentiment?.includes('Bearish') ? 'var(--loss-color)' :
                    'var(--accent-blue)'
                  }`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 700 }}>
                      CENTRAL ORCHESTRATOR SYNTHESIS · {orchestrationResult.target_symbol}
                    </span>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '2px', color: 'var(--text-primary)' }}>
                      {orchestrationResult.overall_sentiment}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    {orchestrationResult.agents_involved?.map((ag, idx) => (
                      <span key={idx} className="badge badge-outline" style={{ fontSize: '0.7rem' }}>
                        ✓ {ag}
                      </span>
                    ))}
                  </div>
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '12px', lineHeight: 1.6 }}>
                  {orchestrationResult.executive_summary}
                </p>
              </div>

              {/* Cross-Agent Conflict Preservation Card */}
              {conflicts.length > 0 && (
                <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <Scale size={18} /> Cross-Agent Disagreements & Divergent Signals Preserved
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    The central orchestrator does not silence or override contradictory findings. Disagreements between momentum and fundamentals are preserved for unbiased decision-making:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {conflicts.map((c, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(245, 158, 11, 0.08)',
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                          fontSize: '0.82rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.5
                        }}
                      >
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4 Agent Result Panels Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {/* Agent 1: Market Analysis */}
                {agentResults.market && (
                  <div className="glass-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase' }}>
                          Market Analysis Agent
                        </span>
                        <span className="badge badge-outline" style={{ fontSize: '0.65rem' }}>
                          {agentResults.market.signal}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                        {agentResults.market.summary}
                      </p>
                      <ul style={{ paddingLeft: '16px', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {agentResults.market.key_findings?.slice(0, 3).map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Agent 2: Financial Research */}
                {agentResults.financial && (
                  <div className="glass-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ec4899', textTransform: 'uppercase' }}>
                          Financial Research Agent
                        </span>
                        <span className="badge badge-outline" style={{ fontSize: '0.65rem' }}>
                          {agentResults.financial.signal}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                        {agentResults.financial.summary}
                      </p>
                      <ul style={{ paddingLeft: '16px', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {agentResults.financial.key_findings?.slice(0, 3).map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Agent 3: Portfolio Analysis */}
                {agentResults.portfolio && (
                  <div className="glass-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gain-color)', textTransform: 'uppercase' }}>
                          Portfolio Analysis Agent
                        </span>
                        <span className="badge badge-outline" style={{ fontSize: '0.65rem' }}>
                          {agentResults.portfolio.signal}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                        {agentResults.portfolio.summary}
                      </p>
                      <ul style={{ paddingLeft: '16px', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {agentResults.portfolio.key_findings?.slice(0, 3).map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Agent 4: Trading Behavior */}
                {agentResults.behavior && (
                  <div className="glass-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase' }}>
                          Trading Behavior Agent
                        </span>
                        <span className="badge badge-outline" style={{ fontSize: '0.65rem' }}>
                          {agentResults.behavior.signal}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                        {agentResults.behavior.summary}
                      </p>
                      <ul style={{ paddingLeft: '16px', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {agentResults.behavior.key_findings?.slice(0, 3).map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Key Aggregated Risks */}
              {keyRisks.length > 0 && (
                <div className="glass-card" style={{ padding: '18px 20px', borderLeft: '3px solid #f59e0b' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                    <ShieldAlert size={16} /> Key Multi-Factor Risks Isolated by Agents
                  </div>
                  <ul style={{ paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {keyRisks.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Disclaimer */}
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>
                {orchestrationResult.disclaimer}
              </div>
            </>
          )}
        </div>
      )}

      {/* --- SUBTAB: MARKET ANALYSIS AGENT --- */}
      {subTab === 'market' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Macro Market Pulse & Technical Stance</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Normalized technical indicators on benchmark indices</span>
              </div>
              <button onClick={handleFetchMarketPulse} className="btn btn-secondary" style={{ fontSize: '0.78rem' }}>
                <RotateCcw size={12} /> Refresh
              </button>
            </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Running quantitative market models...</div>
            ) : marketAnalysis ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{marketAnalysis.summary}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                  {marketAnalysis.key_findings?.map((f, i) => (
                    <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      • {f}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* --- SUBTAB: STOCK DEEP RESEARCH --- */}
      {subTab === 'stock' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Stock Deep Research Report</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Fundamental valuation and SWOT diagnostics</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={selectedStockSymbol}
                  onChange={(e) => {
                    setSelectedStockSymbol(e.target.value);
                    handleFetchStockResearch(e.target.value);
                  }}
                  className="input-field"
                  style={{ width: 'auto', padding: '4px 10px', fontSize: '0.8rem' }}
                >
                  {allStocks.map((s) => (
                    <option key={s.symbol} value={s.symbol}>{s.symbol} - {s.name}</option>
                  ))}
                </select>
                <button onClick={() => handleFetchStockResearch(selectedStockSymbol)} className="btn btn-secondary" style={{ fontSize: '0.78rem' }}>
                  <RotateCcw size={12} />
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Synthesizing balance sheet & earnings trends...</div>
            ) : stockResearch ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{stockResearch.summary}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                  {stockResearch.key_findings?.map((f, i) => (
                    <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      • {f}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* --- SUBTAB: PORTFOLIO RISK AUDIT --- */}
      {subTab === 'portfolio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Portfolio Risk Audit</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Concentration and sector risk breakdown</span>
              </div>
              <button onClick={handleFetchPortfolioAudit} className="btn btn-secondary" style={{ fontSize: '0.78rem' }}>
                <RotateCcw size={12} /> Refresh Audit
              </button>
            </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Auditing active portfolio positions...</div>
            ) : portfolioAudit ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{portfolioAudit.summary}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                  {portfolioAudit.key_findings?.map((f, i) => (
                    <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      • {f}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* --- SUBTAB: TRADING BEHAVIOR AGENT --- */}
      {subTab === 'behavior' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Trading Behavior & Execution Audit</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Observable transaction analytics and discipline metrics</span>
              </div>
              <button onClick={handleFetchBehaviorAudit} className="btn btn-secondary" style={{ fontSize: '0.78rem' }}>
                <RotateCcw size={12} /> Refresh Behavior
              </button>
            </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Auditing user trade fills...</div>
            ) : behaviorAudit ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{behaviorAudit.summary}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                  {behaviorAudit.key_findings?.map((f, i) => (
                    <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      • {f}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
      </div>

      {/* Right Column: AI Research Side Panel */}
      <div className="section-side-column">
        <AISidePanel
          section="ai"
          currentSymbol={orchestratorStock}
          allStocks={allStocks}
          onSelectStock={(sym) => {
            setOrchestratorStock(sym);
            setSelectedStockSymbol(sym);
            if (onSelectStock) onSelectStock(sym);
          }}
        />
      </div>

      {/* Mobile Floating Button */}
      <button
        onClick={() => setMobileDrawerOpen(true)}
        className="ai-mobile-floating-btn"
        title="Open AI Research Assistant"
      >
        <Sparkles size={16} /> AI Research Agent
      </button>

      {/* Mobile Drawer Overlay */}
      {mobileDrawerOpen && (
        <div className="ai-mobile-drawer-overlay" onClick={() => setMobileDrawerOpen(false)}>
          <div className="ai-mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
            <AISidePanel
              section="ai"
              currentSymbol={orchestratorStock}
              allStocks={allStocks}
              isMobile={true}
              onToggleOpen={() => setMobileDrawerOpen(false)}
              onSelectStock={(sym) => {
                setOrchestratorStock(sym);
                setSelectedStockSymbol(sym);
                if (onSelectStock) onSelectStock(sym);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
