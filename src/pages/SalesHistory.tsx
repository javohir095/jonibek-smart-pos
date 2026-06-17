import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { EmptyState, ConfirmDialog } from '../components/ui/Common';
import Modal from '../components/ui/Modal';
import { Sale } from '../types';
import { formatSum, formatDateTime, isSameDay, startOfWeek, startOfMonth } from '../utils/format';
import { useToast } from '../components/ui/Toast';

type DateFilter = 'today' | 'yesterday' | 'week' | 'month' | 'all' | 'custom';

const paymentLabels: Record<string, string> = {
  cash: 'Naqd', card: 'Karta', online: 'Onlayn', mixed: 'Aralash',
};

export default function SalesHistory() {
  const sales = useAppStore((s) => s.sales);
  const clearSales = useAppStore((s) => s.clearSales);
  const currentUser = useAppStore((s) => s.currentUser);
  const { showToast } = useToast();

  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const filtered = useMemo(() => {
    const now = new Date();
    return sales.filter((sale) => {
      const date = new Date(sale.createdAt);
      switch (dateFilter) {
        case 'today':
          return isSameDay(date, now);
        case 'yesterday': {
          const y = new Date(now);
          y.setDate(y.getDate() - 1);
          return isSameDay(date, y);
        }
        case 'week':
          return date >= startOfWeek(now);
        case 'month':
          return date >= startOfMonth(now);
        case 'custom': {
          if (!customFrom && !customTo) return true;
          const from = customFrom ? new Date(customFrom) : null;
          const to = customTo ? new Date(customTo) : null;
          if (from && date < from) return false;
          if (to) {
            const toEnd = new Date(to);
            toEnd.setHours(23, 59, 59, 999);
            if (date > toEnd) return false;
          }
          return true;
        }
        case 'all':
        default:
          return true;
      }
    });
  }, [sales, dateFilter, customFrom, customTo]);

  const totalAmount = filtered.reduce((sum, s) => sum + s.total, 0);

  const handleExport = (format: 'csv' | 'excel') => {
    if (filtered.length === 0) {
      showToast('Eksport qilish uchun ma\'lumot yo\'q', 'error');
      return;
    }
    const headers = ['Chek', 'Sana', 'Kassir', 'Mijoz', "Jami summa", 'Chegirma', "To'lov", "To'lov turi"];
    const rows = filtered.map((s) => [
      `#${s.id.slice(-6)}`,
      formatDateTime(s.createdAt),
      s.cashierName,
      s.customerName || '',
      s.subtotal,
      s.discountTotal,
      s.total,
      paymentLabels[s.paymentMethod],
    ]);
    const csvContent = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sotuvlar_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`${format === 'csv' ? 'CSV' : 'Excel'} fayl yuklab olindi`, 'success');
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Sotuvlar tarixi</h1>
          <p>{filtered.length} ta chek, jami {formatSum(totalAmount)}</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => handleExport('csv')}>CSV eksport</button>
          <button className="btn btn-secondary" onClick={() => handleExport('excel')}>Excel eksport</button>
          {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin') && sales.length > 0 && (
            <button className="btn btn-danger" onClick={() => setShowClearConfirm(true)}>
              Tarixni tozalash
            </button>
          )}
        </div>
      </div>

      <div className="tabs-row">
        <button className={`tab-btn ${dateFilter === 'today' ? 'active' : ''}`} onClick={() => setDateFilter('today')}>Bugun</button>
        <button className={`tab-btn ${dateFilter === 'yesterday' ? 'active' : ''}`} onClick={() => setDateFilter('yesterday')}>Kecha</button>
        <button className={`tab-btn ${dateFilter === 'week' ? 'active' : ''}`} onClick={() => setDateFilter('week')}>Shu hafta</button>
        <button className={`tab-btn ${dateFilter === 'month' ? 'active' : ''}`} onClick={() => setDateFilter('month')}>Shu oy</button>
        <button className={`tab-btn ${dateFilter === 'all' ? 'active' : ''}`} onClick={() => setDateFilter('all')}>Barchasi</button>
        <button className={`tab-btn ${dateFilter === 'custom' ? 'active' : ''}`} onClick={() => setDateFilter('custom')}>Davr bo'yicha</button>
      </div>

      {dateFilter === 'custom' && (
        <div className="filters-row">
          <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="filter-select" />
          <span style={{ alignSelf: 'center' }}>—</span>
          <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="filter-select" />
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={'\u29D6'} title="Sotuvlar topilmadi" description="Tanlangan davr uchun sotuvlar mavjud emas" />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Chek</th>
                <th>Sana</th>
                <th>Kassir</th>
                <th>Mijoz</th>
                <th>Mahsulotlar</th>
                <th>Summa</th>
                <th>To'lov</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sale) => (
                <tr key={sale.id}>
                  <td className="mono">#{sale.id.slice(-6)}</td>
                  <td>{formatDateTime(sale.createdAt)}</td>
                  <td>{sale.cashierName}</td>
                  <td>{sale.customerName || '—'}</td>
                  <td>{sale.items.length} xil, {sale.items.reduce((s, i) => s + i.quantity, 0)} dona</td>
                  <td><strong>{formatSum(sale.total)}</strong></td>
                  <td><span className="badge">{paymentLabels[sale.paymentMethod]}</span></td>
                  <td className="actions-cell">
                    <button className="btn btn-sm btn-secondary" onClick={() => setSelectedSale(sale)}>Ko'rish</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedSale && (
        <Modal title={`Chek #${selectedSale.id.slice(-6)}`} onClose={() => setSelectedSale(null)}>
          <div className="sale-detail">
            <div className="sale-detail-meta">
              <div><span>Sana</span><strong>{formatDateTime(selectedSale.createdAt)}</strong></div>
              <div><span>Kassir</span><strong>{selectedSale.cashierName}</strong></div>
              <div><span>Mijoz</span><strong>{selectedSale.customerName || '—'}</strong></div>
              <div><span>To'lov turi</span><strong>{paymentLabels[selectedSale.paymentMethod]}</strong></div>
            </div>
            <table className="data-table">
              <thead>
                <tr><th>Mahsulot</th><th>Soni</th><th>Narx</th><th>Jami</th></tr>
              </thead>
              <tbody>
                {selectedSale.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                    <td>{formatSum(item.appliedPrice)}</td>
                    <td>{formatSum(item.appliedPrice * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="sale-detail-totals">
              <div><span>Jami</span><span>{formatSum(selectedSale.subtotal)}</span></div>
              {selectedSale.discountTotal > 0 && <div><span>Chegirma</span><span>−{formatSum(selectedSale.discountTotal)}</span></div>}
              <div className="sale-detail-final"><span>Jami to'lov</span><span>{formatSum(selectedSale.total)}</span></div>
            </div>
          </div>
        </Modal>
      )}

      {showClearConfirm && (
        <ConfirmDialog
          title="Sotuvlar tarixini tozalash"
          message={`Jami ${sales.length} ta sotuv yozuvi butunlay o'chiriladi. Bu amalni qaytarib bo'lmaydi. Davom etasizmi?`}
          onConfirm={() => {
            clearSales();
            setShowClearConfirm(false);
            showToast('Sotuvlar tarixi tozalandi', 'success');
          }}
          onCancel={() => setShowClearConfirm(false)}
          danger
        />
      )}
    </div>
  );
}
