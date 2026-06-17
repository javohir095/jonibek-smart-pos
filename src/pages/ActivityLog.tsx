import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { EmptyState } from '../components/ui/Common';
import { formatDateTime } from '../utils/format';

export default function ActivityLog() {
  const activityLogs = useAppStore((s) => s.activityLogs);
  const users = useAppStore((s) => s.users);

  const [userFilter, setUserFilter] = useState<string | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = activityLogs;
    if (userFilter !== 'all') list = list.filter((l) => l.userId === userFilter);
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      list = list.filter((l) => l.action.toLowerCase().includes(term) || l.details.toLowerCase().includes(term));
    }
    return list;
  }, [activityLogs, userFilter, search]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Faollik jurnali</h1>
          <p>Tizimda amalga oshirilgan barcha amallar tarixi</p>
        </div>
      </div>

      <div className="filters-row">
        <input type="text" placeholder="Amal yoki tafsilot bo'yicha qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} className="filter-search" />
        <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="filter-select">
          <option value="all">Barcha xodimlar</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={'\u29D5'} title="Yozuvlar topilmadi" />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Vaqt</th><th>Xodim</th><th>Amal</th><th>Tafsilot</th></tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id}>
                  <td>{formatDateTime(log.date)}</td>
                  <td>{log.userName}</td>
                  <td><span className="badge">{log.action}</span></td>
                  <td>{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
