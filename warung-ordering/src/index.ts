import React, { useState, useEffect } from 'react';

// Mock data based on the database schema
const mockOutlet = {
  id: 1,
  outlet_name: "Warung Bu Sari",
  address: "Jl. Mawar No. 15, Makassar",
  status: 1
};

const mockProducts = [
  { id: 1, outlet_id: 1, product_name: "Nasi Goreng Spesial", price: 25000, status: 1, stock: 50, category: "Makanan", image: "🍛" },
  { id: 2, outlet_id: 1, product_name: "Mie Goreng Ayam", price: 22000, status: 1, stock: 45, category: "Makanan", image: "🍜" },
  { id: 3, outlet_id: 1, product_name: "Ayam Goreng Crispy", price: 18000, status: 1, stock: 30, category: "Makanan", image: "🍗" },
  { id: 4, outlet_id: 1, product_name: "Es Teh Manis", price: 5000, status: 1, stock: 100, category: "Minuman", image: "🧋" },
  { id: 5, outlet_id: 1, product_name: "Es Jeruk Segar", price: 7000, status: 1, stock: 80, category: "Minuman", image: "🍊" },
  { id: 6, outlet_id: 1, product_name: "Kopi Susu", price: 12000, status: 1, stock: 60, category: "Minuman", image: "☕" },
  { id: 7, outlet_id: 1, product_name: "Sate Ayam (10 tusuk)", price: 30000, status: 1, stock: 25, category: "Makanan", image: "🍢" },
  { id: 8, outlet_id: 1, product_name: "Bakso Spesial", price: 20000, status: 1, stock: 35, category: "Makanan", image: "🍲" },
  { id: 9, outlet_id: 1, product_name: "Soto Ayam", price: 18000, status: 1, stock: 40, category: "Makanan", image: "🥣" },
  { id: 10, outlet_id: 1, product_name: "Jus Alpukat", price: 15000, status: 1, stock: 30, category: "Minuman", image: "🥤" },
  { id: 11, outlet_id: 1, product_name: "Kerupuk Udang", price: 8000, status: 1, stock: 50, category: "Snack", image: "🦐" },
  { id: 12, outlet_id: 1, product_name: "Pisang Goreng (5 pcs)", price: 10000, status: 1, stock: 40, category: "Snack", image: "🍌" },
];

// Format currency to Indonesian Rupiah
const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(number);
};

// Generate pickup time slots
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 8; hour <= 20; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < 20) {
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }
  return slots;
};

// Toast notification component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast ${type}`}>
      <span>{type === 'success' ? '✓' : 'ℹ'}</span>
      <p>{message}</p>
    </div>
  );
};

// Product Card Component
const ProductCard = ({ product, onAddToCart }) => {
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    setIsAdding(true);
    onAddToCart(product);
    setTimeout(() => setIsAdding(false), 300);
  };

  return (
    <div className={`product-card ${isAdding ? 'adding' : ''}`}>
      <div className="product-emoji">{product.image}</div>
      <div className="product-info">
        <h3 className="product-name">{product.product_name}</h3>
        <p className="product-price">{formatRupiah(product.price)}</p>
        <p className="product-stock">Stok: {product.stock}</p>
      </div>
      <button 
        className="add-to-cart-btn"
        onClick={handleAdd}
        disabled={product.stock === 0}
      >
        {product.stock === 0 ? 'Habis' : '+ Tambah'}
      </button>
    </div>
  );
};

// Cart Item Component
const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  return (
    <div className="cart-item">
      <div className="cart-item-left">
        <span className="cart-item-emoji">{item.image}</span>
        <div className="cart-item-info">
          <p className="cart-item-name">{item.product_name}</p>
          <p className="cart-item-price">{formatRupiah(item.price)}</p>
        </div>
      </div>
      <div className="cart-item-right">
        <div className="quantity-controls">
          <button 
            className="qty-btn"
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
          >
            −
          </button>
          <span className="qty-value">{item.quantity}</span>
          <button 
            className="qty-btn"
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            disabled={item.quantity >= item.stock}
          >
            +
          </button>
        </div>
        <p className="cart-item-subtotal">{formatRupiah(item.price * item.quantity)}</p>
        <button className="remove-btn" onClick={() => onRemove(item.id)}>
          ✕
        </button>
      </div>
    </div>
  );
};

// Main App Component
export default function App() {
  const [cart, setCart] = useState([]);
  const [currentPage, setCurrentPage] = useState('showcase');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [toast, setToast] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const categories = ['Semua', 'Makanan', 'Minuman', 'Snack'];
  const timeSlots = generateTimeSlots();

  // Filter products
  const filteredProducts = mockProducts.filter(product => {
    const matchesCategory = selectedCategory === 'Semua' || product.category === selectedCategory;
    const matchesSearch = product.product_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && product.status === 1;
  });

  // Cart functions
  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          setToast({ message: 'Stok tidak mencukupi', type: 'info' });
          return prevCart;
        }
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    setToast({ message: `${product.product_name} ditambahkan ke keranjang`, type: 'success' });
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
    setToast({ message: 'Item dihapus dari keranjang', type: 'info' });
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Handle order submission
  const handleSubmitOrder = () => {
    if (!customerName.trim()) {
      setToast({ message: 'Mohon isi nama Anda', type: 'info' });
      return;
    }
    if (!customerPhone.trim()) {
      setToast({ message: 'Mohon isi nomor WhatsApp Anda', type: 'info' });
      return;
    }
    if (!pickupTime) {
      setToast({ message: 'Mohon pilih jam pengambilan', type: 'info' });
      return;
    }

    // Generate order number
    const newOrderNumber = `ORD-${Date.now().toString().slice(-8)}`;
    setOrderNumber(newOrderNumber);
    setOrderSuccess(true);
  };

  // Generate WhatsApp message
  const generateWhatsAppMessage = () => {
    let message = `🛒 *PESANAN BARU*\n`;
    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `📋 No. Pesanan: ${orderNumber}\n`;
    message += `👤 Nama: ${customerName}\n`;
    message += `📱 No. HP: ${customerPhone}\n`;
    message += `⏰ Jam Ambil: ${pickupTime}\n`;
    message += `━━━━━━━━━━━━━━━━━━\n\n`;
    message += `*Detail Pesanan:*\n`;
    
    cart.forEach((item, index) => {
      message += `${index + 1}. ${item.product_name}\n`;
      message += `   ${item.quantity} x ${formatRupiah(item.price)} = ${formatRupiah(item.price * item.quantity)}\n`;
    });
    
    message += `\n━━━━━━━━━━━━━━━━━━\n`;
    message += `*TOTAL: ${formatRupiah(cartTotal)}*\n`;
    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `\nTerima kasih! 🙏`;
    
    return encodeURIComponent(message);
  };

  const openWhatsApp = () => {
    const phone = "6281234567890"; // Replace with actual store phone
    const message = generateWhatsAppMessage();
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const resetOrder = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setPickupTime('');
    setOrderSuccess(false);
    setOrderNumber('');
    setCurrentPage('showcase');
  };

  return (
    <div className="app-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        :root {
          --primary: #E85D4C;
          --primary-light: #FF8A7A;
          --primary-dark: #C94434;
          --secondary: #4CAF50;
          --background: #FFF8F5;
          --card-bg: #FFFFFF;
          --text-primary: #3D3D3D;
          --text-secondary: #6B6B6B;
          --text-light: #9B9B9B;
          --border: #F0E6E3;
          --shadow: 0 4px 20px rgba(232, 93, 76, 0.08);
          --shadow-hover: 0 8px 30px rgba(232, 93, 76, 0.15);
          --radius: 16px;
          --radius-sm: 10px;
        }
        
        body {
          font-family: 'Nunito', sans-serif;
          background: var(--background);
          color: var(--text-primary);
          line-height: 1.6;
        }
        
        .app-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #FFF8F5 0%, #FFF0EB 100%);
        }
        
        /* Header */
        .header {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
          padding: 20px 24px;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 4px 20px rgba(232, 93, 76, 0.2);
        }
        
        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .store-info {
          color: white;
        }
        
        .store-name {
          font-size: 24px;
          font-weight: 800;
          margin-bottom: 2px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .store-address {
          font-size: 14px;
          opacity: 0.9;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .cart-button {
          background: white;
          border: none;
          padding: 14px 24px;
          border-radius: 50px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: 'Nunito', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: var(--primary);
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
        }
        
        .cart-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        }
        
        .cart-icon {
          font-size: 22px;
        }
        
        .cart-badge {
          background: var(--primary);
          color: white;
          padding: 2px 10px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 700;
          min-width: 28px;
          text-align: center;
        }
        
        /* Search and Filter Section */
        .filter-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
        }
        
        .search-box {
          position: relative;
          margin-bottom: 20px;
        }
        
        .search-input {
          width: 100%;
          padding: 18px 24px 18px 54px;
          border: 2px solid var(--border);
          border-radius: var(--radius);
          font-size: 17px;
          font-family: 'Nunito', sans-serif;
          background: white;
          transition: all 0.3s ease;
          box-shadow: var(--shadow);
        }
        
        .search-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(232, 93, 76, 0.1);
        }
        
        .search-icon {
          position: absolute;
          left: 20px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 20px;
          color: var(--text-light);
        }
        
        .category-tabs {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 8px;
          -webkit-overflow-scrolling: touch;
        }
        
        .category-tab {
          padding: 14px 28px;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 700;
          font-family: 'Nunito', sans-serif;
          white-space: nowrap;
          transition: all 0.3s ease;
          background: white;
          color: var(--text-secondary);
          box-shadow: var(--shadow);
        }
        
        .category-tab:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-hover);
        }
        
        .category-tab.active {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
          color: white;
        }
        
        /* Products Grid */
        .products-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px 100px;
        }
        
        .section-title {
          font-size: 22px;
          font-weight: 800;
          margin-bottom: 20px;
          color: var(--text-primary);
        }
        
        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        
        .product-card {
          background: white;
          border-radius: var(--radius);
          padding: 24px;
          box-shadow: var(--shadow);
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-hover);
        }
        
        .product-card.adding {
          animation: pulse 0.3s ease;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(0.97); }
        }
        
        .product-emoji {
          font-size: 56px;
          text-align: center;
          padding: 16px;
          background: linear-gradient(135deg, #FFF5F3 0%, #FFEAE6 100%);
          border-radius: var(--radius-sm);
        }
        
        .product-info {
          flex: 1;
        }
        
        .product-name {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 8px;
        }
        
        .product-price {
          font-size: 20px;
          font-weight: 800;
          color: var(--primary);
          margin-bottom: 4px;
        }
        
        .product-stock {
          font-size: 14px;
          color: var(--text-light);
        }
        
        .add-to-cart-btn {
          width: 100%;
          padding: 16px;
          border: none;
          border-radius: var(--radius-sm);
          font-size: 17px;
          font-weight: 700;
          font-family: 'Nunito', sans-serif;
          cursor: pointer;
          transition: all 0.3s ease;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
          color: white;
        }
        
        .add-to-cart-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(232, 93, 76, 0.3);
        }
        
        .add-to-cart-btn:disabled {
          background: #E0E0E0;
          color: #9B9B9B;
          cursor: not-allowed;
        }
        
        /* Cart Page */
        .cart-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 24px;
          padding-bottom: 200px;
        }
        
        .back-button {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: none;
          border: none;
          font-size: 17px;
          font-weight: 600;
          color: var(--primary);
          cursor: pointer;
          font-family: 'Nunito', sans-serif;
          padding: 12px 0;
          margin-bottom: 20px;
          transition: all 0.3s ease;
        }
        
        .back-button:hover {
          gap: 14px;
        }
        
        .cart-empty {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: var(--radius);
          box-shadow: var(--shadow);
        }
        
        .cart-empty-icon {
          font-size: 80px;
          margin-bottom: 20px;
        }
        
        .cart-empty-text {
          font-size: 20px;
          color: var(--text-secondary);
          margin-bottom: 24px;
        }
        
        .shop-now-btn {
          display: inline-block;
          padding: 16px 36px;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
          color: white;
          text-decoration: none;
          border-radius: 50px;
          font-weight: 700;
          font-size: 17px;
          border: none;
          cursor: pointer;
          font-family: 'Nunito', sans-serif;
          transition: all 0.3s ease;
        }
        
        .shop-now-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(232, 93, 76, 0.3);
        }
        
        .cart-items-container {
          background: white;
          border-radius: var(--radius);
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: var(--shadow);
        }
        
        .cart-header {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 2px solid var(--border);
        }
        
        .cart-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
          border-bottom: 1px solid var(--border);
          gap: 16px;
        }
        
        .cart-item:last-child {
          border-bottom: none;
        }
        
        .cart-item-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
        }
        
        .cart-item-emoji {
          font-size: 40px;
          background: linear-gradient(135deg, #FFF5F3 0%, #FFEAE6 100%);
          padding: 10px;
          border-radius: var(--radius-sm);
        }
        
        .cart-item-info {
          flex: 1;
        }
        
        .cart-item-name {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        
        .cart-item-price {
          font-size: 14px;
          color: var(--text-secondary);
        }
        
        .cart-item-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .quantity-controls {
          display: flex;
          align-items: center;
          gap: 0;
          background: var(--background);
          border-radius: 50px;
          padding: 4px;
        }
        
        .qty-btn {
          width: 40px;
          height: 40px;
          border: none;
          background: white;
          border-radius: 50%;
          font-size: 20px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          color: var(--primary);
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .qty-btn:hover:not(:disabled) {
          background: var(--primary);
          color: white;
        }
        
        .qty-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .qty-value {
          width: 44px;
          text-align: center;
          font-size: 18px;
          font-weight: 700;
        }
        
        .cart-item-subtotal {
          font-size: 16px;
          font-weight: 700;
          color: var(--primary);
          min-width: 100px;
          text-align: right;
        }
        
        .remove-btn {
          width: 36px;
          height: 36px;
          border: none;
          background: #FFEBEB;
          color: #E53935;
          border-radius: 50%;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s ease;
        }
        
        .remove-btn:hover {
          background: #E53935;
          color: white;
        }
        
        /* Customer Form */
        .customer-form {
          background: white;
          border-radius: var(--radius);
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: var(--shadow);
        }
        
        .form-title {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-label {
          display: block;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 10px;
          color: var(--text-primary);
        }
        
        .form-input {
          width: 100%;
          padding: 16px 20px;
          border: 2px solid var(--border);
          border-radius: var(--radius-sm);
          font-size: 17px;
          font-family: 'Nunito', sans-serif;
          transition: all 0.3s ease;
        }
        
        .form-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(232, 93, 76, 0.1);
        }
        
        .form-select {
          width: 100%;
          padding: 16px 20px;
          border: 2px solid var(--border);
          border-radius: var(--radius-sm);
          font-size: 17px;
          font-family: 'Nunito', sans-serif;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236B6B6B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 16px center;
        }
        
        .form-select:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(232, 93, 76, 0.1);
        }
        
        /* Order Summary Fixed Bottom */
        .order-summary-fixed {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: white;
          padding: 20px 24px;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
          z-index: 100;
        }
        
        .order-summary-content {
          max-width: 800px;
          margin: 0 auto;
        }
        
        .order-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .order-total-label {
          font-size: 18px;
          color: var(--text-secondary);
        }
        
        .order-total-value {
          font-size: 26px;
          font-weight: 800;
          color: var(--primary);
        }
        
        .checkout-btn {
          width: 100%;
          padding: 18px;
          border: none;
          border-radius: var(--radius-sm);
          font-size: 18px;
          font-weight: 700;
          font-family: 'Nunito', sans-serif;
          cursor: pointer;
          transition: all 0.3s ease;
          background: linear-gradient(135deg, var(--secondary) 0%, #66BB6A 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        
        .checkout-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(76, 175, 80, 0.3);
        }
        
        .checkout-btn:disabled {
          background: #E0E0E0;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        /* Success Page */
        .success-page {
          max-width: 600px;
          margin: 0 auto;
          padding: 24px;
          text-align: center;
        }
        
        .success-card {
          background: white;
          border-radius: var(--radius);
          padding: 40px;
          box-shadow: var(--shadow);
        }
        
        .success-icon {
          width: 100px;
          height: 100px;
          background: linear-gradient(135deg, var(--secondary) 0%, #66BB6A 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 50px;
          margin: 0 auto 24px;
          animation: scaleIn 0.5s ease;
        }
        
        @keyframes scaleIn {
          0% { transform: scale(0); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
        .success-title {
          font-size: 28px;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 12px;
        }
        
        .success-subtitle {
          font-size: 18px;
          color: var(--text-secondary);
          margin-bottom: 24px;
        }
        
        .order-number {
          background: var(--background);
          padding: 16px;
          border-radius: var(--radius-sm);
          margin-bottom: 24px;
        }
        
        .order-number-label {
          font-size: 14px;
          color: var(--text-light);
          margin-bottom: 4px;
        }
        
        .order-number-value {
          font-size: 24px;
          font-weight: 800;
          color: var(--primary);
        }
        
        .whatsapp-btn {
          width: 100%;
          padding: 18px;
          border: none;
          border-radius: var(--radius-sm);
          font-size: 18px;
          font-weight: 700;
          font-family: 'Nunito', sans-serif;
          cursor: pointer;
          transition: all 0.3s ease;
          background: #25D366;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        
        .whatsapp-btn:hover {
          background: #128C7E;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(37, 211, 102, 0.3);
        }
        
        .new-order-btn {
          width: 100%;
          padding: 18px;
          border: 2px solid var(--border);
          border-radius: var(--radius-sm);
          font-size: 18px;
          font-weight: 700;
          font-family: 'Nunito', sans-serif;
          cursor: pointer;
          transition: all 0.3s ease;
          background: white;
          color: var(--text-primary);
        }
        
        .new-order-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
        }
        
        /* Toast */
        .toast {
          position: fixed;
          bottom: 100px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--text-primary);
          color: white;
          padding: 16px 28px;
          border-radius: 50px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 600;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
          z-index: 1000;
          animation: slideUp 0.3s ease;
        }
        
        .toast.success {
          background: var(--secondary);
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .header-content {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }
          
          .products-grid {
            grid-template-columns: 1fr;
          }
          
          .cart-item {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .cart-item-right {
            width: 100%;
            justify-content: space-between;
          }
          
          .cart-item-subtotal {
            min-width: auto;
          }
        }
      `}</style>

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="store-info">
            <h1 className="store-name">{mockOutlet.outlet_name}</h1>
            <p className="store-address">
              📍 {mockOutlet.address}
            </p>
          </div>
          <button 
            className="cart-button"
            onClick={() => setCurrentPage('cart')}
          >
            <span className="cart-icon">🛒</span>
            <span>Keranjang</span>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
      </header>

      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Showcase Page */}
      {currentPage === 'showcase' && (
        <>
          <div className="filter-section">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Cari menu favorit Anda..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="category-tabs">
              {categories.map(category => (
                <button
                  key={category}
                  className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="products-section">
            <h2 className="section-title">
              {selectedCategory === 'Semua' ? 'Semua Menu' : selectedCategory} 
              {` (${filteredProducts.length})`}
            </h2>
            <div className="products-grid">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addToCart}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Cart Page */}
      {currentPage === 'cart' && !orderSuccess && (
        <div className="cart-page">
          <button className="back-button" onClick={() => setCurrentPage('showcase')}>
            ← Kembali ke Menu
          </button>

          {cart.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty-icon">🛒</div>
              <p className="cart-empty-text">Keranjang Anda masih kosong</p>
              <button className="shop-now-btn" onClick={() => setCurrentPage('showcase')}>
                Mulai Belanja
              </button>
            </div>
          ) : (
            <>
              <div className="cart-items-container">
                <h2 className="cart-header">🛒 Keranjang Belanja ({cartCount} item)</h2>
                {cart.map(item => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeFromCart}
                  />
                ))}
              </div>

              <div className="customer-form">
                <h2 className="form-title">📝 Data Pemesan</h2>
                <div className="form-group">
                  <label className="form-label">Nama Lengkap</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Ibu Siti"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nomor WhatsApp</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="Contoh: 081234567890"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Jam Pengambilan</label>
                  <select
                    className="form-select"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                  >
                    <option value="">Pilih jam pengambilan...</option>
                    {timeSlots.map(slot => (
                      <option key={slot} value={slot}>{slot} WIB</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="order-summary-fixed">
                <div className="order-summary-content">
                  <div className="order-total-row">
                    <span className="order-total-label">Total Pembayaran</span>
                    <span className="order-total-value">{formatRupiah(cartTotal)}</span>
                  </div>
                  <button 
                    className="checkout-btn"
                    onClick={handleSubmitOrder}
                    disabled={cart.length === 0}
                  >
                    ✓ Konfirmasi Pesanan
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Order Success Page */}
      {currentPage === 'cart' && orderSuccess && (
        <div className="success-page">
          <div className="success-card">
            <div className="success-icon">✓</div>
            <h1 className="success-title">Pesanan Berhasil!</h1>
            <p className="success-subtitle">
              Terima kasih, {customerName}. Silakan konfirmasi pesanan Anda via WhatsApp.
            </p>
            
            <div className="order-number">
              <p className="order-number-label">Nomor Pesanan</p>
              <p className="order-number-value">{orderNumber}</p>
            </div>

            <button className="whatsapp-btn" onClick={openWhatsApp}>
              <span style={{ fontSize: '24px' }}>📱</span>
              Kirim via WhatsApp
            </button>
            
            <button className="new-order-btn" onClick={resetOrder}>
              Buat Pesanan Baru
            </button>
          </div>
        </div>
      )}
    </div>
  );
}