import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';

interface TopbarProps {
  onToggleMobileMenu: () => void;
}

const roleLabels: Record<string, string> = {
  superadmin: 'Super Admin',
  admin: 'Administrator',
  cashier: 'Kassir',
  warehouse: 'Omborchi',
  accountant: 'Buxgalter',
};

function useIsMobile(breakpoint = 1024) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= breakpoint);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return isMobile;
}

export default function Topbar({ onToggleMobileMenu }: TopbarProps) {
  const currentUser = useAppStore((s) => s.currentUser);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const logout = useAppStore((s) => s.logout);
  const products = useAppStore((s) => s.products);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const lowStockProducts = products.filter((p) => p.quantity <= p.minStock);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        {isMobile && (
          <button className="icon-btn" onClick={onToggleMobileMenu} aria-label="Menyu">
            {'\u2630'}
          </button>
        )}
      </div>

      <div className="topbar-right">
        <div className="topbar-notif-wrap">
          <button className="icon-btn" onClick={() => setShowNotifications((v) => !v)} aria-label="Bildirishnomalar">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {lowStockProducts.length > 0 && <span className="notif-badge">{lowStockProducts.length}</span>}
          </button>
          {showNotifications && (
            <div className="topbar-dropdown notif-dropdown">
              <h4>Bildirishnomalar</h4>
              {lowStockProducts.length === 0 ? (
                <p className="notif-empty">Hozircha bildirishnoma yo'q</p>
              ) : (
                lowStockProducts.map((p) => (
                  <div key={p.id} className="notif-item">
                    <span className="notif-icon">{'\u26A0'}</span>
                    <div>
                      <strong>{p.name}</strong>
                      <span>Qoldiq: {p.quantity} {p.unit} (min: {p.minStock})</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <button className="icon-btn" onClick={toggleTheme} aria-label="Mavzu">
          {theme === 'light' ? (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
        </button>

        <div className="topbar-user-wrap">
          <button className="topbar-user" onClick={() => setShowMenu((v) => !v)}>
            <span className="topbar-avatar">{currentUser?.name.charAt(0)}</span>
            <span className="topbar-user-info">
              <strong>{currentUser?.name}</strong>
              <span>{currentUser ? roleLabels[currentUser.role] : ''}</span>
            </span>
          </button>
          {showMenu && (
            <div className="topbar-dropdown user-dropdown">
              <button onClick={() => { navigate('/profile'); setShowMenu(false); }}>Profil</button>
              <button onClick={() => { navigate('/settings'); setShowMenu(false); }}>Sozlamalar</button>
              <hr />
              <button onClick={handleLogout} className="logout-btn">Tizimdan chiqish</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
