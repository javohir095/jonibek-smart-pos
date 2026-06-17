import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useToast } from '../components/ui/Toast';
import { CartItem, PaymentMethod, Product } from '../types';
import { formatSum } from '../utils/format';
import { EmptyState, ConfirmDialog } from '../components/ui/Common';
import Modal from '../components/ui/Modal';

interface PaymentSplit {
  cash: number;
  card: number;
  online: number;
}

function calcLineTotal(item: CartItem): number {
  return item.appliedPrice * item.quantity;
}


export default function POSTerminal() {
  const products = useAppStore((s) => s.products);
  const categories = useAppStore((s) => s.categories);
  const suppliers = useAppStore((s) => s.suppliers);
  const customers = useAppStore((s) => s.customers);
  const currentUser = useAppStore((s) => s.currentUser);
  const completeSale = useAppStore((s) => s.completeSale);
  const updateProduct = useAppStore((s) => s.updateProduct);
  const deleteProduct = useAppStore((s) => s.deleteProduct);
  const settings = useAppStore((s) => s.settings);
  const { showToast } = useToast();

  const canManageProducts = currentUser?.role === 'superadmin' || currentUser?.role === 'admin' || currentUser?.role === 'warehouse';

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | 'all'>('all');
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeRef = useRef<HTMLInputElement>(null);

  const [cart, setCart] = useState<CartItem[]>([]);

  const [editProductTarget, setEditProductTarget] = useState<Product | null>(null);
  const [deleteProductTarget, setDeleteProductTarget] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    name: '', barcode: '', categoryId: '', supplierId: '',
    purchasePrice: '', sellingPrice: '', discountPrice: '',
    quantity: '', minStock: '', unit: 'dona', 
  });

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerList, setShowCustomerList] = useState(false);

  const [discountType, setDiscountType] = useState<'none' | 'percent' | 'amount'>('none');
  const [discountValue, setDiscountValue] = useState<number>(0);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [paymentSplit, setPaymentSplit] = useState<PaymentSplit>({ cash: 0, card: 0, online: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  const [lastReceipt, setLastReceipt] = useState<{
    items: CartItem[];
    subtotal: number;
    discountTotal: number;
    total: number;
    paymentMethod: PaymentMethod;
    amountReceived: number;
    changeDue: number;
    customerName: string | null;
    date: string;
    id: string;
  } | null>(null);

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    barcodeRef.current?.focus();
  }, []);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (activeCategory !== 'all') {
      list = list.filter((p) => p.categoryId === activeCategory);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(term) || p.barcode.toLowerCase().includes(term)
      );
    }
    return list.filter((p) => p.quantity > 0 || cart.some((c) => c.productId === p.id));
  }, [products, activeCategory, searchTerm, cart]);

  const addToCart = useCallback((product: Product) => {
    if (product.quantity <= 0) {
      showToast(`"${product.name}" omborda qolmadi`, 'error');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        if (existing.quantity + 1 > product.quantity) {
          showToast(`"${product.name}" uchun omborda yetarli mahsulot yo'q (qoldiq: ${product.quantity})`, 'error');
          return prev;
        }
        return prev.map((i) => (i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      const price = product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.sellingPrice;
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          unit: product.unit,
          unitPrice: product.sellingPrice,
          appliedPrice: price,
          quantity: 1,
          maxQuantity: product.quantity,
        },
      ];
    });
  }, [showToast]);

  const updateQuantity = useCallback((productId: string, newQty: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item;
          if (newQty <= 0) return null;
          if (newQty > item.maxQuantity) {
            showToast(`"${item.name}" uchun omborda faqat ${item.maxQuantity} ${item.unit} bor`, 'error');
            return { ...item, quantity: item.maxQuantity };
          }
          return { ...item, quantity: newQty };
        })
        .filter((i): i is CartItem => i !== null)
    );
  }, [showToast]);

  const updateLinePrice = useCallback((productId: string, newPrice: number) => {
    setCart((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, appliedPrice: Math.max(0, newPrice) } : item))
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const resetExtras = useCallback(() => {
    setSelectedCustomerId(null);
    setDiscountType('none');
    setDiscountValue(0);
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    resetExtras();
    setShowClearConfirm(false);
  }, [resetExtras]);

  const openEditProduct = useCallback((product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditProductTarget(product);
    setEditForm({
      name: product.name,
      barcode: product.barcode,
      categoryId: product.categoryId,
      supplierId: product.supplierId,
      purchasePrice: String(product.purchasePrice),
      sellingPrice: String(product.sellingPrice),
      discountPrice: product.discountPrice ? String(product.discountPrice) : '',
      quantity: String(product.quantity),
      minStock: String(product.minStock),
      unit: product.unit,
    });
  }, []);

  const handleEditProductSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!editProductTarget) return;
    if (!editForm.name.trim()) {
      showToast("Mahsulot nomini kiriting", 'error');
      return;
    }
    if (!editForm.sellingPrice || parseFloat(editForm.sellingPrice) <= 0) {
      showToast("Sotish narxini to'g'ri kiriting", 'error');
      return;
    }
    updateProduct(editProductTarget.id, {
      name: editForm.name.trim(),
      barcode: editForm.barcode.trim() || editProductTarget.barcode,
      categoryId: editForm.categoryId,
      supplierId: editForm.supplierId,
      purchasePrice: parseFloat(editForm.purchasePrice) || 0,
      sellingPrice: parseFloat(editForm.sellingPrice) || 0,
      discountPrice: editForm.discountPrice ? parseFloat(editForm.discountPrice) : undefined,
      quantity: parseFloat(editForm.quantity) || 0,
      minStock: parseFloat(editForm.minStock) || 0,
      unit: editForm.unit,
    });
    showToast('Mahsulot yangilandi', 'success');
    setEditProductTarget(null);
  }, [editProductTarget, editForm, updateProduct, showToast]);

  const openDeleteProduct = useCallback((product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteProductTarget(product);
  }, []);

  const handleDeleteProduct = useCallback(() => {
    if (!deleteProductTarget) return;
    removeFromCart(deleteProductTarget.id);
    deleteProduct(deleteProductTarget.id);
    showToast("Mahsulot o'chirildi", 'success');
    setDeleteProductTarget(null);
  }, [deleteProductTarget, deleteProduct, removeFromCart, showToast]);

  const handleBarcodeSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const code = barcodeInput.trim();
      if (!code) return;
      const found = products.find((p) => p.barcode === code);
      if (found) {
        addToCart(found);
      } else {
        showToast(`Barcode "${code}" bo'yicha mahsulot topilmadi`, 'error');
      }
      setBarcodeInput('');
    },
    [barcodeInput, products, addToCart, showToast]
  );

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + calcLineTotal(item), 0), [cart]);

  const manualDiscountAmount = useMemo(() => {
    if (discountType === 'percent') return subtotal * (discountValue / 100);
    if (discountType === 'amount') return Math.min(discountValue, subtotal);
    return 0;
  }, [discountType, discountValue, subtotal]);

  const discountTotal = manualDiscountAmount;

  const total = Math.max(0, subtotal - discountTotal);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) || null,
    [customers, selectedCustomerId]
  );

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 8);
    const term = customerSearch.trim().toLowerCase();
    return customers.filter((c) => c.fullName.toLowerCase().includes(term) || c.phone.includes(term)).slice(0, 8);
  }, [customers, customerSearch]);

  const openPaymentModal = useCallback(() => {
    if (cart.length === 0) {
      showToast('Savatcha bo\'sh', 'error');
      return;
    }
    setAmountReceived(total.toFixed(0));
    setPaymentSplit({ cash: total, card: 0, online: 0 });
    setPaymentMethod('cash');
    setShowPaymentModal(true);
  }, [cart, total, showToast]);

  const received = paymentMethod === 'mixed'
    ? paymentSplit.cash + paymentSplit.card + paymentSplit.online
    : parseFloat(amountReceived) || 0;

  const changeDue = received - total;

  const canConfirmPayment = useMemo(() => {
    if (cart.length === 0) return false;
    // Har doim tasdiqlash mumkin — yetishmagan qism avtomatik qarzga yoziladi
    return received >= 0;
  }, [cart, received]);

  const handleConfirmPayment = useCallback(() => {
    if (!canConfirmPayment || !currentUser) return;
    setIsProcessing(true);

    setTimeout(() => {
      const sale = completeSale({
        cashierId: currentUser.id,
        cashierName: currentUser.name,
        customerId: selectedCustomerId,
        customerName: selectedCustomer?.fullName || null,
        items: cart.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          appliedPrice: item.appliedPrice,
        })),
        subtotal,
        discountTotal,
        total,
        paymentMethod,
        amountReceived: received,
        changeDue,
      });

      setLastReceipt({
        items: cart,
        subtotal,
        discountTotal,
        total,
        paymentMethod,
        amountReceived: received,
        changeDue,
        customerName: selectedCustomer?.fullName || null,
        date: new Date().toLocaleString('uz-UZ'),
        id: sale.id,
      });

      clearCart();
      setShowPaymentModal(false);
      setIsProcessing(false);
      showToast('Sotuv muvaffaqiyatli yakunlandi', 'success');
    }, 350);
  }, [
    canConfirmPayment, currentUser, completeSale, selectedCustomerId, selectedCustomer,
    cart, subtotal, discountTotal, total, paymentMethod, received, changeDue,
    clearCart, showToast,
  ]);

  return (
    <div className="pos-terminal">
      <div className="pos-layout">
        {/* PRODUCTS PANEL */}
        <div className="pos-products-panel">
          <div className="pos-search-row">
            <form onSubmit={handleBarcodeSubmit} className="pos-barcode-form">
              <input
                ref={barcodeRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Barcode skanerlash..."
                className="pos-barcode-input"
                autoComplete="off"
              />
            </form>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Mahsulot nomi bo'yicha qidirish..."
              className="pos-search-input"
            />
          </div>

          <div className="pos-categories">
            <button className={`pos-cat-chip ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setActiveCategory('all')}>
              Barchasi
            </button>
            {categories.map((cat) => (
              <button key={cat.id} className={`pos-cat-chip ${activeCategory === cat.id ? 'active' : ''}`} onClick={() => setActiveCategory(cat.id)}>
                {cat.name}
              </button>
            ))}
          </div>

          {filteredProducts.length === 0 ? (
            <EmptyState icon={'\u25A6'} title="Mahsulot topilmadi" description="Qidiruv so'zini o'zgartiring yoki boshqa kategoriya tanlang" />
          ) : (
            <div className="pos-product-grid">
              {filteredProducts.map((product) => {
                const lowStock = product.quantity <= product.minStock;
                const hasDiscount = !!(product.discountPrice && product.discountPrice > 0);
                const outOfStock = product.quantity <= 0;
                return (
                  <div
                    key={product.id}
                    className={`pos-product-card ${outOfStock ? 'out-of-stock' : ''}`}
                    onClick={() => !outOfStock && addToCart(product)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !outOfStock) addToCart(product); }}
                  >
                    {canManageProducts && (
                      <div className="pos-product-actions">
                        <button
                          className="pos-product-action-btn"
                          onClick={(e) => openEditProduct(product, e)}
                          title="Tahrirlash"
                          aria-label="Tahrirlash"
                        >
                          {'\u270E'}
                        </button>
                        <button
                          className="pos-product-action-btn pos-product-action-danger"
                          onClick={(e) => openDeleteProduct(product, e)}
                          title="O'chirish"
                          aria-label="O'chirish"
                        >
                          {'\u2715'}
                        </button>
                      </div>
                    )}
                    <div className="pos-product-image">
                      <span className="pos-product-placeholder">{product.name.charAt(0)}</span>
                      {lowStock && <span className="pos-stock-badge">{product.quantity} {product.unit}</span>}
                      {hasDiscount && <span className="pos-discount-badge">Aksiya</span>}
                    </div>
                    <div className="pos-product-info">
                      <span className="pos-product-name">{product.name}</span>
                      <div className="pos-product-price-row">
                        {hasDiscount ? (
                          <>
                            <span className="pos-price-old">{formatSum(product.sellingPrice)}</span>
                            <span className="pos-price-new">{formatSum(product.discountPrice!)}</span>
                          </>
                        ) : (
                          <span className="pos-price-new">{formatSum(product.sellingPrice)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CART PANEL */}
        <div className="pos-cart-panel">
          <div className="pos-cart-header">
            <h2>Savatcha</h2>
            {cart.length > 0 && (
              <button className="pos-clear-btn" onClick={() => setShowClearConfirm(true)}>Tozalash</button>
            )}
          </div>

          <div className="pos-customer-section">
            {selectedCustomer ? (
              <div className="pos-customer-selected">
                <div>
                  <strong>{selectedCustomer.fullName}</strong>
                  <span className="pos-customer-phone">{selectedCustomer.phone}</span>
                  {selectedCustomer.totalDebt > 0 && (
                    <span className="pos-customer-debt">Qarzi: {formatSum(selectedCustomer.totalDebt)}</span>
                  )}
                </div>
                <button onClick={() => { setSelectedCustomerId(null); setCustomerSearch(''); }}>Bekor qilish</button>
              </div>
            ) : (
              <div className="pos-customer-search-wrap">
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerList(true); }}
                  onFocus={() => setShowCustomerList(true)}
                  placeholder="Mijoz ismi yoki telefon (ixtiyoriy)"
                  className="pos-customer-input"
                />
                {showCustomerList && filteredCustomers.length > 0 && (
                  <div className="pos-customer-dropdown">
                    {filteredCustomers.map((c) => (
                      <button key={c.id} onClick={() => { setSelectedCustomerId(c.id); setShowCustomerList(false); setCustomerSearch(''); }}>
                        <strong>{c.fullName}</strong>
                        <span>{c.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pos-cart-items">
            {cart.length === 0 ? (
              <EmptyState icon={'\u25A4'} title="Savatcha bo'sh" description="Mahsulotlarni tanlang yoki barcode skanerlang" />
            ) : (
              cart.map((item) => (
                <div key={item.productId} className="pos-cart-item">
                  <div className="pos-cart-item-main">
                    <span className="pos-cart-item-name">{item.name}</span>
                    <button className="pos-cart-item-remove" onClick={() => removeFromCart(item.productId)} aria-label="O'chirish">×</button>
                  </div>
                  <div className="pos-cart-item-controls">
                    <div className="pos-qty-control">
                      <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}>−</button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.productId, parseFloat(e.target.value) || 0)}
                        min={0}
                        max={item.maxQuantity}
                      />
                      <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}>+</button>
                      <span className="pos-unit-label">{item.unit}</span>
                    </div>
                    <div className="pos-price-control">
                      <input
                        type="number"
                        value={item.appliedPrice}
                        onChange={(e) => updateLinePrice(item.productId, parseFloat(e.target.value) || 0)}
                        min={0}
                      />
                      {item.appliedPrice !== item.unitPrice && (
                        <span className="pos-price-original">{formatSum(item.unitPrice)}</span>
                      )}
                    </div>
                  </div>
                  <div className="pos-cart-item-total">{formatSum(calcLineTotal(item))}</div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="pos-discount-section">
              <div className="pos-discount-row">
                <select value={discountType} onChange={(e) => { setDiscountType(e.target.value as any); setDiscountValue(0); }} className="pos-discount-type">
                  <option value="none">Chegirma yo'q</option>
                  <option value="percent">Foiz (%)</option>
                  <option value="amount">Summa (so'm)</option>
                </select>
                {discountType !== 'none' && (
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder={discountType === 'percent' ? '0-100' : 'Summa'}
                    max={discountType === 'percent' ? 100 : undefined}
                    className="pos-discount-value"
                  />
                )}
              </div>
            </div>
          )}

          <div className="pos-totals">
            <div className="pos-totals-row"><span>Jami summa</span><span>{formatSum(subtotal)}</span></div>
            {discountTotal > 0 && (
              <div className="pos-totals-row pos-totals-discount"><span>Chegirma</span><span>−{formatSum(discountTotal)}</span></div>
            )}
            <div className="pos-totals-row pos-totals-final"><span>To'lov uchun</span><span>{formatSum(total)}</span></div>
          </div>

          <button className="pos-pay-btn" onClick={openPaymentModal} disabled={cart.length === 0}>
            To'lovni qabul qilish
          </button>
        </div>
      </div>

      {/* CLEAR CONFIRM */}
      {showClearConfirm && (
        <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
          <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Savatchani tozalash</h3>
            <p>Barcha mahsulotlar savatchadan olib tashlanadi. Davom etasizmi?</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowClearConfirm(false)}>Bekor qilish</button>
              <button className="btn btn-danger" onClick={clearCart}>Ha, tozalash</button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => !isProcessing && setShowPaymentModal(false)}>
          <div className="modal pos-payment-modal" onClick={(e) => e.stopPropagation()}>
            <h3>To'lov</h3>
            <div className="pos-payment-total">
              <span>To'lov uchun summa</span>
              <strong>{formatSum(total)}</strong>
            </div>

            <div className="pos-payment-methods">
              {(['cash', 'card', 'online', 'mixed'] as PaymentMethod[]).map((method) => (
                <button
                  key={method}
                  className={`pos-payment-method-btn ${paymentMethod === method ? 'active' : ''}`}
                  onClick={() => { setPaymentMethod(method); if (method !== 'mixed') setAmountReceived(total.toFixed(0)); }}
                  disabled={isProcessing}
                >
                  {method === 'cash' && 'Naqd'}
                  {method === 'card' && 'Karta'}
                  {method === 'online' && 'Onlayn'}
                  {method === 'mixed' && 'Aralash'}
                </button>
              ))}
            </div>

            {paymentMethod !== 'mixed' ? (
              <div className="pos-payment-amount-section">
                <label>Qabul qilingan summa</label>
                <input type="number" value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)} className="pos-payment-amount-input" disabled={isProcessing} />
                {paymentMethod === 'cash' && (
                  <div className="pos-quick-amounts">
                    {[total, Math.ceil(total / 10000) * 10000, Math.ceil(total / 50000) * 50000, Math.ceil(total / 100000) * 100000]
                      .filter((v, i, arr) => v >= total && arr.indexOf(v) === i)
                      .slice(0, 4)
                      .map((amt) => (
                        <button key={amt} onClick={() => setAmountReceived(amt.toFixed(0))} disabled={isProcessing}>{formatSum(amt)}</button>
                      ))}
                  </div>
                )}
                <div className="pos-change-row">
                  <span>{changeDue >= 0 ? 'Qaytim' : 'Qarzga yoziladi'}</span>
                  <strong className={changeDue < 0 ? 'pos-negative' : ''}>{formatSum(Math.abs(changeDue))}</strong>
                </div>
                {changeDue < 0 && (
                  <p className="pos-info-text">
                    {selectedCustomerId
                      ? (selectedCustomer?.fullName || 'Mijoz') + ' qarziga yoziladi'
                      : formatSum(Math.abs(changeDue)) + ' qarzga yoziladi'}
                  </p>
                )}
              </div>
            ) : (
              <div className="pos-mixed-section">
                <div className="pos-mixed-row">
                  <label>Naqd</label>
                  <input type="number" value={paymentSplit.cash} onChange={(e) => setPaymentSplit((s) => ({ ...s, cash: parseFloat(e.target.value) || 0 }))} disabled={isProcessing} />
                </div>
                <div className="pos-mixed-row">
                  <label>Karta</label>
                  <input type="number" value={paymentSplit.card} onChange={(e) => setPaymentSplit((s) => ({ ...s, card: parseFloat(e.target.value) || 0 }))} disabled={isProcessing} />
                </div>
                <div className="pos-mixed-row">
                  <label>Onlayn</label>
                  <input type="number" value={paymentSplit.online} onChange={(e) => setPaymentSplit((s) => ({ ...s, online: parseFloat(e.target.value) || 0 }))} disabled={isProcessing} />
                </div>
                <div className="pos-change-row">
                  <span>{changeDue >= 0 ? 'Qaytim' : 'Qarzga yoziladi'}</span>
                  <strong className={changeDue < 0 ? 'pos-negative' : ''}>{formatSum(Math.abs(changeDue))}</strong>
                </div>
                {changeDue < 0 && (
                  <p className="pos-info-text">
                    {selectedCustomerId
                      ? (selectedCustomer?.fullName || 'Mijoz') + ' qarziga yoziladi'
                      : formatSum(Math.abs(changeDue)) + ' qarzga yoziladi'}
                  </p>
                )}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowPaymentModal(false)} disabled={isProcessing}>Bekor qilish</button>
              <button className="btn btn-primary" onClick={handleConfirmPayment} disabled={!canConfirmPayment || isProcessing}>
                {isProcessing ? 'Saqlanmoqda...' : 'Tasdiqlash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {lastReceipt && (
        <div className="modal-overlay" onClick={() => setLastReceipt(null)}>
          <div className="modal pos-receipt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pos-receipt" id="pos-receipt-print">
              <h3>{settings.storeName}</h3>
              <p className="pos-receipt-address">{settings.address}<br />{settings.phone}</p>
              <div className="pos-receipt-meta">
                <span>Chek: #{lastReceipt.id.slice(-6)}</span>
                <span>{lastReceipt.date}</span>
                <span>Kassir: {currentUser?.name}</span>
                {lastReceipt.customerName && <span>Mijoz: {lastReceipt.customerName}</span>}
              </div>
              <div className="pos-receipt-items">
                {lastReceipt.items.map((item) => (
                  <div key={item.productId} className="pos-receipt-item">
                    <span>{item.name} × {item.quantity} {item.unit}</span>
                    <span>{formatSum(calcLineTotal(item))}</span>
                  </div>
                ))}
              </div>
              <div className="pos-receipt-totals">
                <div><span>Jami</span><span>{formatSum(lastReceipt.subtotal)}</span></div>
                {lastReceipt.discountTotal > 0 && (
                  <div><span>Chegirma</span><span>−{formatSum(lastReceipt.discountTotal)}</span></div>
                )}
                <div className="pos-receipt-total-final"><span>To'lov</span><span>{formatSum(lastReceipt.total)}</span></div>
                <div>
                  <span>To'lov turi</span>
                  <span>
                    {lastReceipt.paymentMethod === 'cash' && 'Naqd'}
                    {lastReceipt.paymentMethod === 'card' && 'Karta'}
                    {lastReceipt.paymentMethod === 'online' && 'Onlayn'}
                    {lastReceipt.paymentMethod === 'mixed' && 'Aralash'}
                  </span>
                </div>
                {lastReceipt.changeDue > 0 && (
                  <div><span>Qaytim</span><span>{formatSum(lastReceipt.changeDue)}</span></div>
                )}
              </div>
              <p className="pos-receipt-footer">{settings.receiptFooter}</p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setLastReceipt(null)}>Yopish</button>
              <button className="btn btn-primary" onClick={() => window.print()}>Chop etish</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {editProductTarget && (
        <Modal title="Mahsulotni tahrirlash" onClose={() => setEditProductTarget(null)} width={560}>
          <form onSubmit={handleEditProductSubmit} className="form-grid">
            <div className="form-group form-span-2">
              <label>Mahsulot nomi *</label>
              <input type="text" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} required />
            </div>

            <div className="form-group">
              <label>Barcode</label>
              <input type="text" value={editForm.barcode} onChange={(e) => setEditForm((f) => ({ ...f, barcode: e.target.value }))} />
            </div>

            <div className="form-group">
              <label>O'lchov birligi</label>
              <select value={editForm.unit} onChange={(e) => setEditForm((f) => ({ ...f, unit: e.target.value }))}>
                {['dona', 'kg', 'litr', 'metr', 'paket', 'quti'].map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Kategoriya</label>
              <select value={editForm.categoryId} onChange={(e) => setEditForm((f) => ({ ...f, categoryId: e.target.value }))}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Ta'minotchi</label>
              <select value={editForm.supplierId} onChange={(e) => setEditForm((f) => ({ ...f, supplierId: e.target.value }))}>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Kelish narxi (so'm)</label>
              <input type="number" value={editForm.purchasePrice} onChange={(e) => setEditForm((f) => ({ ...f, purchasePrice: e.target.value }))} min="0" />
            </div>

            <div className="form-group">
              <label>Sotish narxi (so'm) *</label>
              <input type="number" value={editForm.sellingPrice} onChange={(e) => setEditForm((f) => ({ ...f, sellingPrice: e.target.value }))} min="0" required />
            </div>

            <div className="form-group">
              <label>Aksiya narxi (ixtiyoriy)</label>
              <input type="number" value={editForm.discountPrice} onChange={(e) => setEditForm((f) => ({ ...f, discountPrice: e.target.value }))} min="0" />
            </div>

            <div className="form-group">
              <label>Mavjud miqdor</label>
              <input type="number" value={editForm.quantity} onChange={(e) => setEditForm((f) => ({ ...f, quantity: e.target.value }))} min="0" />
            </div>

            <div className="form-group">
              <label>Minimal qoldiq</label>
              <input type="number" value={editForm.minStock} onChange={(e) => setEditForm((f) => ({ ...f, minStock: e.target.value }))} min="0" />
            </div>

            <div className="modal-actions form-span-2">
              <button type="button" className="btn btn-secondary" onClick={() => setEditProductTarget(null)}>Bekor qilish</button>
              <button type="submit" className="btn btn-primary">Saqlash</button>
            </div>
          </form>
        </Modal>
      )}

      {/* DELETE PRODUCT CONFIRM */}
      {deleteProductTarget && (
        <ConfirmDialog
          title="Mahsulotni o'chirish"
          message={`"${deleteProductTarget.name}" mahsulotini o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi.`}
          onConfirm={handleDeleteProduct}
          onCancel={() => setDeleteProductTarget(null)}
          danger
        />
      )}
    </div>
  );
}
