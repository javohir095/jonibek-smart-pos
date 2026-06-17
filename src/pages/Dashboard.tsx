import React, { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useAppStore } from '../store/useAppStore';
import { formatSum, formatNumber, isSameDay } from '../utils/format';
import { EmptyState } from '../components/ui/Common';

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];

export default function Dashboard() {
  const sales = useAppStore((s) => s.sales);
  const products = useAppStore((s) => s.products);
  const customers = useAppStore((s) => s.customers);
  const expenses = useAppStore((s) => s.expenses);
  const categories = useAppStore((s) => s.categories);
  const currentUser = useAppStore((s) => s.currentUser);

  const today = useMemo(() => new Date(), []);

  const todaySales = useMemo(
    () => sales.filter((s) => isSameDay(new Date(s.createdAt), today)),
    [sales, today]
  );

  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const totalCost = sales.reduce((sum, sale) => {
    return sum + sale.items.reduce((isum, item) => {
      const product = products.find((p) => p.id === item.productId);
      return isum + (product ? product.purchasePrice * item.quantity : 0);
    }, 0);
  }, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalProfit = totalRevenue - totalCost - totalExpenses;

  // Last 7 days sales chart
  const last7Days = useMemo(() => {
    const days: { date: string; label: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayTotal = sales
        .filter((s) => isSameDay(new Date(s.createdAt), d))
        .reduce((sum, s) => sum + s.total, 0);
      days.push({
        date: d.toISOString(),
        label: d.toLocaleDateString('uz-UZ', { weekday: 'short', day: 'numeric' }),
        total: dayTotal,
      });
    }
    return days;
  }, [sales]);

  // Best selling products
  const bestSelling = useMemo(() => {
    const counts: Record<string, { name: string; qty: number; revenue: number }> = {};
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!counts[item.productId]) {
          counts[item.productId] = { name: item.name, qty: 0, revenue: 0 };
        }
        counts[item.productId].qty += item.quantity;
        counts[item.productId].revenue += item.appliedPrice * item.quantity;
      });
    });
    return Object.values(counts).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [sales]);

  // Category breakdown for pie chart
  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return;
        const cat = categories.find((c) => c.id === product.categoryId);
        const catName = cat?.name || 'Boshqa';
        counts[catName] = (counts[catName] || 0) + item.appliedPrice * item.quantity;
      });
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [sales, products, categories]);

  const lowStockCount = products.filter((p) => p.quantity <= p.minStock).length;

  if (sales.length === 0 && products.length === 0) {
    return (
      <EmptyState
        icon={'\u2302'}
        title="Hozircha ma'lumot yo'q"
        description="Sotuvlarni boshlash uchun POS terminalga o'ting"
      />
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Bosh sahifa</h1>
          <p>Xush kelibsiz, {currentUser?.name}! Bugungi holatni ko'rib chiqing.</p>
        </div>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-label">Bugungi sotuvlar</span>
          <span className="stat-value">{formatSum(todayRevenue)}</span>
          <span className="stat-meta">{todaySales.length} ta chek</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Umumiy daromad</span>
          <span className="stat-value">{formatSum(totalRevenue)}</span>
          <span className="stat-meta">{sales.length} ta sotuv</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Sof foyda</span>
          <span className={`stat-value ${totalProfit >= 0 ? 'stat-positive' : 'stat-negative'}`}>
            {formatSum(totalProfit)}
          </span>
          <span className="stat-meta">Xarajatlardan keyin</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Mijozlar</span>
          <span className="stat-value">{formatNumber(customers.length)}</span>
          <span className="stat-meta">Ro'yxatdan o'tgan</span>
        </div>
        {lowStockCount > 0 && (
          <div className="stat-card stat-card-warning">
            <span className="stat-label">Kam qolgan mahsulotlar</span>
            <span className="stat-value">{lowStockCount}</span>
            <span className="stat-meta">E'tibor talab qiladi</span>
          </div>
        )}
      </div>

      <div className="dashboard-grid">
        <div className="card chart-card">
          <h3>Oxirgi 7 kunlik sotuvlar</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => formatNumber(v)} />
              <Tooltip formatter={(v: number) => formatSum(v)} />
              <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} name="Sotuv" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <h3>Eng ko'p sotilgan mahsulotlar</h3>
          {bestSelling.length === 0 ? (
            <EmptyState icon={'\u25A6'} title="Ma'lumot yo'q" description="Sotuvlar bo'lgandan keyin ko'rinadi" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={bestSelling} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => formatNumber(v)} />
                <YAxis type="category" dataKey="name" stroke="var(--text-muted)" fontSize={11} width={120} />
                <Tooltip formatter={(v: number) => `${v} dona`} />
                <Bar dataKey="qty" fill="#16a34a" radius={[0, 4, 4, 0]} name="Sotilgan miqdor" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card chart-card">
          <h3>Kategoriyalar bo'yicha sotuv</h3>
          {categoryBreakdown.length === 0 ? (
            <EmptyState icon={'\u2630'} title="Ma'lumot yo'q" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(entry) => entry.name}
                >
                  {categoryBreakdown.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatSum(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3>So'nggi sotuvlar</h3>
          {sales.length === 0 ? (
            <EmptyState icon={'\u29D6'} title="Sotuvlar yo'q" />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Chek</th>
                  <th>Kassir</th>
                  <th>Mijoz</th>
                  <th>Summa</th>
                  <th>Vaqt</th>
                </tr>
              </thead>
              <tbody>
                {sales.slice(0, 5).map((sale) => (
                  <tr key={sale.id}>
                    <td>#{sale.id.slice(-6)}</td>
                    <td>{sale.cashierName}</td>
                    <td>{sale.customerName || '—'}</td>
                    <td>{formatSum(sale.total)}</td>
                    <td>{new Date(sale.createdAt).toLocaleTimeString('uz-UZ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
