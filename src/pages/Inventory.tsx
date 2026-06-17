import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useToast } from '../components/ui/Toast';
import Modal from '../components/ui/Modal';
import { EmptyState } from '../components/ui/Common';
import { Product } from '../types';

type StockTab = 'all' | 'low' | 'in' | 'out';

export default function Inventory() {
  const products = useAppStore((s) => s.products);
  const updateProduct = useAppStore((s) => s.updateProduct);
  const { showToast } = useToast();

  const [tab, setTab] = useState<StockTab>('all');
  const [search, setSearch] = useState('');
  const [adjustTarget, setAdjustTarget] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<'in' | 'out' | 'adjust'>('in');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const lowStock = products.filter((p) => p.quantity <= p.minStock && p.quantity > 0);
  const outOfStock = products.filter((p) => p.quantity === 0);

  const filtered = useMemo(() => {
    let list = products;
    if (tab === 'low') list = lowStock;
    if (tab === 'out') list = outOfStock;
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(term) || p.barcode.includes(term));
    }
    return list;
  }, [products, tab, search, lowStock, outOfStock]);

  const openAdjust = (product: Product, type: 'in' | 'out' | 'adjust') => {
    setAdjustTarget(product);
    setAdjustType(type);
    setAdjustAmount('');
    setAdjustReason('');
  };

  const handleAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;
    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount < 0) {
      showToast("To'g'ri qiymat kiriting", 'error');
      return;
    }

    let newQty = adjustTarget.quantity;
    if (adjustType === 'in') newQty += amount;
    if (adjustType === 'out') {
      if (amount > adjustTarget.quantity) {
        showToast("Chiqim miqdori qoldiqdan ko'p bo'lishi mumkin emas", 'error');
        return;
      }
      newQty -= amount;
    }
    if (adjustType === 'adjust') newQty = amount;

    updateProduct(adjustTarget.id, { quantity: newQty });
    showToast('Ombor yangilandi', 'success');
    setAdjustTarget(null);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Ombor</h1>
          <p>Mahsulot qoldiqlarini boshqarish</p>
        </div>
      </div>

      <div className="stat-cards" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <span className="stat-label">Jami mahsulotlar</span>
          <span className="stat-value">{products.length}</span>
        </div>
        <div className="stat-card stat-card-warning">
          <span className="stat-label">Kam qolgan</span>
          <span className="stat-value">{lowStock.length}</span>
        </div>
        <div className="stat-card stat-card-danger">
          <span className="stat-label">Tugagan</span>
          <span className="stat-value">{outOfStock.length}</span>
        </div>
      </div>

      <div className="tabs-row">
        <button className={`tab-btn ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>Barchasi</button>
        <button className={`tab-btn ${tab === 'low' ? 'active' : ''}`} onClick={() => setTab('low')}>Kam qolgan ({lowStock.length})</button>
        <button className={`tab-btn ${tab === 'out' ? 'active' : ''}`} onClick={() => setTab('out')}>Tugagan ({outOfStock.length})</button>
      </div>

      <div className="filters-row">
        <input type="text" placeholder="Mahsulot qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} className="filter-search" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={'\u25A3'} title="Mahsulot topilmadi" />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mahsulot</th>
                <th>Qoldiq</th>
                <th>Minimal</th>
                <th>Holat</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const status = product.quantity === 0 ? 'out' : product.quantity <= product.minStock ? 'low' : 'ok';
                return (
                  <tr key={product.id}>
                    <td><strong>{product.name}</strong></td>
                    <td>{product.quantity} {product.unit}</td>
                    <td>{product.minStock} {product.unit}</td>
                    <td>
                      {status === 'out' && <span className="badge badge-danger">Tugagan</span>}
                      {status === 'low' && <span className="badge badge-warning">Kam qolgan</span>}
                      {status === 'ok' && <span className="badge badge-success">Yetarli</span>}
                    </td>
                    <td className="actions-cell">
                      <button className="btn btn-sm btn-secondary" onClick={() => openAdjust(product, 'in')}>Kirim</button>
                      <button className="btn btn-sm btn-secondary" onClick={() => openAdjust(product, 'out')}>Chiqim</button>
                      <button className="btn btn-sm btn-secondary" onClick={() => openAdjust(product, 'adjust')}>Tuzatish</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {adjustTarget && (
        <Modal
          title={
            adjustType === 'in' ? 'Ombor kirimi' :
            adjustType === 'out' ? 'Ombor chiqimi' : 'Qoldiqni tuzatish'
          }
          onClose={() => setAdjustTarget(null)}
        >
          <form onSubmit={handleAdjust} className="form-grid">
            <div className="form-group form-span-2">
              <label>Mahsulot</label>
              <input type="text" value={adjustTarget.name} disabled />
            </div>
            <div className="form-group form-span-2">
              <label>Hozirgi qoldiq</label>
              <input type="text" value={`${adjustTarget.quantity} ${adjustTarget.unit}`} disabled />
            </div>
            <div className="form-group form-span-2">
              <label>
                {adjustType === 'in' && 'Kirim miqdori'}
                {adjustType === 'out' && 'Chiqim miqdori'}
                {adjustType === 'adjust' && 'Yangi qoldiq'}
              </label>
              <input type="number" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} min="0" required autoFocus />
            </div>
            <div className="form-group form-span-2">
              <label>Sabab / izoh (ixtiyoriy)</label>
              <input type="text" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} placeholder="masalan: Yetkazib berishdan kirim" />
            </div>
            <div className="modal-actions form-span-2">
              <button type="button" className="btn btn-secondary" onClick={() => setAdjustTarget(null)}>Bekor qilish</button>
              <button type="submit" className="btn btn-primary">Saqlash</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
