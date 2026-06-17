import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useToast } from '../components/ui/Toast';
import { formatDate } from '../utils/format';

const roleLabels: Record<string, string> = {
  admin: 'Administrator',
  cashier: 'Kassir',
  warehouse: 'Omborchi',
  accountant: 'Buxgalter',
};

export default function Profile() {
  const currentUser = useAppStore((s) => s.currentUser);
  const updateUser = useAppStore((s) => s.updateUser);
  const sales = useAppStore((s) => s.sales);
  const { showToast } = useToast();

  const [name, setName] = useState(currentUser?.name || '');
  const [password, setPassword] = useState(currentUser?.password || '');

  if (!currentUser) return null;

  const mySales = sales.filter((s) => s.cashierId === currentUser.id);
  const myTotal = mySales.reduce((sum, s) => sum + s.total, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !password.trim()) {
      showToast("Ism va parolni to'ldiring", 'error');
      return;
    }
    updateUser(currentUser.id, { name: name.trim(), password });
    showToast('Profil yangilandi', 'success');
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Profil</h1>
          <p>Shaxsiy ma'lumotlar va statistika</p>
        </div>
      </div>

      <div className="stat-cards" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <span className="stat-label">Lavozim</span>
          <span className="stat-value">{roleLabels[currentUser.role]}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Ishga kirgan sana</span>
          <span className="stat-value">{formatDate(currentUser.createdAt)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Amalga oshirilgan sotuvlar</span>
          <span className="stat-value">{mySales.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Jami sotuv summasi</span>
          <span className="stat-value">{myTotal.toLocaleString('uz-UZ')} so'm</span>
        </div>
      </div>

      <div className="card">
        <h3>Profilni tahrirlash</h3>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label>To'liq ism</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Login</label>
            <input type="text" value={currentUser.username} disabled />
          </div>
          <div className="form-group form-span-2">
            <label>Parol</label>
            <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="modal-actions form-span-2">
            <button type="submit" className="btn btn-primary">Saqlash</button>
          </div>
        </form>
      </div>
    </div>
  );
}
