import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useToast } from '../components/ui/Toast';
import Modal from '../components/ui/Modal';
import { EmptyState } from '../components/ui/Common';
import { formatSum, formatDateTime } from '../utils/format';

interface PurchaseRecord {
  id: string;
  productId: string;
  productName: string;
  supplierId: string;
  supplierName: string;
  quantity: number;
  purchasePrice: number;
  invoiceNumber: string;
  date: string;
}

export default function Purchases() {
  const products = useAppStore((s) => s.products);
  const suppliers = useAppStore((s) => s.suppliers);
  const updateProduct = useAppStore((s) => s.updateProduct);
  const updateSupplier = useAppStore((s) => s.updateSupplier);
  const logActivity = useAppStore((s) => s.logActivity);
  const { showToast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [records, setRecords] = useState<PurchaseRecord[]>([]);

  const [form, setForm] = useState({
    productId: products[0]?.id || '',
    supplierId: suppliers[0]?.id || '',
    quantity: '',
    purchasePrice: '',
    invoiceNumber: '',
    addToSupplierDebt: false,
  });

  const openAdd = () => {
    setForm({
      productId: products[0]?.id || '',
      supplierId: suppliers[0]?.id || '',
      quantity: '',
      purchasePrice: products[0] ? String(products[0].purchasePrice) : '',
      invoiceNumber: '',
      addToSupplierDebt: false,
    });
    setShowModal(true);
  };

  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    setForm((f) => ({ ...f, productId, purchasePrice: product ? String(product.purchasePrice) : f.purchasePrice }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find((p) => p.id === form.productId);
    const supplier = suppliers.find((s) => s.id === form.supplierId);
    if (!product || !supplier) {
      showToast('Mahsulot va ta\'minotchini tanlang', 'error');
      return;
    }
    const qty = parseFloat(form.quantity);
    const price = parseFloat(form.purchasePrice);
    if (isNaN(qty) || qty <= 0) {
      showToast('Miqdorni to\'g\'ri kiriting', 'error');
      return;
    }
    if (isNaN(price) || price < 0) {
      showToast('Narxni to\'g\'ri kiriting', 'error');
      return;
    }

    // Update stock + purchase price
    updateProduct(product.id, { quantity: product.quantity + qty, purchasePrice: price });

    // Update supplier debt if invoice not yet paid
    if (form.addToSupplierDebt) {
      updateSupplier(supplier.id, { debt: supplier.debt + qty * price });
    }

    const record: PurchaseRecord = {
      id: `pr_${Date.now()}`,
      productId: product.id,
      productName: product.name,
      supplierId: supplier.id,
      supplierName: supplier.name,
      quantity: qty,
      purchasePrice: price,
      invoiceNumber: form.invoiceNumber.trim() || '—',
      date: new Date().toISOString(),
    };
    setRecords((prev) => [record, ...prev]);
    logActivity('Ombor kirimi', `"${product.name}" - ${qty} ${product.unit} kirim qilindi`);
    showToast('Mahsulot kirimi qabul qilindi va ombor yangilandi', 'success');
    setShowModal(false);
  };

  const totalThisSession = records.reduce((sum, r) => sum + r.quantity * r.purchasePrice, 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Xaridlar</h1>
          <p>Mahsulot kirimi va ta'minotchi hisob-kitobi</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Yangi kirim</button>
      </div>

      {records.length === 0 ? (
        <EmptyState icon={'\u21BB'} title="Hozircha kirimlar yo'q" description="Yangi mahsulot kirimini qo'shing" />
      ) : (
        <>
          <div className="stat-cards" style={{ marginBottom: 16 }}>
            <div className="stat-card">
              <span className="stat-label">Bu seansda kirim qilingan</span>
              <span className="stat-value">{records.length} ta</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Umumiy summa</span>
              <span className="stat-value">{formatSum(totalThisSession)}</span>
            </div>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mahsulot</th>
                  <th>Ta'minotchi</th>
                  <th>Miqdor</th>
                  <th>Narx</th>
                  <th>Jami</th>
                  <th>Hisob-faktura</th>
                  <th>Sana</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.productName}</strong></td>
                    <td>{r.supplierName}</td>
                    <td>{r.quantity}</td>
                    <td>{formatSum(r.purchasePrice)}</td>
                    <td>{formatSum(r.quantity * r.purchasePrice)}</td>
                    <td className="mono">{r.invoiceNumber}</td>
                    <td>{formatDateTime(r.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showModal && (
        <Modal title="Yangi mahsulot kirimi" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group form-span-2">
              <label>Mahsulot *</label>
              <select value={form.productId} onChange={(e) => handleProductChange(e.target.value)}>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} (qoldiq: {p.quantity} {p.unit})</option>)}
              </select>
            </div>
            <div className="form-group form-span-2">
              <label>Ta'minotchi *</label>
              <select value={form.supplierId} onChange={(e) => setForm((f) => ({ ...f, supplierId: e.target.value }))}>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Miqdor *</label>
              <input type="number" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} min="0" required autoFocus />
            </div>
            <div className="form-group">
              <label>Kelish narxi (so'm) *</label>
              <input type="number" value={form.purchasePrice} onChange={(e) => setForm((f) => ({ ...f, purchasePrice: e.target.value }))} min="0" required />
            </div>
            <div className="form-group form-span-2">
              <label>Hisob-faktura raqami</label>
              <input type="text" value={form.invoiceNumber} onChange={(e) => setForm((f) => ({ ...f, invoiceNumber: e.target.value }))} placeholder="masalan: INV-2026-001" />
            </div>
            <div className="form-group form-span-2 checkbox-group">
              <label>
                <input type="checkbox" checked={form.addToSupplierDebt} onChange={(e) => setForm((f) => ({ ...f, addToSupplierDebt: e.target.checked }))} />
                Ushbu summani ta'minotchi qarziga qo'shish (hisob-faktura to'lanmagan)
              </label>
            </div>
            <div className="modal-actions form-span-2">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Bekor qilish</button>
              <button type="submit" className="btn btn-primary">Kirimni qabul qilish</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
