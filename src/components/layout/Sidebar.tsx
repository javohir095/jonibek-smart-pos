import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { Role } from '../../types';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  roles?: Role[];
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: '\u2302' },
  { to: '/pos', label: 'Kassa (POS)', icon: '\u25A4', roles: ['superadmin', 'admin', 'cashier'] },
  { to: '/products', label: 'Mahsulotlar', icon: '\u25A6', roles: ['superadmin', 'admin', 'warehouse'] },
  { to: '/categories', label: 'Kategoriyalar', icon: '\u2630', roles: ['superadmin', 'admin', 'warehouse'] },
  { to: '/inventory', label: 'Ombor', icon: '\u25A3', roles: ['superadmin', 'admin', 'warehouse'] },
  { to: '/sales', label: 'Sotuvlar tarixi', icon: '\u29D6', roles: ['superadmin', 'admin', 'cashier', 'accountant'] },
  { to: '/purchases', label: 'Xaridlar', icon: '\u21BB', roles: ['superadmin', 'admin', 'warehouse'] },
  { to: '/customers', label: 'Mijozlar', icon: '\u263A', roles: ['superadmin', 'admin', 'cashier', 'accountant'] },
  { to: '/suppliers', label: 'Ta\'minotchilar', icon: '\u2398', roles: ['superadmin', 'admin', 'warehouse', 'accountant'] },
  { to: '/employees', label: 'Xodimlar', icon: '\u2693', roles: ['superadmin', 'admin'] },
  { to: '/settings', label: 'Sozlamalar', icon: '\u2699', roles: ['superadmin', 'admin'] },
];

interface SidebarProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const currentUser = useAppStore((s) => s.currentUser);
  const settings = useAppStore((s) => s.settings);

  const visibleItems = navItems.filter(
    (item) => !item.roles || (currentUser && item.roles.includes(currentUser.role))
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-mark">
          <i className="fas fa-cash-register"></i>
        </span>
        <span className="sidebar-logo-text">{settings.storeName}</span>
      </div>
      <nav className="sidebar-nav">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onNavigate}
            end={item.to === '/'}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
