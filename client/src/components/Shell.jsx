import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { useState } from 'react';

export default function Shell({ children }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = user?.role === 'admin'
    ? [
        { to: '/admin', label: '📊 Dashboard', end: true },
        { to: '/admin/questions', label: '📝 Questions' },
        { to: '/admin/assessments', label: '📋 Assessments' }
      ]
    : [
        { to: '/student', label: '📊 Dashboard', end: true },
        { to: '/student/assessments', label: '📋 Assessments' }
      ];

  return (
    <div className="app-shell">
      <button
        className="mobile-menu-toggle ghost-button"
        type="button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        ☰ Menu
      </button>

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <Link
          to={user?.role === 'admin' ? '/admin' : '/student'}
          className="brand-mark"
          onClick={() => setSidebarOpen(false)}
        >
          <span className="brand-icon">⚡</span>
          CodeArena
        </Link>

        <nav className="nav-stack">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-avatar">{user?.fullName?.[0] || '?'}</span>
            <div>
              <strong className="user-name">{user?.fullName}</strong>
              <span className="user-role">{user?.role}</span>
            </div>
          </div>
          <ThemeToggle />
          <button className="secondary-button" onClick={logout} type="button">
            Sign out
          </button>
        </div>
      </aside>

      <main className="workspace-area">{children}</main>
    </div>
  );
}