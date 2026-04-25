import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Users, Package, FileText,
  ShoppingCart, BarChart3, Settings, LogOut,
  Bell, Search, ChevronDown, Building2,
  HelpCircle, Menu, X,
} from 'lucide-react';
import './Layout.css';
import LanguageSwitcher from './LanguageSwitcher';

const NAV_KEYS = [
  { key: 'nav.dashboard', icon: <LayoutDashboard size={18}/>, path: '/dashboard' },
  { key: 'nav.parties',   icon: <Users size={18}/>,           path: '/dashboard/parties' },
  { key: 'nav.items',     icon: <Package size={18}/>,         path: '/dashboard/items' },
  { key: 'nav.sales',     icon: <ShoppingCart size={18}/>,    path: '/dashboard/sales' },
  { key: 'nav.purchases', icon: <FileText size={18}/>,        path: '/dashboard/purchases' },
  { key: 'nav.reports',   icon: <BarChart3 size={18}/>,       path: '/dashboard/reports' },
  { key: 'nav.settings',  icon: <Settings size={18}/>,        path: '/dashboard/settings' },
];

export default function Layout() {
  const { t } = useTranslation();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
        <div className="nav-group-label">{(!collapsed || mobile) && t('nav.menu','MENU')}</div>
        {NAV_KEYS.map(item => (
          <button
            key={item.path}
            id={`nav-${item.key.replace('nav.','')}`}
            className={`nav-item ${isActive(item.path) ? 'nav-item-active' : ''}`}
            onClick={() => { navigate(item.path); if (mobile) setMobileOpen(false); }}
            title={collapsed && !mobile ? t(item.key) : undefined}
          >
            <span className="nav-icon">{item.icon}</span>
            {(!collapsed || mobile) && <span className="nav-label">{t(item.key)}</span>}
            {item.key === 'nav.reports' && (!collapsed || mobile) && (
              <span className="nav-badge">New</span>
            )}
          </button>
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
            <div className="gst-status">
              <span className="gst-dot"/>
              <span className="gst-label">{t('common.gst_active','GST Active')}</span>
            </div>
            <LanguageSwitcher />
            <button id="notifications-btn" className="topbar-icon-btn" aria-label="Notifications">
              <Bell size={17}/>
              <span className="notif-dot"/>
            </button>
            <div className="topbar-avatar">VK</div>
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
