import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  User, Category, Supplier, Product, Customer, Sale, Expense, DebtPayment, ActivityLog, AppSettings,
} from '../types';
import {
  seedUsers, seedCategories, seedSuppliers, seedProducts, seedCustomers,
  seedSales, seedExpenses, seedDebtPayments, seedActivityLogs, seedSettings,
} from '../data/seedData';

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

interface AppState {
  // Auth
  currentUser: User | null;
  login: (username: string, password: string) => { success: boolean; message?: string };
  logout: () => void;

  // Theme & language
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Data
  users: User[];
  categories: Category[];
  suppliers: Supplier[];
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  expenses: Expense[];
  debtPayments: DebtPayment[];
  activityLogs: ActivityLog[];
  settings: AppSettings;

  // Mutations
  addProduct: (p: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  addCategory: (name: string) => void;
  deleteCategory: (id: string) => void;

  addSupplier: (s: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, s: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  addCustomer: (c: Omit<Customer, 'id' | 'totalSpent' | 'totalDebt' | 'loyaltyPoints' | 'createdAt'>) => void;
  updateCustomer: (id: string, c: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addDebtPayment: (customerId: string, amount: number) => void;

  addExpense: (e: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;

  addUser: (u: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, u: Partial<User>) => void;
  deleteUser: (id: string) => void;

  completeSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => Sale;
  clearSales: () => void;

  updateSettings: (s: Partial<AppSettings>) => void;

  logActivity: (action: string, details: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,

      login: (username, password) => {
        const user = get().users.find(
          (u) => u.username === username && u.password === password
        );
        if (!user) {
          return { success: false, message: 'Login yoki parol noto\'g\'ri' };
        }
        if (!user.active) {
          return { success: false, message: 'Hisobingiz faol emas. Administratorga murojaat qiling.' };
        }
        set({ currentUser: user });
        get().logActivity('Tizimga kirish', `${user.name} tizimga kirdi`);
        return { success: true };
      },

      logout: () => {
        const user = get().currentUser;
        if (user) {
          get().logActivity('Tizimdan chiqish', `${user.name} tizimdan chiqdi`);
        }
        set({ currentUser: null });
      },

      theme: 'light',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

      users: seedUsers,
      categories: seedCategories,
      suppliers: seedSuppliers,
      products: seedProducts,
      customers: seedCustomers,
      sales: seedSales,
      expenses: seedExpenses,
      debtPayments: seedDebtPayments,
      activityLogs: seedActivityLogs,
      settings: seedSettings,

      addProduct: (p) => {
        const product: Product = { ...p, id: genId('p') };
        set((state) => ({ products: [product, ...state.products] }));
        get().logActivity('Mahsulot qo\'shildi', `"${product.name}" qo'shildi`);
      },

      updateProduct: (id, p) => {
        set((state) => ({
          products: state.products.map((item) => (item.id === id ? { ...item, ...p } : item)),
        }));
        const updated = get().products.find((x) => x.id === id);
        get().logActivity('Mahsulot tahrirlandi', `"${updated?.name}" yangilandi`);
      },

      deleteProduct: (id) => {
        const product = get().products.find((p) => p.id === id);
        set((state) => ({ products: state.products.filter((p) => p.id !== id) }));
        get().logActivity('Mahsulot o\'chirildi', `"${product?.name}" o'chirildi`);
      },

      addCategory: (name) => {
        const category: Category = { id: genId('c'), name };
        set((state) => ({ categories: [...state.categories, category] }));
        get().logActivity('Kategoriya qo\'shildi', `"${name}" qo'shildi`);
      },

      deleteCategory: (id) => {
        set((state) => ({ categories: state.categories.filter((c) => c.id !== id) }));
      },

      addSupplier: (s) => {
        const supplier: Supplier = { ...s, id: genId('s') };
        set((state) => ({ suppliers: [supplier, ...state.suppliers] }));
        get().logActivity('Ta\'minotchi qo\'shildi', `"${supplier.name}" qo'shildi`);
      },

      updateSupplier: (id, s) => {
        set((state) => ({
          suppliers: state.suppliers.map((item) => (item.id === id ? { ...item, ...s } : item)),
        }));
      },

      deleteSupplier: (id) => {
        set((state) => ({ suppliers: state.suppliers.filter((s) => s.id !== id) }));
      },

      addCustomer: (c) => {
        const customer: Customer = {
          ...c, id: genId('cu'), totalSpent: 0, totalDebt: 0, loyaltyPoints: 0,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ customers: [customer, ...state.customers] }));
        get().logActivity('Mijoz qo\'shildi', `"${customer.fullName}" qo'shildi`);
      },

      updateCustomer: (id, c) => {
        set((state) => ({
          customers: state.customers.map((item) => (item.id === id ? { ...item, ...c } : item)),
        }));
      },

      deleteCustomer: (id) => {
        set((state) => ({ customers: state.customers.filter((c) => c.id !== id) }));
      },

      addDebtPayment: (customerId, amount) => {
        const payment: DebtPayment = { id: genId('dp'), customerId, amount, date: new Date().toISOString() };
        set((state) => ({
          debtPayments: [payment, ...state.debtPayments],
          customers: state.customers.map((c) =>
            c.id === customerId ? { ...c, totalDebt: Math.max(0, c.totalDebt - amount) } : c
          ),
        }));
        const customer = get().customers.find((c) => c.id === customerId);
        get().logActivity('Qarz to\'landi', `"${customer?.fullName}" ${amount.toLocaleString('uz-UZ')} so'm to'ladi`);
      },

      addExpense: (e) => {
        const expense: Expense = { ...e, id: genId('e') };
        set((state) => ({ expenses: [expense, ...state.expenses] }));
        get().logActivity('Xarajat qo\'shildi', `"${expense.description}" - ${expense.amount.toLocaleString('uz-UZ')} so'm`);
      },

      deleteExpense: (id) => {
        set((state) => ({ expenses: state.expenses.filter((e) => e.id !== id) }));
      },

      addUser: (u) => {
        const user: User = { ...u, id: genId('u'), createdAt: new Date().toISOString() };
        set((state) => ({ users: [...state.users, user] }));
        get().logActivity('Foydalanuvchi qo\'shildi', `"${user.name}" (${user.role}) qo'shildi`);
      },

      updateUser: (id, u) => {
        set((state) => ({
          users: state.users.map((item) => (item.id === id ? { ...item, ...u } : item)),
        }));
        const updated = get().users.find((x) => x.id === id);
        get().logActivity('Foydalanuvchi tahrirlandi', `"${updated?.name}" yangilandi`);
      },

      deleteUser: (id) => {
        const user = get().users.find((u) => u.id === id);
        set((state) => ({ users: state.users.filter((u) => u.id !== id) }));
        get().logActivity('Foydalanuvchi o\'chirildi', `"${user?.name}" o'chirildi`);
      },

      completeSale: (saleData) => {
        const sale: Sale = { ...saleData, id: genId('sl'), createdAt: new Date().toISOString() };

        set((state) => {
          // Decrement stock
          const updatedProducts = state.products.map((product) => {
            const item = sale.items.find((i) => i.productId === product.id);
            if (item) {
              return { ...product, quantity: Math.max(0, product.quantity - item.quantity) };
            }
            return product;
          });

          // Update customer stats
          let updatedCustomers = state.customers;
          if (sale.customerId) {
            updatedCustomers = state.customers.map((c) => {
              if (c.id !== sale.customerId) return c;
              const earnedPoints = Math.floor(sale.total / 10000);
              let newDebt = c.totalDebt;
              if (sale.changeDue < 0) {
                newDebt += Math.abs(sale.changeDue);
              }
              return {
                ...c,
                totalSpent: c.totalSpent + sale.total,
                loyaltyPoints: c.loyaltyPoints + earnedPoints,
                totalDebt: newDebt,
              };
            });
          }

          return {
            sales: [sale, ...state.sales],
            products: updatedProducts,
            customers: updatedCustomers,
          };
        });

        get().logActivity('Sotuv amalga oshirildi', `Chek #${sale.id.slice(-6)} - ${sale.total.toLocaleString('uz-UZ')} so'm`);
        return sale;
      },

      updateSettings: (s) => {
        set((state) => ({ settings: { ...state.settings, ...s } }));
        get().logActivity('Sozlamalar o\'zgartirildi', 'Tizim sozlamalari yangilandi');
      },

      clearSales: () => {
        set({ sales: [] });
        get().logActivity('Sotuvlar tarixi tozalandi', 'Barcha sotuvlar o\'chirildi');
      },

      logActivity: (action, details) => {
        const user = get().currentUser;
        const log: ActivityLog = {
          id: genId('al'),
          userId: user?.id || 'system',
          userName: user?.name || 'Tizim',
          action,
          details,
          date: new Date().toISOString(),
        };
        set((state) => ({ activityLogs: [log, ...state.activityLogs].slice(0, 200) }));
      },
    }),
    {
      name: 'smartpos-storage-v4',
    }
  )
);
