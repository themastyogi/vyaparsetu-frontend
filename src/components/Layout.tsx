import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Package, FileText,
  ShoppingCart, BarChart3, Settings, LogOut,
  Bell, Search, Building2, ShieldCheck,
  HelpCircle, Menu, X, BookOpen, Zap, CreditCard, Sun, Moon, Bot, Sparkles
} from 'lucide-react';
import './Layout.css';
import LanguageSwitcher from './LanguageSwitcher';
import { useAccounting } from '../hooks/useAccounting';
import { APP_VERSION, LAST_DEPLOY_TIMESTAMP } from '../config/version';
import SmartAiAccountantModal from './SmartAiAccountantModal';
import HelpSupportModal from './HelpSupportModal';
import FloatingAiChatWidget from './FloatingAiChatWidget';

const NAV_SECTIONS = [
  {
    label: 'MAIN',
    items: [
      { key: 'nav.dashboard', icon: <LayoutDashboard size={18}/>, path: '/dashboard', label: 'Dashboard' },
      { key: 'nav.parties',   icon: <Users size={18}/>,           path: '/dashboard/parties', label: 'Parties' },
      { key: 'nav.items',     icon: <Package size={18}/>,         path: '/dashboard/items',   label: 'Items' },
    ],
  },
  {
    label: 'TRANSACTIONS',
    items: [
      { key: 'nav.procurement', icon: <Building2 size={18}/>, path: '/dashboard/procurement', label: 'Procurement & L1 Hub' },
      { key: 'nav.sales',       icon: <ShoppingCart size={18}/>, path: '/dashboard/sales',       label: 'Sales Invoices' },
      { key: 'nav.purchases',   icon: <FileText size={18}/>,     path: '/dashboard/purchases',   label: 'Purchase Bills' },
      { key: 'nav.debit-notes', icon: <Zap size={18}/>,         path: '/dashboard/debit-notes', label: 'Debit Notes' },
      { key: 'nav.payments',    icon: <CreditCard size={18}/>,  path: '/dashboard/payments',    label: 'Payments & Advisor' },
    ],
  },
  {
    label: 'FINANCE',
    items: [
      { key: 'nav.coa',     icon: <BookOpen size={18}/>,  path: '/dashboard/chart-of-accounts', label: 'Chart of Accounts' },
      { key: 'nav.reports', icon: <BarChart3 size={18}/>, path: '/dashboard/reports',           label: 'Reports & Ledger' },
    ],
  },
  {
    label: 'ADMIN & SAAS',
    items: [
      { key: 'nav.settings', icon: <Settings size={18}/>, path: '/dashboard/settings', label: 'Company Settings' },
      { key: 'nav.saas_admin', icon: <ShieldCheck size={18}/>, path: '/dashboard/saas-admin', label: 'VyaparSetu Admin Portal' },
    ],
  },
];

export default function Layout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { companySettings } = useAccounting();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isPoppedOutAi, setIsPoppedOutAi] = useState(false);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('vs_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vs_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const logout = () => navigate('/');

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside className={`sidebar ${collapsed && !mobile ? 'sidebar-collapsed' : ''} ${mobile ? 'sidebar-mobile' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">VS</div>
        {(!collapsed || mobile) && (
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-name">VyaparSetu</span>
            <span className="sidebar-logo-env">Production</span>
          </div>
        )}
        {!mobile && (
          <button
            className="sidebar-collapse-btn"
            onClick={() => setCollapsed(v => !v)}
            aria-label="Toggle sidebar"
          >
            <Menu size={16}/>
          </button>
        )}
      </div>

      {/* Company switcher */}
      {(!collapsed || mobile) && (
        <div className="sidebar-company">
          <Building2 size={16} className="comp-ico"/>
          <span className="comp-name">{companySettings.companyName || 'VyaparSetu Enterprises'}</span>
        </div>
      )}

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV_SECTIONS.map(sec => (
          <div key={sec.label} className="nav-section">
            {(!collapsed || mobile) && (
              <div className="nav-section-label">{sec.label}</div>
            )}
            {sec.items.map(item => (
              <button
                key={item.path}
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => {
                  navigate(item.path);
                  if (mobile) setMobileOpen(false);
                }}
                title={collapsed && !mobile ? item.label : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                {(!collapsed || mobile) && <span className="nav-label">{item.label}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="sidebar-bottom">
        <div
          className="sidebar-help"
          onClick={() => setShowHelpModal(true)}
          style={{ cursor: 'pointer', background: 'rgba(16,185,129,0.1)', border: '1.5px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '8px 12px', color: '#10B981', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, transition: 'all 0.15s' }}
          title="Open Screen-Specific Layman Help & Technical Knowledge Base"
        >
          <HelpCircle size={16}/>
          {(!collapsed || mobile) && <span>Help &amp; Support</span>}
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">VK</div>
          {(!collapsed || mobile) && (
            <div className="user-info">
              <span className="user-name">Vikas Kumar</span>
              <span className="user-role">Owner</span>
            </div>
          )}
          <button
            id="logout-btn"
            className="logout-btn"
            onClick={logout}
            title="Logout"
          >
            <LogOut size={15}/>
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="layout-root">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="mobile-overlay" onClick={() => setMobileOpen(false)}>
          <div className="mobile-sidebar-wrap" onClick={e => e.stopPropagation()}>
            <button className="mobile-close" onClick={() => setMobileOpen(false)}>
              <X size={18}/>
            </button>
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="layout-main">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={18}/>
            </button>
            <div className="topbar-search">
              <Search size={15} className="search-icon"/>
              <input
                id="global-search"
                type="text"
                placeholder="Search parties, items, invoices…"
                className="search-input"
              />
              <span className="search-kbd">⌘K</span>
            </div>
          </div>

          <div className="topbar-right" style={{ position: 'relative' }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, background: 'rgba(108,71,255,0.08)', border: '1px solid rgba(108,71,255,0.2)', color: 'var(--brand-primary)', fontWeight: 700, fontSize: 12 }}
            >
              <Building2 size={14}/> {companySettings.companyName || 'VyaparSetu Enterprises'}
            </div>
            <div className="gst-status">
              <span className="gst-dot"/>
              <span className="gst-label">{companySettings.companyGstin || '29AABCV1234F1Z5'}</span>
            </div>

            {/* Smart AI Accountant Bot Button */}
            <button
              type="button"
              onClick={() => setShowAiModal(true)}
              style={{ padding: '6px 12px', borderRadius: 8, background: 'linear-gradient(135deg, #6C47FF 0%, #3B82F6 100%)', color: '#fff', border: 'none', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', boxShadow: '0 4px 12px rgba(108,71,255,0.3)' }}
              title="Open Smart AI Accountant Bot for Natural Language Journal & Voucher Posting"
            >
              <Bot size={15}/> Smart AI Accountant <Sparkles size={13} style={{ color: '#FBBF24' }}/>
            </button>

            <button id="notifications-btn" className="topbar-icon-btn" aria-label="Notifications">
              <Bell size={17}/>
              <span className="notif-dot"/>
            </button>

            {/* User Avatar Button & Dropdown Menu */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(prev => !prev)}
                className="topbar-avatar"
                style={{ border: '2px solid var(--brand-primary)', cursor: 'pointer', background: 'var(--brand-primary)', color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="User Profile & Quick Settings Menu"
              >
                {companySettings.companyName ? companySettings.companyName.substring(0, 2).toUpperCase() : 'VK'}
              </button>

              {userMenuOpen && (
                <div
                  onClick={e => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: 240,
                    background: 'var(--bg-card)',
                    borderRadius: 12,
                    boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
                    border: '1px solid var(--border-default)',
                    padding: 12,
                    zIndex: 1200,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    animation: 'fade-in 0.15s'
                  }}
                >
                  {/* User Profile Header */}
                  <div style={{ paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--brand-primary)', color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                      VK
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>Vikas Kumar</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Business Owner · Admin</div>
                    </div>
                  </div>

                  {/* Help & Support Button */}
                  <button
                    type="button"
                    onClick={() => { setShowHelpModal(true); setUserMenuOpen(false); }}
                    style={{ padding: '8px 10px', borderRadius: 8, border: 'none', background: 'rgba(16,185,129,0.08)', color: '#10B981', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'left' }}
                  >
                    <HelpCircle size={16}/> Help &amp; Support
                  </button>

                  {/* Theme Switcher Toggle */}
                  <button
                    type="button"
                    onClick={toggleTheme}
                    style={{ padding: '8px 10px', borderRadius: 8, border: 'none', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {theme === 'light' ? <Moon size={16} style={{ color: '#6C47FF' }}/> : <Sun size={16} style={{ color: '#FBBF24' }}/>}
                      <span>Theme ({theme === 'light' ? 'Dark' : 'Light'})</span>
                    </div>
                  </button>

                  {/* Language Switcher */}
                  <div style={{ padding: '4px 6px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>Language Preference</div>
                    <LanguageSwitcher />
                  </div>

                  {/* Company Settings */}
                  <button
                    type="button"
                    onClick={() => { navigate('/dashboard/settings'); setUserMenuOpen(false); }}
                    style={{ padding: '8px 10px', borderRadius: 8, border: 'none', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'left' }}
                  >
                    <Settings size={16}/> Company Settings
                  </button>

                  {/* Logout */}
                  <button
                    type="button"
                    onClick={() => { logout(); setUserMenuOpen(false); }}
                    style={{ padding: '8px 10px', borderRadius: 8, border: 'none', background: 'rgba(239,68,68,0.08)', color: '#F87171', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'left' }}
                  >
                    <LogOut size={16}/> Logout
                  </button>

                  {/* App Version Footer */}
                  <div title={`Last Deployed: ${LAST_DEPLOY_TIMESTAMP}`} style={{ paddingTop: 6, borderTop: '1px solid var(--border-subtle)', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center', fontFamily: 'monospace' }}>
                    VyaparSetu {APP_VERSION}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="layout-content">
          <Outlet/>
        </main>
      </div>

      {showAiModal && <SmartAiAccountantModal onClose={() => setShowAiModal(false)} />}
      {showHelpModal && (
        <HelpSupportModal
          onClose={() => setShowHelpModal(false)}
          onPopout={() => {
            setShowHelpModal(false);
            setIsPoppedOutAi(true);
          }}
        />
      )}

      {/* Global Floating AI Support Assistant Component (Standalone Popout Chat) */}
      {isPoppedOutAi && (
        <FloatingAiChatWidget
          onClose={() => setIsPoppedOutAi(false)}
          onDock={() => {
            setIsPoppedOutAi(false);
            setShowHelpModal(true);
          }}
        />
      )}
    </div>
  );
}
