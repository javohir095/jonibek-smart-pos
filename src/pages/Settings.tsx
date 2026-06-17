import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useToast } from '../components/ui/Toast';

export default function Settings() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const { showToast } = useToast();

  const [form, setForm] = useState({ ...settings });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.storeName.trim()) {
      showToast("Do'kon nomini kiriting", 'error');
      return;
    }
    updateSettings(form);
    showToast('Sozlamalar saqlandi', 'success');
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Sozlamalar</h1>
          <p>Do'kon ma'lumotlari va tizim sozlamalari</p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group form-span-2">
            <label>Do'kon nomi *</label>
            <input type="text" value={form.storeName} onChange={(e) => setForm((f) => ({ ...f, storeName: e.target.value }))} required />
          </div>

          <div className="form-group form-span-2">
            <label>Manzil</label>
            <input type="text" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          </div>

          <div className="form-group">
            <label>Telefon</label>
            <input type="text" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>

          <div className="form-group">
            <label>Valyuta</label>
            <select value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}>
              <option value="UZS">UZS (so'm)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Til</label>
            <select value={form.language} onChange={(e) => setForm((f) => ({ ...f, language: e.target.value as 'uz' | 'ru' | 'en' }))}>
              <option value="uz">O'zbekcha</option>
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="form-group form-span-2">
            <label>Chek pastki matni (footer)</label>
            <input type="text" value={form.receiptFooter} onChange={(e) => setForm((f) => ({ ...f, receiptFooter: e.target.value }))} />
          </div>

          <div className="modal-actions form-span-2">
            <button type="submit" className="btn btn-primary">Saqlash</button>
          </div>
        </form>
      </div>
    </div>
  );
}
