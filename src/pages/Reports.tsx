import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useToast } from '../components/ui/Toast';
import { formatSum, formatNumber, formatDate, startOfMonth, startOfWeek } from '../utils/format';

type ReportType = 'sales' | 'products' | 'inventory' | 'employees' | 'financial';
type PeriodType = 'week' | 'month' | 'all';

export default function Reports() {
  const sales = useAppStore((s) => s.sales);
  const products = useAppStore((s) => s.products);
  const expenses = useAppStore((s) => s.expenses);
  const categories = useAppStore((s) => s.categories);
  const { showToast } = useToast();

  const [reportType, setReportType] = useState<ReportType>('sales');
  const [period, setPeriod] = useState<PeriodType>('month');

  const now = useMemo(() => new Date(), []);

  const filteredSales = useMemo(() => {
    if (period === 'all') return sales;
    const start = period === 'week' ? startOfWeek(now) : startOfMonth(now);
    return sales.filter((s) => new Date(s.createdAt) >= start);
  }, [sales, period, now]);

  const filteredExpenses = useMemo(() => {
    if (period === 'all') return expenses;
    const start = period === 'week' ? startOfWeek(now) : startOfMonth(now);
    return expenses.filter((e) => new Date(e.date) >= start);
  }, [expenses, period, now]);

  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const totalDiscount = filteredSales.reduce((sum, s) => sum + s.discountTotal, 0);

  const productSales = useMemo(() => {
    const counts: Record<string, { name: string; qty: number; revenue: number }> = {};
    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!counts[item.productId]) counts[item.productId] = { name: item.name, qty: 0, revenue: 0 };
        counts[item.productId].qty += item.quantity;
        counts[item.productId].revenue += item.appliedPrice * item.quantity;
      });
    });
    return Object.values(counts).sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales]);

  const employeeSales = useMemo(() => {
    const counts: Record<string, { name: string; count: number; total: number }> = {};
    filteredSales.forEach((sale) => {
      if (!counts[sale.cashierId]) counts[sale.cashierId] = { name: sale.cashierName, count: 0, total: 0 };
      counts[sale.cashierId].count += 1;
      counts[sale.cashierId].total += sale.total;
    });
    return Object.values(counts).sort((a, b) => b.total - a.total);
  }, [filteredSales]);

  const totalCost = filteredSales.reduce((sum, sale) => {
    return sum + sale.items.reduce((isum, item) => {
      const product = products.find((p) => p.id === item.productId);
      return isum + (product ? product.purchasePrice * item.quantity : 0);
    }, 0);
  }, 0);
  const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalCost - totalExpenseAmount;

  const inventoryValue = products.reduce((sum, p) => sum + p.purchasePrice * p.quantity, 0);
  const lowStockProducts = products.filter((p) => p.quantity <= p.minStock);

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    showToast(
      format === 'pdf'
        ? "PDF eksport hozircha demo rejimida ishlamaydi. CSV formatida yuklab olishingiz mumkin."
        : `${format === 'csv' ? 'CSV' : 'Excel'} fayl yuklab olinmoqda...`,
      format === 'pdf' ? 'info' : 'success'
    );
    if (format === 'pdf') return;

    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (reportType === 'sales') {
      headers = ['Chek', 'Sana', 'Kassir', 'Mijoz', 'Summa'];
      rows = filteredSales.map((s) => [`#${s.id.slice(-6)}`, formatDate(s.createdAt), s.cashierName, s.customerName || '', s.total]);
    } else if (reportType === 'products') {
      headers = ['Mahsulot', 'Sotilgan miqdor', 'Daromad'];
      rows = productSales.map((p) => [p.name, p.qty, p.revenue]);
    } else if (reportType === 'inventory') {
      headers = ['Mahsulot', 'Qoldiq', 'Minimal', 'Ombor qiymati'];
      rows = products.map((p) => [p.name, p.quantity, p.minStock, p.purchasePrice * p.quantity]);
    } else if (reportType === 'employees') {
      headers = ['Xodim', 'Sotuvlar soni', 'Jami summa'];
      rows = employeeSales.map((e) => [e.name, e.count, e.total]);
    } else if (reportType === 'financial') {
      headers = ['Ko\'rsatkich', 'Summa'];
      rows = [
        ['Daromad', totalRevenue],
        ['Tannarx', totalCost],
        ['Chegirma', totalDiscount],
        ['Xarajatlar', totalExpenseAmount],
        ['Sof foyda', netProfit],
      ];
    }

    const csvContent = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hisobot_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Hisobotlar</h1>
          <p>Sotuv, mahsulot, ombor va moliya bo'yicha hisobotlar</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => handleExport('csv')}>CSV</button>
          <button className="btn btn-secondary" onClick={() => handleExport('excel')}>Excel</button>
          <button className="btn btn-secondary" onClick={() => handleExport('pdf')}>PDF</button>
        </div>
      </div>

      <div className="tabs-row">
        <button className={`tab-btn ${reportType === 'sales' ? 'active' : ''}`} onClick={() => setReportType('sales')}>Sotuvlar</button>
        <button className={`tab-btn ${reportType === 'products' ? 'active' : ''}`} onClick={() => setReportType('products')}>Mahsulotlar</button>
        <button className={`tab-btn ${reportType === 'inventory' ? 'active' : ''}`} onClick={() => setReportType('inventory')}>Ombor</button>
        <button className={`tab-btn ${reportType === 'employees' ? 'active' : ''}`} onClick={() => setReportType('employees')}>Xodimlar</button>
        <button className={`tab-btn ${reportType === 'financial' ? 'active' : ''}`} onClick={() => setReportType('financial')}>Moliyaviy</button>
      </div>

      {reportType !== 'inventory' && (
        <div className="tabs-row">
          <button className={`tab-btn ${period === 'week' ? 'active' : ''}`} onClick={() => setPeriod('week')}>Shu hafta</button>
          <button className={`tab-btn ${period === 'month' ? 'active' : ''}`} onClick={() => setPeriod('month')}>Shu oy</button>
          <button className={`tab-btn ${period === 'all' ? 'active' : ''}`} onClick={() => setPeriod('all')}>Barchasi</button>
        </div>
      )}

      {reportType === 'sales' && (
        <>
          <div className="stat-cards" style={{ marginBottom: 16 }}>
            <div className="stat-card"><span className="stat-label">Jami sotuvlar</span><span className="stat-value">{filteredSales.length}</span></div>
            <div className="stat-card"><span className="stat-label">Jami daromad</span><span className="stat-value">{formatSum(totalRevenue)}</span></div>
            <div className="stat-card"><span className="stat-label">Jami chegirma</span><span className="stat-value">{formatSum(totalDiscount)}</span></div>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Chek</th><th>Sana</th><th>Kassir</th><th>Mijoz</th><th>Summa</th></tr></thead>
              <tbody>
                {filteredSales.map((s) => (
                  <tr key={s.id}>
                    <td className="mono">#{s.id.slice(-6)}</td>
                    <td>{formatDate(s.createdAt)}</td>
                    <td>{s.cashierName}</td>
                    <td>{s.customerName || '—'}</td>
                    <td>{formatSum(s.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {reportType === 'products' && (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Mahsulot</th><th>Sotilgan miqdor</th><th>Daromad</th></tr></thead>
            <tbody>
              {productSales.map((p, idx) => (
                <tr key={idx}><td>{p.name}</td><td>{formatNumber(p.qty)}</td><td>{formatSum(p.revenue)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reportType === 'inventory' && (
        <>
          <div className="stat-cards" style={{ marginBottom: 16 }}>
            <div className="stat-card"><span className="stat-label">Jami mahsulot turi</span><span className="stat-value">{products.length}</span></div>
            <div className="stat-card"><span className="stat-label">Ombor qiymati</span><span className="stat-value">{formatSum(inventoryValue)}</span></div>
            <div className="stat-card stat-card-warning"><span className="stat-label">Kam qolgan</span><span className="stat-value">{lowStockProducts.length}</span></div>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Mahsulot</th><th>Kategoriya</th><th>Qoldiq</th><th>Minimal</th><th>Ombor qiymati</th></tr></thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{categories.find((c) => c.id === p.categoryId)?.name || '—'}</td>
                    <td>{p.quantity} {p.unit}</td>
                    <td>{p.minStock} {p.unit}</td>
                    <td>{formatSum(p.purchasePrice * p.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {reportType === 'employees' && (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Xodim</th><th>Sotuvlar soni</th><th>Jami summa</th></tr></thead>
            <tbody>
              {employeeSales.map((e, idx) => (
                <tr key={idx}><td>{e.name}</td><td>{e.count}</td><td>{formatSum(e.total)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reportType === 'financial' && (
        <div className="card">
          <table className="data-table">
            <tbody>
              <tr><td>Jami daromad</td><td>{formatSum(totalRevenue)}</td></tr>
              <tr><td>Tannarx (COGS)</td><td>{formatSum(totalCost)}</td></tr>
              <tr><td>Jami chegirma</td><td>{formatSum(totalDiscount)}</td></tr>
              <tr><td>Jami xarajatlar</td><td>{formatSum(totalExpenseAmount)}</td></tr>
              <tr className="sale-detail-final"><td>Sof foyda</td><td>{formatSum(netProfit)}</td></tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
