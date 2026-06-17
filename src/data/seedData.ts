import {
  User, Category, Supplier, Product, Customer, Sale, Expense, DebtPayment, ActivityLog, AppSettings,
} from '../types';

export const seedUsers: User[] = [
  { id: 'u1', name: 'Javohir', username: 'admin', password: 'admin123', role: 'superadmin', active: true, createdAt: '2025-01-10' },
  { id: 'u2', name: 'Dilnoza Yusupova', username: 'kassir1', password: 'kassir123', role: 'cashier', active: true, createdAt: '2025-02-01' },
  { id: 'u3', name: 'Bekzod Tursunov', username: 'ombor', password: 'ombor123', role: 'warehouse', active: true, createdAt: '2025-02-15' },
  { id: 'u4', name: 'Madina Rashidova', username: 'buxgalter', password: 'buh123', role: 'accountant', active: true, createdAt: '2025-03-01' },
];

export const seedCategories: Category[] = [
  { id: 'c1', name: 'Ichimliklar' },
  { id: 'c2', name: 'Non mahsulotlari' },
  { id: 'c3', name: 'Sut mahsulotlari' },
  { id: 'c4', name: 'Shirinliklar' },
  { id: 'c5', name: 'Maishiy kimyo' },
  { id: 'c6', name: 'Gigiyena' },
];

export const seedSuppliers: Supplier[] = [
  { id: 's1', name: 'Coca-Cola Uzbekistan', phone: '+998901112233', address: 'Toshkent sh.', debt: 1200000 },
  { id: 's2', name: 'Andijon Non Kombinati', phone: '+998931234567', address: 'Andijon sh.', debt: 0 },
  { id: 's3', name: 'Nestle Markaziy Osiyo', phone: '+998971234567', address: 'Toshkent sh.', debt: 540000 },
];

export const seedProducts: Product[] = [
  { id: 'p1', name: 'Coca-Cola 1.5L', barcode: '4870001234561', categoryId: 'c1', supplierId: 's1', purchasePrice: 8500, sellingPrice: 12000, quantity: 48, minStock: 10, unit: 'dona' },
  { id: 'p2', name: 'Fanta 1.5L', barcode: '4870001234578', categoryId: 'c1', supplierId: 's1', purchasePrice: 8200, sellingPrice: 11500, quantity: 32, minStock: 10, unit: 'dona' },
  { id: 'p3', name: 'Oq non', barcode: '4870002000011', categoryId: 'c2', supplierId: 's2', purchasePrice: 2500, sellingPrice: 3500, quantity: 60, minStock: 15, unit: 'dona' },
  { id: 'p4', name: 'Bug\'doy noni', barcode: '4870002000028', categoryId: 'c2', supplierId: 's2', purchasePrice: 3000, sellingPrice: 4000, quantity: 4, minStock: 10, unit: 'dona' },
  { id: 'p5', name: 'Pepsi sut 1L', barcode: '4870003000019', categoryId: 'c3', supplierId: 's3', purchasePrice: 9500, sellingPrice: 13000, discountPrice: 11500, quantity: 20, minStock: 8, unit: 'dona' },
  { id: 'p6', name: 'Tvorog 200g', barcode: '4870003000026', categoryId: 'c3', supplierId: 's3', purchasePrice: 6000, sellingPrice: 8500, quantity: 15, minStock: 5, unit: 'dona' },
  { id: 'p7', name: 'Nestle shokoladi', barcode: '4870004000017', categoryId: 'c4', supplierId: 's3', purchasePrice: 5000, sellingPrice: 7500, quantity: 75, minStock: 20, unit: 'dona' },
  { id: 'p8', name: 'Mars batonchik', barcode: '4870004000024', categoryId: 'c4', supplierId: 's3', purchasePrice: 4200, sellingPrice: 6000, quantity: 90, minStock: 20, unit: 'dona' },
  { id: 'p9', name: 'Fairy idish yuvish', barcode: '4870005000018', categoryId: 'c5', supplierId: 's1', purchasePrice: 12000, sellingPrice: 17000, quantity: 25, minStock: 5, unit: 'dona' },
  { id: 'p10', name: 'Ariel kir yuvish kukuni 3kg', barcode: '4870005000025', categoryId: 'c5', supplierId: 's1', purchasePrice: 35000, sellingPrice: 48000, quantity: 12, minStock: 5, unit: 'dona' },
  { id: 'p11', name: 'Colgate tish pastasi', barcode: '4870006000012', categoryId: 'c6', supplierId: 's3', purchasePrice: 7000, sellingPrice: 10500, quantity: 40, minStock: 10, unit: 'dona' },
  { id: 'p12', name: 'Head & Shoulders shampun', barcode: '4870006000029', categoryId: 'c6', supplierId: 's3', purchasePrice: 18000, sellingPrice: 26000, quantity: 3, minStock: 5, unit: 'dona' },
];

export const seedCustomers: Customer[] = [
  { id: 'cu1', fullName: 'Sherzod Aliyev', phone: '+998901112233', address: 'Chilonzor', totalSpent: 1450000, totalDebt: 0, loyaltyPoints: 145, createdAt: '2025-01-15' },
  { id: 'cu2', fullName: 'Nigora Sodiqova', phone: '+998935554433', address: 'Yunusobod', totalSpent: 890000, totalDebt: 120000, loyaltyPoints: 89, createdAt: '2025-02-20' },
  { id: 'cu3', fullName: 'Jasur Mirzayev', phone: '+998977778899', address: 'Mirzo Ulug\'bek', totalSpent: 2300000, totalDebt: 0, loyaltyPoints: 230, createdAt: '2025-01-05' },
];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export const seedSales: Sale[] = [
  {
    id: 'sl1', cashierId: 'u2', cashierName: 'Dilnoza Yusupova', customerId: 'cu1', customerName: 'Sherzod Aliyev',
    items: [
      { productId: 'p1', name: 'Coca-Cola 1.5L', quantity: 2, unitPrice: 12000, appliedPrice: 12000 },
      { productId: 'p7', name: 'Nestle shokoladi', quantity: 3, unitPrice: 7500, appliedPrice: 7500 },
    ],
    subtotal: 46500, discountTotal: 0, total: 46500,
    paymentMethod: 'cash', amountReceived: 50000, changeDue: 3500, createdAt: daysAgo(0),
  },
  {
    id: 'sl2', cashierId: 'u2', cashierName: 'Dilnoza Yusupova', customerId: null, customerName: null,
    items: [
      { productId: 'p3', name: 'Oq non', quantity: 5, unitPrice: 3500, appliedPrice: 3500 },
      { productId: 'p9', name: 'Fairy idish yuvish', quantity: 1, unitPrice: 17000, appliedPrice: 17000 },
    ],
    subtotal: 34500, discountTotal: 0, total: 34500,
    paymentMethod: 'card', amountReceived: 34500, changeDue: 0, createdAt: daysAgo(0),
  },
  {
    id: 'sl3', cashierId: 'u2', cashierName: 'Dilnoza Yusupova', customerId: 'cu3', customerName: 'Jasur Mirzayev',
    items: [
      { productId: 'p10', name: 'Ariel kir yuvish kukuni 3kg', quantity: 1, unitPrice: 48000, appliedPrice: 45000 },
      { productId: 'p11', name: 'Colgate tish pastasi', quantity: 2, unitPrice: 10500, appliedPrice: 10500 },
    ],
    subtotal: 66000, discountTotal: 3000, total: 63000,
    paymentMethod: 'mixed', amountReceived: 63000, changeDue: 0, createdAt: daysAgo(1),
  },
  {
    id: 'sl4', cashierId: 'u2', cashierName: 'Dilnoza Yusupova', customerId: 'cu2', customerName: 'Nigora Sodiqova',
    items: [
      { productId: 'p5', name: 'Pepsi sut 1L', quantity: 2, unitPrice: 13000, appliedPrice: 11500 },
      { productId: 'p12', name: 'Head & Shoulders shampun', quantity: 1, unitPrice: 26000, appliedPrice: 26000 },
    ],
    subtotal: 49000, discountTotal: 3000, total: 46000,
    paymentMethod: 'cash', amountReceived: 46000, changeDue: 0, createdAt: daysAgo(2),
  },
  {
    id: 'sl5', cashierId: 'u2', cashierName: 'Dilnoza Yusupova', customerId: null, customerName: null,
    items: [
      { productId: 'p2', name: 'Fanta 1.5L', quantity: 4, unitPrice: 11500, appliedPrice: 11500 },
      { productId: 'p8', name: 'Mars batonchik', quantity: 6, unitPrice: 6000, appliedPrice: 6000 },
    ],
    subtotal: 82000, discountTotal: 0, total: 82000,
    paymentMethod: 'online', amountReceived: 82000, changeDue: 0, createdAt: daysAgo(3),
  },
  {
    id: 'sl6', cashierId: 'u2', cashierName: 'Dilnoza Yusupova', customerId: 'cu1', customerName: 'Sherzod Aliyev',
    items: [
      { productId: 'p4', name: 'Bug\'doy noni', quantity: 2, unitPrice: 4000, appliedPrice: 4000 },
      { productId: 'p6', name: 'Tvorog 200g', quantity: 1, unitPrice: 8500, appliedPrice: 8500 },
    ],
    subtotal: 16500, discountTotal: 0, total: 16500,
    paymentMethod: 'cash', amountReceived: 20000, changeDue: 3500, createdAt: daysAgo(5),
  },
];

export const seedExpenses: Expense[] = [
  { id: 'e1', category: 'Ijara', description: 'Dekabr oyi ijara to\'lovi', amount: 4500000, date: daysAgo(10) },
  { id: 'e2', category: 'Kommunal', description: 'Elektr energiyasi', amount: 850000, date: daysAgo(8) },
  { id: 'e3', category: 'Internet', description: 'Oylik internet to\'lovi', amount: 250000, date: daysAgo(8) },
  { id: 'e4', category: 'Ish haqi', description: 'Kassir oyligi', amount: 3200000, date: daysAgo(3) },
  { id: 'e5', category: 'Boshqa', description: 'Tozalash vositalari', amount: 180000, date: daysAgo(1) },
];

export const seedDebtPayments: DebtPayment[] = [
  { id: 'dp1', customerId: 'cu2', amount: 50000, date: daysAgo(4) },
];

export const seedActivityLogs: ActivityLog[] = [
  { id: 'al1', userId: 'u1', userName: 'Aziz Karimov', action: 'Tizimga kirish', details: 'Admin paneliga kirildi', date: daysAgo(0) },
  { id: 'al2', userId: 'u2', userName: 'Dilnoza Yusupova', action: 'Sotuv', details: 'Chek #sl1 yaratildi', date: daysAgo(0) },
  { id: 'al3', userId: 'u3', userName: 'Bekzod Tursunov', action: 'Mahsulot qo\'shildi', details: '"Head & Shoulders shampun" qo\'shildi', date: daysAgo(2) },
  { id: 'al4', userId: 'u1', userName: 'Aziz Karimov', action: 'Foydalanuvchi tahrirlandi', details: 'Madina Rashidova roli o\'zgartirildi', date: daysAgo(5) },
];

export const seedSettings: AppSettings = {
  storeName: 'SmartPOS Do\'koni',
  address: 'Toshkent sh., Chilonzor tumani, 12-uy',
  phone: '+998 71 200 00 00',
  logoUrl: '',
  currency: 'UZS',
  language: 'uz',
  receiptFooter: 'Xaridingiz uchun rahmat! Yana tashrif buyuring.',
};
