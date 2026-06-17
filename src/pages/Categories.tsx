import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useToast } from '../components/ui/Toast';
import { EmptyState, ConfirmDialog } from '../components/ui/Common';
import { Category } from '../types';

export default function Categories() {
  const categories = useAppStore((s) => s.categories);
  const products = useAppStore((s) => s.products);
  const addCategory = useAppStore((s) => s.addCategory);
  const deleteCategory = useAppStore((s) => s.deleteCategory);
  const { showToast } = useToast();

  const [newName, setNewName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addCategory(newName.trim());
    showToast("Kategoriya qo'shildi", 'success');
    setNewName('');
  };

  const productCount = (categoryId: string) => products.filter((p) => p.categoryId === categoryId).length;

  const handleDelete = () => {
    if (!deleteTarget) return;
    const count = productCount(deleteTarget.id);
    if (count > 0) {
      showToast(`Bu kategoriyada ${count} ta mahsulot bor. Avval ularni boshqa kategoriyaga o'tkazing.`, 'error');
      setDeleteTarget(null);
      return;
    }
    deleteCategory(deleteTarget.id);
    showToast("Kategoriya o'chirildi", 'success');
    setDeleteTarget(null);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Kategoriyalar</h1>
          <p>{categories.length} ta kategoriya</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <form onSubmit={handleAdd} className="inline-form">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Yangi kategoriya nomi"
            className="filter-search"
          />
          <button type="submit" className="btn btn-primary">+ Qo'shish</button>
        </form>
      </div>

      {categories.length === 0 ? (
        <EmptyState icon={'\u2630'} title="Kategoriyalar yo'q" description="Yuqoridagi formadan yangi kategoriya qo'shing" />
      ) : (
        <div className="category-grid">
          {categories.map((cat) => (
            <div key={cat.id} className="category-card">
              <div className="category-card-icon">{'\u2630'}</div>
              <div className="category-card-info">
                <strong>{cat.name}</strong>
                <span>{productCount(cat.id)} ta mahsulot</span>
              </div>
              <button className="icon-btn-sm icon-danger" onClick={() => setDeleteTarget(cat)} title="O'chirish">{'\u2715'}</button>
            </div>
          ))}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Kategoriyani o'chirish"
          message={`"${deleteTarget.name}" kategoriyasini o'chirishni tasdiqlaysizmi?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          danger
        />
      )}
    </div>
  );
}
