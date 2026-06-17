import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { ToastProvider } from './components/ui/Toast';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POSTerminal from './pages/POSTerminal';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Inventory from './pages/Inventory';
import SalesHistory from './pages/SalesHistory';
import Purchases from './pages/Purchases';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Employees from './pages/Employees';
import SettingsPage from './pages/Settings';
import Profile from './pages/Profile';
import { Role } from './types';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: Role[] }) {
  const currentUser = useAppStore((s) => s.currentUser);
  if (!currentUser) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(currentUser.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppContent() {
  const theme = useAppStore((s) => s.theme);
  const currentUser = useAppStore((s) => s.currentUser);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <Routes>
      <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <Login />} />

      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pos" element={<ProtectedRoute roles={['superadmin', 'admin', 'cashier']}><POSTerminal /></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute roles={['superadmin', 'admin', 'warehouse']}><Products /></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute roles={['superadmin', 'admin', 'warehouse']}><Categories /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute roles={['superadmin', 'admin', 'warehouse']}><Inventory /></ProtectedRoute>} />
        <Route path="/sales" element={<ProtectedRoute roles={['superadmin', 'admin', 'cashier', 'accountant']}><SalesHistory /></ProtectedRoute>} />
        <Route path="/purchases" element={<ProtectedRoute roles={['superadmin', 'admin', 'warehouse']}><Purchases /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute roles={['superadmin', 'admin', 'cashier', 'accountant']}><Customers /></ProtectedRoute>} />
        <Route path="/suppliers" element={<ProtectedRoute roles={['superadmin', 'admin', 'warehouse', 'accountant']}><Suppliers /></ProtectedRoute>} />
        <Route path="/employees" element={<ProtectedRoute roles={['superadmin', 'admin']}><Employees /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute roles={['superadmin', 'admin']}><SettingsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </ToastProvider>
  );
}
