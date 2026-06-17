import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useToast } from '../components/ui/Toast';
import Modal from '../components/ui/Modal';
import { EmptyState, ConfirmDialog } from '../components/ui/Common';
import { Customer } from '../types';
import { formatSum, formatDate } from '../utils/format';

export default function Customers() {
  const customers = useAppStore((s) => s.customers);
  const sales = useAppStore((s) => s.sales);
  const addCustomer = useAppStore((s) => s.addCustomer);
  const updateCustomer = useAppStore((s) => s.updateCustomer);
  const deleteCustomer = useAppStore((s) => s.deleteCustomer);
  const addDebtPayment = useAppStore((s) => s.addDebtPayment);
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Customer | null>(null);
  const [debtTarget, setDebtTarget] = useState<Customer | null>(null);
  const [debtAmount, setDebtAmount] = useState('');

  const [form, setForm] = useState({ fullName: '', phone: '', address: '' });

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const term = search.trim().toLowerCase();
    return customers.filter((c) => c.fullName.toLowerCase().includes(term) || c.phone.includes(term));
  }, [customers, search]);

  const openAdd = () => {
    setEditing(null);
    setForm({ fullName: '', phone: '', address: '' });
    setShowModal(true);
  };

  const openEdit = (customer: Customer) => {
    setEditing(customer);
    setForm({ fullName: customer.fullName, phone: customer.phone, address: customer.address });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim()) {
      showToast('Ism va telefon raqamini kiriting', 'error');
      return;
    }
    if (editing) {
      updateCustomer(editing.id, form);
      showToast('Mijoz ma\'lumotlari yangilandi', 'success');
    } else {
      addCustomer(form);
      showToast('Mijoz qo\'shildi', 'success');
    }
    setShowModal(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteCustomer(deleteTarget.id);
    showToast('Mijoz o\'chirildi', 'success');
    setDeleteTarget(null);
  };

  const handleDebtPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtTarget) return;
    const amount = parseFloat(debtAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast("To'g'ri summa kiriting", 'error');
      return;
    }
    if (amount > debtTarget.totalDebt) {
      showToast("To'lov summasi qarzdan ko'p bo'lishi mumkin emas", 'error');
      return;
    }
    addDebtPayment(debtTarget.id, amount);
    showToast('Qarz to\'lovi qabul qilindi', 'success');
    setDebtTarget(null);
    setDebtAmount('');
  };

  const customerSales = (customerId: string) => sales.filter((s) => s.customerId === customerId);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Mijozlar</h1>
          <p>{customers.length} ta mijoz ro'yxatda</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Mijoz qo'shish</button>
      </div>

      <div className="filters-row">
        <input type="text" placeholder="Ism yoki telefon bo'yicha qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} className="filter-search" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={'\u263A'} title="Mijozlar topilmadi" description="Yangi mijoz qo'shing yoki qidiruvni o'zgartiring" />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ism</th>
                <th>Telefon</th>
                <th>Manzil</th>
                <th>Jami xarid</th>
                <th>Qarz</th>
                <th>Ball</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => (
                <tr key={customer.id}>
                  <td><strong>{customer.fullName}</strong></td>
                  <td className="mono">{customer.phone}</td>
                  <td>{customer.address || '—'}</td>
                  <td>{formatSum(customer.totalSpent)}</td>
                  <td>
                    {customer.totalDebt > 0 ? (
                      <span className="badge badge-warning">{formatSum(customer.totalDebt)}</span>
                    ) : '—'}
                  </td>
                  <td>{customer.loyaltyPoints}</td>
                  <td className="actions-cell">
                    <button className="btn btn-sm btn-secondary" onClick={() => setHistoryTarget(customer)}>Tarix</button>
                    {customer.totalDebt > 0 && (
                      <button className="btn btn-sm btn-secondary" onClick={() => setDebtTarget(customer)}>Qarz to'lash</button>
                    )}
                    <button className="icon-btn-sm" onClick={() => openEdit(customer)} title="Tahrirlash">{'\u270E'}</button>
                    <button className="icon-btn-sm icon-danger" onClick={() => setDeleteTarget(customer)} title="O'chirish">{'\u2715'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal title={editing ? 'Mijozni tahrirlash' : "Yangi mijoz qo'shish"} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group form-span-2">
              <label>To'liq ism *</label>
              <input type="text" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} required />
            </div>
            <div className="form-group form-span-2">
              <label>Telefon raqami *</label>
              <input type="text" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+998901234567" required />
            </div>
            <div className="form-group form-span-2">
              <label>Manzil</label>
              <input type="text" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="modal-actions form-span-2">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Bekor qilish</button>
              <button type="submit" className="btn btn-primary">{editing ? 'Saqlash' : "Qo'shish"}</button>
            </div>
          </form>
        </Modal>
      )}

      {historyTarget && (
        <Modal title={`${historyTarget.fullName} - Xarid tarixi`} onClose={() => setHistoryTarget(null)} width={560}>
          {customerSales(historyTarget.id).length === 0 ? (
            <EmptyState icon={'\u29D6'} title="Xaridlar yo'q" />
          ) : (
            <table className="data-table">
              <thead><tr><th>Sana</th><th>Mahsulotlar</th><th>Summa</th></tr></thead>
              <tbody>
                {customerSales(historyTarget.id).map((sale) => (
                  <tr key={sale.id}>
                    <td>{formatDate(sale.createdAt)}</td>
                    <td>{sale.items.length} xil mahsulot</td>
                    <td>{formatSum(sale.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Modal>
      )}

      {debtTarget && (
        <Modal title={`${debtTarget.fullName} - Qarz to'lash`} onClose={() => setDebtTarget(null)}>
          <form onSubmit={handleDebtPayment} className="form-grid">
            <div className="form-group form-span-2">
              <label>Jami qarz</label>
              <input type="text" value={formatSum(debtTarget.totalDebt)} disabled />
            </div>
            <div className="form-group form-span-2">
              <label>To'lov summasi *</label>
              <input type="number" value={debtAmount} onChange={(e) => setDebtAmount(e.target.value)} min="0" max={debtTarget.totalDebt} required autoFocus />
            </div>
            <div className="modal-actions form-span-2">
              <button type="button" className="btn btn-secondary" onClick={() => setDebtTarget(null)}>Bekor qilish</button>
              <button type="submit" className="btn btn-primary">To'lovni qabul qilish</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Mijozni o'chirish"
          message={`"${deleteTarget.fullName}" mijozini o'chirishni tasdiqlaysizmi?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          danger
        />
      )}
    </div>
  );
}
