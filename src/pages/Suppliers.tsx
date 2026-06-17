import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useToast } from '../components/ui/Toast';
import Modal from '../components/ui/Modal';
import { EmptyState, ConfirmDialog } from '../components/ui/Common';
import { Supplier } from '../types';
import { formatSum } from '../utils/format';

export default function Suppliers() {
  const suppliers = useAppStore((s) => s.suppliers);
  const products = useAppStore((s) => s.products);
  const addSupplier = useAppStore((s) => s.addSupplier);
  const updateSupplier = useAppStore((s) => s.updateSupplier);
  const deleteSupplier = useAppStore((s) => s.deleteSupplier);
  const { showToast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', address: '', debt: '0' });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', phone: '', address: '', debt: '0' });
    setShowModal(true);
  };

  const openEdit = (supplier: Supplier) => {
    setEditing(supplier);
    setForm({ name: supplier.name, phone: supplier.phone, address: supplier.address, debt: String(supplier.debt) });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('Ta\'minotchi nomini kiriting', 'error');
      return;
    }
    const data = { name: form.name.trim(), phone: form.phone.trim(), address: form.address.trim(), debt: parseFloat(form.debt) || 0 };
    if (editing) {
      updateSupplier(editing.id, data);
      showToast('Ta\'minotchi yangilandi', 'success');
    } else {
      addSupplier(data);
      showToast('Ta\'minotchi qo\'shildi', 'success');
    }
    setShowModal(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const usedBy = products.filter((p) => p.supplierId === deleteTarget.id).length;
    if (usedBy > 0) {
      showToast(`Bu ta'minotchidan ${usedBy} ta mahsulot bog'langan. Avval ularni o'zgartiring.`, 'error');
      setDeleteTarget(null);
      return;
    }
    deleteSupplier(deleteTarget.id);
    showToast('Ta\'minotchi o\'chirildi', 'success');
    setDeleteTarget(null);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Ta'minotchilar</h1>
          <p>{suppliers.length} ta ta'minotchi</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Ta'minotchi qo'shish</button>
      </div>

      {suppliers.length === 0 ? (
        <EmptyState icon={'\u2398'} title="Ta'minotchilar yo'q" />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nomi</th>
                <th>Telefon</th>
                <th>Manzil</th>
                <th>Mahsulotlar</th>
                <th>Qarz</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((supplier) => {
                const productCount = products.filter((p) => p.supplierId === supplier.id).length;
                return (
                  <tr key={supplier.id}>
                    <td><strong>{supplier.name}</strong></td>
                    <td className="mono">{supplier.phone}</td>
                    <td>{supplier.address || '—'}</td>
                    <td>{productCount} ta</td>
                    <td>
                      {supplier.debt > 0 ? (
                        <span className="badge badge-warning">{formatSum(supplier.debt)}</span>
                      ) : '—'}
                    </td>
                    <td className="actions-cell">
                      <button className="icon-btn-sm" onClick={() => openEdit(supplier)} title="Tahrirlash">{'\u270E'}</button>
                      <button className="icon-btn-sm icon-danger" onClick={() => setDeleteTarget(supplier)} title="O'chirish">{'\u2715'}</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal title={editing ? 'Ta\'minotchini tahrirlash' : "Yangi ta'minotchi qo'shish"} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group form-span-2">
              <label>Nomi *</label>
              <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>Telefon</label>
              <input type="text" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Qarz (so'm)</label>
              <input type="number" value={form.debt} onChange={(e) => setForm((f) => ({ ...f, debt: e.target.value }))} min="0" />
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

      {deleteTarget && (
        <ConfirmDialog
          title="Ta'minotchini o'chirish"
          message={`"${deleteTarget.name}" ta'minotchisini o'chirishni tasdiqlaysizmi?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          danger
        />
      )}
    </div>
  );
}
