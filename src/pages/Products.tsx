import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useToast } from '../components/ui/Toast';
import Modal from '../components/ui/Modal';
import { EmptyState, ConfirmDialog } from '../components/ui/Common';
import { Product } from '../types';
import { formatSum } from '../utils/format';

const UNITS = ['dona', 'kg', 'litr', 'metr', 'paket', 'quti'];

export default function Products() {
  const products = useAppStore((s) => s.products);
  const categories = useAppStore((s) => s.categories);
  const suppliers = useAppStore((s) => s.suppliers);
  const addProduct = useAppStore((s) => s.addProduct);
  const updateProduct = useAppStore((s) => s.updateProduct);
  const deleteProduct = useAppStore((s) => s.deleteProduct);
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const [form, setForm] = useState({
    name: '', barcode: '', categoryId: '', supplierId: '',
    purchasePrice: '', sellingPrice: '', discountPrice: '',
    quantity: '', minStock: '5', unit: 'dona',
  });

  const filtered = useMemo(() => {
    let list = products;
    if (categoryFilter !== 'all') list = list.filter((p) => p.categoryId === categoryFilter);
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(term) || p.barcode.includes(term));
    }
    return list;
  }, [products, categoryFilter, search]);

  const openAddModal = () => {
    setEditing(null);
    setForm({
      name: '', barcode: '', categoryId: categories[0]?.id || '', supplierId: suppliers[0]?.id || '',
      purchasePrice: '', sellingPrice: '', discountPrice: '', quantity: '', minStock: '5', unit: 'dona',
    });
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      barcode: product.barcode,
      categoryId: product.categoryId,
      supplierId: product.supplierId,
      purchasePrice: String(product.purchasePrice),
      sellingPrice: String(product.sellingPrice),
      discountPrice: product.discountPrice ? String(product.discountPrice) : '',
      quantity: String(product.quantity),
      minStock: String(product.minStock),
      unit: product.unit,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('Mahsulot nomini kiriting', 'error');
      return;
    }
    if (!form.sellingPrice || parseFloat(form.sellingPrice) <= 0) {
      showToast("Sotish narxini to'g'ri kiriting", 'error');
      return;
    }

    const data = {
      name: form.name.trim(),
      barcode: form.barcode.trim() || `AUTO${Date.now()}`,
      categoryId: form.categoryId,
      supplierId: form.supplierId,
      purchasePrice: parseFloat(form.purchasePrice) || 0,
      sellingPrice: parseFloat(form.sellingPrice) || 0,
      discountPrice: form.discountPrice ? parseFloat(form.discountPrice) : undefined,
      quantity: parseFloat(form.quantity) || 0,
      minStock: parseFloat(form.minStock) || 0,
      unit: form.unit,
    };

    if (editing) {
      updateProduct(editing.id, data);
      showToast('Mahsulot yangilandi', 'success');
    } else {
      addProduct(data);
      showToast("Mahsulot qo'shildi", 'success');
    }
    setShowModal(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteProduct(deleteTarget.id);
    showToast("Mahsulot o'chirildi", 'success');
    setDeleteTarget(null);
  };

  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name || '—';
  const getSupplierName = (id: string) => suppliers.find((s) => s.id === id)?.name || '—';

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Mahsulotlar</h1>
          <p>{products.length} ta mahsulot ro'yxatda</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>+ Mahsulot qo'shish</button>
      </div>

      <div className="filters-row">
        <input
          type="text"
          placeholder="Nomi yoki barcode bo'yicha qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="filter-search"
        />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="filter-select">
          <option value="all">Barcha kategoriyalar</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={'\u25A6'} title="Mahsulot topilmadi" description="Yangi mahsulot qo'shing yoki filtrlarni o'zgartiring" />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nomi</th>
                <th>Barcode</th>
                <th>Kategoriya</th>
                <th>Ta'minotchi</th>
                <th>Narxi</th>
                <th>Qoldiq</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const lowStock = product.quantity <= product.minStock;
                return (
                  <tr key={product.id}>
                    <td><strong>{product.name}</strong></td>
                    <td className="mono">{product.barcode}</td>
                    <td>{getCategoryName(product.categoryId)}</td>
                    <td>{getSupplierName(product.supplierId)}</td>
                    <td>
                      {product.discountPrice ? (
                        <>
                          <span className="price-old">{formatSum(product.sellingPrice)}</span>{' '}
                          <span className="price-new">{formatSum(product.discountPrice)}</span>
                        </>
                      ) : formatSum(product.sellingPrice)}
                    </td>
                    <td>
                      <span className={lowStock ? 'badge badge-warning' : ''}>
                        {product.quantity} {product.unit}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button className="icon-btn-sm" onClick={() => openEditModal(product)} title="Tahrirlash">{'\u270E'}</button>
                      <button className="icon-btn-sm icon-danger" onClick={() => setDeleteTarget(product)} title="O'chirish">{'\u2715'}</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal title={editing ? 'Mahsulotni tahrirlash' : "Yangi mahsulot qo'shish"} onClose={() => setShowModal(false)} width={560}>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group form-span-2">
              <label>Mahsulot nomi *</label>
              <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </div>

            <div className="form-group">
              <label>Barcode</label>
              <input type="text" value={form.barcode} onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))} placeholder="Avtomatik yaratiladi" />
            </div>

            <div className="form-group">
              <label>O'lchov birligi</label>
              <select value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Kategoriya</label>
              <select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Ta'minotchi</label>
              <select value={form.supplierId} onChange={(e) => setForm((f) => ({ ...f, supplierId: e.target.value }))}>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Kelish narxi (so'm)</label>
              <input type="number" value={form.purchasePrice} onChange={(e) => setForm((f) => ({ ...f, purchasePrice: e.target.value }))} min="0" />
            </div>

            <div className="form-group">
              <label>Sotish narxi (so'm) *</label>
              <input type="number" value={form.sellingPrice} onChange={(e) => setForm((f) => ({ ...f, sellingPrice: e.target.value }))} min="0" required />
            </div>

            <div className="form-group">
              <label>Aksiya narxi (ixtiyoriy)</label>
              <input type="number" value={form.discountPrice} onChange={(e) => setForm((f) => ({ ...f, discountPrice: e.target.value }))} min="0" />
            </div>

            <div className="form-group">
              <label>Mavjud miqdor</label>
              <input type="number" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} min="0" />
            </div>

            <div className="form-group">
              <label>Minimal qoldiq</label>
              <input type="number" value={form.minStock} onChange={(e) => setForm((f) => ({ ...f, minStock: e.target.value }))} min="0" />
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
          title="Mahsulotni o'chirish"
          message={`"${deleteTarget.name}" mahsulotini o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          danger
        />
      )}
    </div>
  );
}
