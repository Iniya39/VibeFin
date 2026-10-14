import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  Search,
  Wallet,
  RotateCcw,
  User,
  Sparkles,
  LayoutDashboard,
  Layers,
  Star,
  Briefcase,
  ClipboardList,
  History,
  Activity,
  BarChart3
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  virtualBalance = 1000000,
  onResetBalance,
  onSelectStock,
  allStocks = [],
  marketIndices = []
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);

  // Filter stocks for quick search
  const filteredStocks = searchTerm.trim()
    ? allStocks
        .filter(
          (s) =>
            s.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, 8)
    : [];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'markets', label: 'Markets', icon: Activity },
    { id: 'stocks', label: 'Stocks (100)', icon: BarChart3 },
    { id: 'sectors', label: 'Sectors (10)', icon: Layers },
    { id: 'watchlists', label: 'Watchlists', icon: Star },
    { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
    { id: 'orders', label: 'Orders', icon: ClipboardList },
    { id: 'transactions', label: 'Transactions', icon: History },
    { id: 'ai', label: 'AI Intelligence', icon: Sparkles, highlight: true },
  ];

  const nifty = marketIndices.find((i) => i.symbol === 'NIFTY50') || { price: 24850.2, change_pct: 0.42 };
  const sensex = marketIndices.find((i) => i.symbol === 'SENSEX') || { price: 81420.5, change_pct: 0.38 };

  return (
    <header style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)', position: 'sticky', top: 0, zIndex: 100 }}>
      {/* Top Banner Ticker Strip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(10, 13, 20, 0.7)', fontSize: '0.78rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>NIFTY 50</span>
            <span className="font-mono" style={{ fontWeight: 600 }}>₹{nifty.price?.toLocaleString()}</span>
            <span className={nifty.change_pct >= 0 ? 'text-gain' : 'text-loss'} style={{ fontWeight: 600 }}>
              {nifty.change_pct >= 0 ? '+' : ''}{nifty.change_pct}%
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>S&P BSE SENSEX</span>
            <span className="font-mono" style={{ fontWeight: 600 }}>₹{sensex.price?.toLocaleString()}</span>
            <span className={sensex.change_pct >= 0 ? 'text-gain' : 'text-loss'} style={{ fontWeight: 600 }}>
              {sensex.change_pct >= 0 ? '+' : ''}{sensex.change_pct}%
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="badge bg-gain" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
              ● NSE/BSE SIMULATION
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
              Yahoo Finance Adapter • 5-min refresh
            </span>
          </div>
        </div>

        {/* Virtual Cash Chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-card)', padding: '2px 10px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-focus)' }}>
            <Wallet size={13} style={{ color: 'var(--gain-color)' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Virtual Balance:</span>
            <span className="font-mono" style={{ color: 'var(--gain-color)', fontWeight: 700, fontSize: '0.8rem' }}>
              ₹{virtualBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {onResetBalance && (
              <button
                onClick={onResetBalance}
                title="Reset virtual balance to ₹10,00,000"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', marginLeft: '4px' }}
              >
                <RotateCcw size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', gap: '16px' }}>
        {/* Brand Logo */}
        <div
          onClick={() => setActiveTab('dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flexShrink: 0 }}
        >
          <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'linear-gradient(135deg, #3b82f6 0%, #00d09c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(0, 208, 156, 0.4)' }}>
            <TrendingUp size={20} color="#090d16" strokeWidth={2.5} />
          </div>
          <div>
            <span className="font-heading" style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #ffffff 40%, #00d09c 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              VibeFinance
            </span>
          </div>
        </div>

        {/* Search Bar with Instant Suggestions */}
        <div ref={searchRef} style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-full)', padding: '6px 14px' }}>
            <Search size={15} style={{ color: 'var(--text-muted)', marginRight: '8px' }} />
            <input
              type="text"
              placeholder="Search 100 stocks (e.g. TCS, Reliance)..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none', width: '100%' }}
            />
          </div>

          {/* Search Dropdown */}
          {showSearchResults && filteredStocks.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '6px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-focus)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 200,
                overflow: 'hidden'
              }}
            >
              {filteredStocks.map((s) => (
                <div
                  key={s.symbol}
                  onClick={() => {
                    onSelectStock(s.symbol);
                    setShowSearchResults(false);
                    setSearchTerm('');
                  }}
                  style={{
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'background var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{s.symbol}</span>
                      <span className="badge badge-outline" style={{ fontSize: '0.65rem' }}>{s.exchange}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.name}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="font-mono" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      ₹{s.price || '---'}
                    </div>
                    {s.change_pct !== null && (
                      <span className={s.change_pct >= 0 ? 'text-gain' : 'text-loss'} style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                        {s.change_pct >= 0 ? '+' : ''}{s.change_pct}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="badge badge-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}>
            <User size={14} style={{ color: 'var(--accent-blue)' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Demo Pro Trader</span>
          </div>
        </div>
      </div>

      {/* Nav Tab Bar */}
      <nav style={{ display: 'flex', gap: '4px', padding: '0 20px', overflowX: 'auto', borderTop: '1px solid var(--border-subtle)' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--gain-color)' : '2px solid transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all var(--transition-fast)'
              }}
            >
              <Icon size={15} style={{ color: item.highlight ? '#ec4899' : isActive ? 'var(--gain-color)' : 'var(--text-muted)' }} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
