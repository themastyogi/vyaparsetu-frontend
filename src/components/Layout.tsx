import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Package, FileText,
  ShoppingCart, BarChart3, Settings, LogOut,
  Bell, Search, ChevronDown, Building2,
  HelpCircle, Menu, X, BookOpen, Zap, CreditCard, Sun, Moon
} from 'lucide-react';
import './Layout.css';
import LanguageSwitcher from './LanguageSwitcher';
import { useAccounting } from '../hooks/useAccounting';

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
    label: 'SYSTEM',
    items: [
      { key: 'nav.settings', icon: <Settings size={18}/>, path: '/dashboard/settings', label: 'Settings' },
    ],
  },
];

export default function Layout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { companySettings } = useAccounting();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
          <Building2 size={14} className="company-icon"/>
          <span className="company-name">Sharma Traders Pvt Ltd</span>
          <ChevronDown size={13} className="company-chevron"/>
        </div>
      )}

      <nav className="sidebar-nav">
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            <div className="nav-group-label">{(!collapsed || mobile) && section.label}</div>
            {section.items.map(item => (
              <button
                key={item.path}
                id={`nav-${item.key.replace('nav.','')}`}
                className={`nav-item ${isActive(item.path) ? 'nav-item-active' : ''}`}
                onClick={() => { navigate(item.path); if (mobile) setMobileOpen(false); }}
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
        {(!collapsed || mobile) && (
          <div className="sidebar-help">
            <HelpCircle size={14}/>
            <span>Help &amp; Support</span>
          </div>
        )}
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

          <div className="topbar-right">
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, background: 'rgba(108,71,255,0.08)', border: '1px solid rgba(108,71,255,0.2)', color: 'var(--brand-primary)', fontWeight: 700, fontSize: 12 }}
            >
              <Building2 size={14}/> {companySettings.companyName || 'VyaparSetu Enterprises'}
            </div>
            <div className="gst-status">
              <span className="gst-dot"/>
              <span className="gst-label">{companySettings.companyGstin || '29AABCV1234F1Z5'}</span>
            </div>
            <LanguageSwitcher />
            <button
              onClick={toggleTheme}
              className="topbar-icon-btn"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '6px 10px', borderRadius: 8 }}
            >
              {theme === 'light' ? <Moon size={16} style={{ color: '#6C47FF' }}/> : <Sun size={16} style={{ color: '#FBBF24' }}/>}
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
                {theme === 'light' ? 'Dark' : 'Light'}
              </span>
            </button>
            <button id="notifications-btn" className="topbar-icon-btn" aria-label="Notifications">
              <Bell size={17}/>
              <span className="notif-dot"/>
            </button>
            <div className="topbar-avatar" title={companySettings.companyName}>
              {companySettings.companyName ? companySettings.companyName.substring(0, 2).toUpperCase() : 'VK'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="layout-content">
          <Outlet/>
        </main>
      </div>
    </div>
  );
}
