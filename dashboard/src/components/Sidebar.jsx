import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  AlertTriangle,
  Package,
  Box,
  X,
} from 'lucide-react';
import { fetchEscalations } from '../api/admin';
import { useSidebar } from '../context/SidebarContext';

export default function Sidebar() {
  const [pendingCount, setPendingCount] = useState(0);
  const { isOpen, close } = useSidebar();
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    close();
  }, [location.pathname, close]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchEscalations('pending');
        setPendingCount(data.length);
      } catch { /* ignore */ }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/conversations', icon: MessageSquare, label: 'Conversations' },
    { to: '/escalations', icon: AlertTriangle, label: 'Escalations', badge: pendingCount },
    { to: '/products', icon: Package, label: 'Products' },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={close} />}

      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__brand">
          <div className="sidebar__logo">
            <Box />
          </div>
          <span className="sidebar__title">Varni Packaging</span>
          <button className="sidebar__close" onClick={close} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <div className="sidebar__section-label">Overview</div>

        <nav className="sidebar__nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
              }
            >
              <span className="sidebar__link-icon">
                <link.icon />
              </span>
              <span className="sidebar__link-label">{link.label}</span>
              {link.badge > 0 && (
                <span className="sidebar__badge">{link.badge}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          Varni Packaging &copy; {new Date().getFullYear()}
        </div>
      </aside>
    </>
  );
}
