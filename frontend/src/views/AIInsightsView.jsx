import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Sparkles, Activity, Search, ShieldCheck, PieChart, Brain, History, AlertCircle } from 'lucide-react';

export default function AIInsightsView({ allStocks = [], onSelectStock }) {
  const [subTab, setSubTab] = useState('market'); // 'market' | 'stock' | 'portfolio' | 'behavior' | 'history'
  const [marketAnalysis, setMarketAnalysis] = useState(null);
  const [selectedStockSymbol, setSelectedStockSymbol] = useState(allStocks[0]?.symbol || 'TCS');
  const [stockResearch, setStockResearch] = useState(null);
  const [portfolioAudit, setPortfolioAudit] = useState(null);
  const [behaviorAudit, setBehaviorAudit] = useState(null);
  const [historyRuns, setHistoryRuns] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Preload macro pulse
    handleFetchMarketPulse();
  }, []);

  const handleFetchMarketPulse = async () => {
    setLoading(true);
    try {
      const res = await api.ai.marketAnalysis();
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
      const res = await api.ai.companyResearch(sym || selectedStockSymbol);
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
      const res = await api.ai.portfolioAnalysis();
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
      const res = await api.ai.behaviorAnalysis();
      setBehaviorAudit(res);
    } catch (err) {
      console.error('Error fetching behavior audit:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.ai.history();
      setHistoryRuns(res.runs || []);
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(20, 28, 46, 0.95) 0%, rgba(31, 43, 69, 0.8) 100%)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={20} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>AI Investment Intelligence Center</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Quantitative intelligence models synthesizing normalized Indian stock data, valuation metrics, and behavioral records
            </p>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', marginTop: '12px' }}>
          <button
            onClick={() => { setSubTab('market'); if (!marketAnalysis) handleFetchMarketPulse(); }}
            className={`btn btn-secondary ${subTab === 'market' ? 'badge-fresh' : ''}`}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            <Activity size={14} /> Macro Market Pulse
          </button>
          <button
            onClick={() => { setSubTab('stock'); if (!stockResearch) handleFetchStockResearch(); }}
            className={`btn btn-secondary ${subTab === 'stock' ? 'badge-fresh' : ''}`}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            <Search size={14} /> Stock Deep Research
          </button>
          <button
            onClick={() => { setSubTab('portfolio'); if (!portfolioAudit) handleFetchPortfolioAudit(); }}
            className={`btn btn-secondary ${subTab === 'portfolio' ? 'badge-fresh' : ''}`}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            <PieChart size={14} /> Portfolio Risk Audit
          </button>
          <button
            onClick={() => { setSubTab('behavior'); if (!behaviorAudit) handleFetchBehaviorAudit(); }}
            className={`btn btn-secondary ${subTab === 'behavior' ? 'badge-fresh' : ''}`}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            <Brain size={14} /> Trading Psychology
          </button>
          <button
            onClick={() => { setSubTab('history'); handleFetchHistory(); }}
            className={`btn btn-secondary ${subTab === 'history' ? 'badge-fresh' : ''}`}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            <History size={14} /> Analysis Runs History
          </button>
        </div>
      </div>

      {/* Subtab Content */}
      {subTab === 'market' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Macro Indian Market Pulse & Sector Leadership</h3>
              <button onClick={handleFetchMarketPulse} disabled={loading} className="btn btn-secondary" style={{ fontSize: '0.78rem' }}>
                <Sparkles size={13} /> {loading ? 'Analyzing...' : 'Refresh Market Pulse'}
              </button>
            </div>

            {marketAnalysis && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--accent-blue)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span className="badge badge-fresh">Market Regime: {marketAnalysis.sentiment}</span>
                  </div>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                    {marketAnalysis.summary}
                  </p>
                </div>

                {/* Macro commentary list */}
                {marketAnalysis.details?.macro_commentary && (
                  <div>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>STRATEGIC COMMENTARY</h4>
                    <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {marketAnalysis.details.macro_commentary.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Source evidence */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Citations:</span>
                  {marketAnalysis.evidence_citations?.map((c, i) => (
                    <span key={i} className="badge badge-outline" style={{ fontSize: '0.7rem' }}>
                      <ShieldCheck size={12} style={{ color: 'var(--gain-color)' }} /> {c.source} ({c.metric})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === 'stock' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Select Stock for Deep AI Intelligence Report</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={selectedStockSymbol}
                  onChange={(e) => {
                    setSelectedStockSymbol(e.target.value);
                    handleFetchStockResearch(e.target.value);
                  }}
                  className="input-field"
                  style={{ width: '260px', fontSize: '0.85rem' }}
                >
                  {allStocks.map((s) => (
                    <option key={s.symbol} value={s.symbol}>
                      {s.symbol} — {s.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleFetchStockResearch(selectedStockSymbol)}
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ fontSize: '0.8rem' }}
                >
                  <Sparkles size={14} /> Analyze
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                Synthesizing multi-factor AI research for {selectedStockSymbol}...
              </div>
            ) : stockResearch ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>{stockResearch.title}</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{stockResearch.summary}</p>
                </div>

                {/* SWOT Grid */}
                {stockResearch.details?.swot_analysis && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                    <div className="glass-card" style={{ padding: '14px', borderLeft: '4px solid var(--gain-color)' }}>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--gain-color)', display: 'block', marginBottom: '6px' }}>STRENGTHS</strong>
                      <ul style={{ paddingLeft: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {stockResearch.details.swot_analysis.strengths.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="glass-card" style={{ padding: '14px', borderLeft: '4px solid var(--loss-color)' }}>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--loss-color)', display: 'block', marginBottom: '6px' }}>WEAKNESSES</strong>
                      <ul style={{ paddingLeft: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {stockResearch.details.swot_analysis.weaknesses.map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {subTab === 'portfolio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Portfolio Risk, Concentration & Diversification Audit</h3>
              <button onClick={handleFetchPortfolioAudit} disabled={loading} className="btn btn-secondary" style={{ fontSize: '0.78rem' }}>
                <Sparkles size={13} /> Run Audit
              </button>
            </div>

            {loading ? (
              <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                Analyzing position sizing, correlations, and sector weights...
              </div>
            ) : portfolioAudit ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{portfolioAudit.summary}</p>
                </div>

                {portfolioAudit.details?.diversification_score && (
                  <div className="glass-card" style={{ padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Portfolio Diversification Score</span>
                      <div className="font-mono text-gain" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                        {portfolioAudit.details.diversification_score}/100
                      </div>
                    </div>
                  </div>
                )}

                {portfolioAudit.details?.concentration_warnings?.length > 0 && (
                  <div style={{ background: 'var(--loss-bg)', border: '1px solid var(--loss-border)', padding: '12px 16px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--loss-color)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px' }}>
                      <AlertCircle size={15} /> Concentration Warnings Detected
                    </div>
                    <ul style={{ paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {portfolioAudit.details.concentration_warnings.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {subTab === 'behavior' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Trading Psychology & Execution Discipline</h3>
              <button onClick={handleFetchBehaviorAudit} disabled={loading} className="btn btn-secondary" style={{ fontSize: '0.78rem' }}>
                <Sparkles size={13} /> Analyze Behavior
              </button>
            </div>

            {loading ? (
              <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                Auditing execution habits and trade sizing...
              </div>
            ) : behaviorAudit ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{behaviorAudit.summary}</p>
                </div>

                {behaviorAudit.details?.recommendations && (
                  <div className="glass-card" style={{ padding: '14px' }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--accent-blue)', display: 'block', marginBottom: '6px' }}>
                      AI PSYCHOLOGY COACHING RECOMMENDATIONS
                    </strong>
                    <ul style={{ paddingLeft: '18px', fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {behaviorAudit.details.recommendations.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {subTab === 'history' && (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Saved AI Analysis Runs & Audit History</h3>
          </div>
          {historyRuns.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No persistent analysis runs saved yet. Generate an analysis report above to populate audit logs.
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Report Title</th>
                    <th>Executive Summary</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRuns.map((run) => (
                    <tr key={run.id}>
                      <td>
                        <span className="badge badge-outline">{run.analysis_type}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{run.title}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {run.summary}
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {run.created_at ? new Date(run.created_at).toLocaleString() : '---'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
