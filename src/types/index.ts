export type Role = 'superadmin' | 'admin' | 'cashier' | 'warehouse' | 'accountant';

export interface User {
  id: string;
  name: string;
  username: string;
  password: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  debt: number;
}

export interface Product {
  id: string;
  name: string;
  barcode: string;
  categoryId: string;
  supplierId: string;
  purchasePrice: number;
  sellingPrice: number;
  discountPrice?: number;
  quantity: number;
  minStock: number;
  unit: string;
}

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  totalSpent: number;
  totalDebt: number;
  loyaltyPoints: number;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  name: string;
  unit: string;
  unitPrice: number;
  appliedPrice: number;
  quantity: number;
  maxQuantity: number;
}

export type PaymentMethod = 'cash' | 'card' | 'online' | 'mixed';

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  appliedPrice: number;
}

export interface Sale {
  id: string;
  cashierId: string;
  cashierName: string;
  customerId: string | null;
  customerName: string | null;
  items: SaleItem[];
  subtotal: number;
  discountTotal: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountReceived: number;
  changeDue: number;
  createdAt: string;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
}

export interface DebtPayment {
  id: string;
  customerId: string;
  amount: number;
  date: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  date: string;
}

export interface AppSettings {
  storeName: string;
  address: string;
  phone: string;
  logoUrl: string;
  currency: string;
  language: 'uz' | 'ru' | 'en';
  receiptFooter: string;
}
