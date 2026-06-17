import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useToast } from '../components/ui/Toast';
import Modal from '../components/ui/Modal';
import { EmptyState } from '../components/ui/Common';
import { formatSum, formatDate, startOfMonth } from '../utils/format';

const EXPENSE_CATEGORIES = ['Ijara', 'Kommunal', 'Internet', "Ish haqi", 'Transport', 'Reklama', 'Boshqa'];

export default function Finance() {
  const sales = useAppStore((s) => s.sales);
  const products = useAppStore((s) => s.products);
  const expenses = useAppStore((s) => s.expenses);
  const addExpense = useAppStore((s) => s.addExpense);
  const deleteExpense = useAppStore((s) => s.deleteExpense);
  const { showToast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ category: EXPENSE_CATEGORIES[0], description: '', amount: '' });

  const now = new Date();
  const monthStart = startOfMonth(now);

  const monthSales = sales.filter((s) => new Date(s.createdAt) >= monthStart);
  const monthExpenses = expenses.filter((e) => new Date(e.date) >= monthStart);

  const monthRevenue = monthSales.reduce((sum, s) => sum + s.total, 0);
  const monthCost = monthSales.reduce((sum, sale) => {
    return sum + sale.items.reduce((isum, item) => {
      const product = products.find((p) => p.id === item.productId);
      return isum + (product ? product.purchasePrice * item.quantity : 0);
    }, 0);
  }, 0);
  const monthExpenseTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const monthProfit = monthRevenue - monthCost - monthExpenseTotal;

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const totalCost = sales.reduce((sum, sale) => {
    return sum + sale.items.reduce((isum, item) => {
      const product = products.find((p) => p.id === item.productId);
      return isum + (product ? product.purchasePrice * item.quantity : 0);
    }, 0);
  }, 0);
  const totalExpenseAll = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalProfit = totalRevenue - totalCost - totalExpenseAll;

  const expenseByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    expenses.forEach((e) => {
      counts[e.category] = (counts[e.category] || 0) + e.amount;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) {
      showToast('Tavsifni kiriting', 'error');
      return;
    }
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      showToast("To'g'ri summa kiriting", 'error');
      return;
    }
    addExpense({ category: form.category, description: form.description.trim(), amount, date: new Date().toISOString() });
    showToast("Xarajat qo'shildi", 'success');
    setShowModal(false);
    setForm({ category: EXPENSE_CATEGORIES[0], description: '', amount: '' });
  };

  const handleDelete = (id: string) => {
    deleteExpense(id);
    showToast("Xarajat o'chirildi", 'success');
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Moliya</h1>
          <p>Daromad, xarajat va foyda tahlili</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Xarajat qo'shish</button>
      </div>

      <div className="stat-cards" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <span className="stat-label">Shu oy daromad</span>
          <span className="stat-value">{formatSum(monthRevenue)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Shu oy xarajatlar</span>
          <span className="stat-value">{formatSum(monthExpenseTotal)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Shu oy sof foyda</span>
          <span className={`stat-value ${monthProfit >= 0 ? 'stat-positive' : 'stat-negative'}`}>{formatSum(monthProfit)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Umumiy sof foyda</span>
          <span className={`stat-value ${totalProfit >= 0 ? 'stat-positive' : 'stat-negative'}`}>{formatSum(totalProfit)}</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3>Xarajatlar kategoriya bo'yicha</h3>
          {expenseByCategory.length === 0 ? (
            <EmptyState icon={'\u20AE'} title="Xarajatlar yo'q" />
          ) : (
            <table className="data-table">
              <thead><tr><th>Kategoriya</th><th>Summa</th></tr></thead>
              <tbody>
                {expenseByCategory.map(([cat, amount]) => (
                  <tr key={cat}><td>{cat}</td><td>{formatSum(amount)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h3>Umumiy hisob-kitob</h3>
          <table className="data-table">
            <tbody>
              <tr><td>Umumiy savdo (daromad)</td><td>{formatSum(totalRevenue)}</td></tr>
              <tr><td>Tannarx (sotilgan mahsulotlar)</td><td>{formatSum(totalCost)}</td></tr>
              <tr><td>Jami xarajatlar</td><td>{formatSum(totalExpenseAll)}</td></tr>
              <tr className="sale-detail-final"><td>Sof foyda</td><td>{formatSum(totalProfit)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Xarajatlar ro'yxati</h3>
        {expenses.length === 0 ? (
          <EmptyState icon={'\u20AE'} title="Xarajatlar yo'q" description="Yuqoridagi tugma orqali xarajat qo'shing" />
        ) : (
          <table className="data-table">
            <thead><tr><th>Sana</th><th>Kategoriya</th><th>Tavsif</th><th>Summa</th><th></th></tr></thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td>{formatDate(e.date)}</td>
                  <td>{e.category}</td>
                  <td>{e.description}</td>
                  <td>{formatSum(e.amount)}</td>
                  <td className="actions-cell">
                    <button className="icon-btn-sm icon-danger" onClick={() => handleDelete(e.id)} title="O'chirish">{'\u2715'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal title="Yangi xarajat" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group form-span-2">
              <label>Kategoriya *</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group form-span-2">
              <label>Tavsif *</label>
              <input type="text" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required />
            </div>
            <div className="form-group form-span-2">
              <label>Summa (so'm) *</label>
              <input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} min="0" required />
            </div>
            <div className="modal-actions form-span-2">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Bekor qilish</button>
              <button type="submit" className="btn btn-primary">Qo'shish</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
