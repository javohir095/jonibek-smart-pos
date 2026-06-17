import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useToast } from '../components/ui/Toast';
import Modal from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/Common';
import { User, Role } from '../types';
import { formatDate } from '../utils/format';

const roleLabels: Record<Role, string> = {
  superadmin: 'Super Admin',
  admin: 'Administrator',
  cashier: 'Kassir',
  warehouse: 'Omborchi',
  accountant: 'Buxgalter',
};

// Roles that admin can ADD (no superadmin)
const addableRoles: { value: Role; label: string }[] = [
  { value: 'admin', label: 'Administrator' },
  { value: 'cashier', label: 'Kassir' },
  { value: 'warehouse', label: 'Omborchi' },
  { value: 'accountant', label: 'Buxgalter' },
];

export default function Employees() {
  const users = useAppStore((s) => s.users);
  const currentUser = useAppStore((s) => s.currentUser);
  const addUser = useAppStore((s) => s.addUser);
  const updateUser = useAppStore((s) => s.updateUser);
  const deleteUser = useAppStore((s) => s.deleteUser);
  const { showToast } = useToast();

  const isSuperAdmin = currentUser?.role === 'superadmin';

  // Visible users:
  // - superadmin sees everyone
  // - admin sees everyone EXCEPT superadmin
  const visibleUsers = users.filter((u) => {
    if (isSuperAdmin) return true;
    return u.role !== 'superadmin';
  });

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'cashier' as Role });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', username: '', password: '', role: 'cashier' });
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setForm({ name: user.name, username: user.username, password: user.password, role: user.role });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.username.trim() || !form.password.trim()) {
      showToast("Barcha maydonlarni to'ldiring", 'error');
      return;
    }
    if (!editing) {
      const exists = users.some((u) => u.username === form.username.trim());
      if (exists) {
        showToast('Bu login allaqachon mavjud', 'error');
        return;
      }
    }
    if (editing) {
      updateUser(editing.id, { name: form.name, username: form.username, password: form.password, role: form.role });
      showToast("Xodim ma'lumotlari yangilandi", 'success');
    } else {
      addUser({ name: form.name, username: form.username, password: form.password, role: form.role, active: true });
      showToast("Xodim qo'shildi", 'success');
    }
    setShowModal(false);
  };

  const toggleActive = (user: User) => {
    if (user.id === currentUser?.id) {
      showToast("O'zingizni faolsizlantira olmaysiz", 'error');
      return;
    }
    if (user.role === 'superadmin') {
      showToast("Super adminni faolsizlantirish mumkin emas", 'error');
      return;
    }
    updateUser(user.id, { active: !user.active });
    showToast(user.active ? 'Xodim faolsizlantirildi' : 'Xodim faollashtirildi', 'success');
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteUser(deleteTarget.id);
    showToast("Xodim o'chirildi", 'success');
    setDeleteTarget(null);
  };

  // Can current user delete target user?
  const canDelete = (user: User): boolean => {
    if (user.id === currentUser?.id) return false;      // o'zini o'chira olmaydi
    if (user.role === 'superadmin') return false;        // superadminni hech kim o'chira olmaydi
    if (!isSuperAdmin && user.role === 'admin') return false; // admin boshqa adminni o'chira olmaydi
    return true;
  };

  // Can current user edit target user?
  const canEdit = (user: User): boolean => {
    if (user.role === 'superadmin' && !isSuperAdmin) return false;
    if (!isSuperAdmin && user.role === 'admin' && user.id !== currentUser?.id) return false;
    return true;
  };

  // Can current user toggle active for target user?
  const canToggle = (user: User): boolean => {
    if (user.id === currentUser?.id) return false;
    if (user.role === 'superadmin') return false;
    if (!isSuperAdmin && user.role === 'admin') return false;
    return true;
  };

  // Role options in form - superadmin never shown, admin can't add superadmin
  const roleOptions = addableRoles;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Xodimlar</h1>
          <p>{visibleUsers.length} ta xodim</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Xodim qo'shish</button>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ism</th>
              <th>Login</th>
              <th>Lavozim</th>
              <th>Holat</th>
              <th>Qo'shilgan sana</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visibleUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <strong>{user.name}</strong>
                  {user.id === currentUser?.id && <span style={{ color: 'var(--primary)', fontSize: 11, marginLeft: 6 }}>(Siz)</span>}
                </td>
                <td className="mono">{user.username}</td>
                <td>
                  <span className={user.role === 'superadmin' ? 'badge badge-success' : ''}>
                    {roleLabels[user.role]}
                  </span>
                </td>
                <td>
                  {user.active
                    ? <span className="badge badge-success">Faol</span>
                    : <span className="badge badge-danger">Faolsiz</span>}
                </td>
                <td>{formatDate(user.createdAt)}</td>
                <td className="actions-cell">
                  {canToggle(user) && (
                    <button className="btn btn-sm btn-secondary" onClick={() => toggleActive(user)}>
                      {user.active ? 'Faolsizlantirish' : 'Faollashtirish'}
                    </button>
                  )}
                  {canEdit(user) && (
                    <button className="icon-btn-sm" onClick={() => openEdit(user)} title="Tahrirlash">{'\u270E'}</button>
                  )}
                  {canDelete(user) && (
                    <button className="icon-btn-sm icon-danger" onClick={() => setDeleteTarget(user)} title="O'chirish">{'\u2715'}</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal
          title={editing ? 'Xodimni tahrirlash' : "Yangi xodim qo'shish"}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group form-span-2">
              <label>To'liq ism *</label>
              <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>Login *</label>
              <input type="text" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>Parol *</label>
              <input type="text" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
            </div>
            <div className="form-group form-span-2">
              <label>Lavozim *</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
                disabled={editing?.role === 'superadmin'}
              >
                {roleOptions.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
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
          title="Xodimni o'chirish"
          message={`"${deleteTarget.name}" xodimini o'chirishni tasdiqlaysizmi?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          danger
        />
      )}
    </div>
  );
}
