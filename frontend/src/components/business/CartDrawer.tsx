import { useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { orderService } from '@/services/orderService';
import { X, ShoppingBag, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer = ({ isOpen, onClose }: CartDrawerProps) => {
  const { items, storeId, removeItem, updateQuantity, clearCart } = useCartStore();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Initialize pickupTime to current time + 1 hour for a reasonable default
  const defaultPickupTime = new Date();
  defaultPickupTime.setHours(defaultPickupTime.getHours() + 1);
  const [pickupTime, setPickupTime] = useState(defaultPickupTime.toISOString().slice(0, 16)); // YYYY-MM-DDTHH:MM format for datetime-local input

  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || items.length === 0) return;

    setIsSubmitting(true);
    try {
      const payload = {
        store_id: storeId,
        customer_name: customerName,
        customer_phone: customerPhone,
        pickup_time: new Date(pickupTime).toISOString(), // Ensure ISO string for backend
        items: items.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
        })),
      };

      const res = await orderService.createOrder(payload);
      if (res.success) {
        clearCart();
        onClose();
        navigate(`/order-status/${res.data.order_code}`);
      }
    } catch (error) {
      console.error('Checkout failed', error);
      alert(t.failedToProcessOrder);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      <div className="absolute inset-y-0 right-0 max-w-md w-full flex">
        <div className="h-full w-full bg-white shadow-xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-6 bg-gray-50 border-b">
            <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              {t.cartTitle}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
                <ShoppingBag className="w-12 h-12 opacity-20" />
                <p>{t.emptyCart}</p>
                <button onClick={onClose} className="text-blue-600 font-medium hover:text-blue-700">
                  {t.startShopping}
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {items.map((item) => (
                  <li key={item.productId} className="py-4 flex gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                         // Note: Ensure getImageUrl logic is applied if needed, but store usually has full or relative URL.
                         // Assuming relative needs helper or handled before store. 
                         // Ideally cart item stores resolved URL or handle it here.
                         // For simplicity assuming image_url works or we use a simple img tag.
                         <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">{t.noImage}</div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-base font-medium text-gray-900">{item.name}</h3>
                        <p className="text-blue-600 font-medium">Rp {item.price.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border rounded-lg">
                          <button 
                            onClick={() => item.quantity > 1 ? updateQuantity(item.productId, item.quantity - 1) : removeItem(item.productId)}
                            className="px-2 py-1 text-gray-600 hover:bg-gray-50"
                          >
                            -
                          </button>
                          <span className="px-2 text-sm font-medium">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="px-2 py-1 text-gray-600 hover:bg-gray-50"
                          >
                            +
                          </button>
                        </div>
                        <button 
                          onClick={() => removeItem(item.productId)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer / Checkout Form */}
          {items.length > 0 && (
            <div className="border-t bg-gray-50 p-4 space-y-4">
              <div className="flex justify-between text-base font-medium text-gray-900">
                <p>{t.total}</p>
                <p>Rp {total.toLocaleString()}</p>
              </div>

              <form onSubmit={handleCheckout} className="space-y-3">
                <div>
                  <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">{t.fullName}</label>
                  <input 
                    type="text" 
                    id="customerName"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 border shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder={t.yourNamePlaceholder}
                  />
                </div>
                <div>
                  <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700">{t.whatsappNumber}</label>
                  <input 
                    type="tel" 
                    id="customerPhone"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 border shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder={t.phonePlaceholder}
                  />
                </div>
                <div>
                  <label htmlFor="pickupTime" className="block text-sm font-medium text-gray-700">Pickup Time</label>
                  <input
                    type="datetime-local"
                    id="pickupTime"
                    required
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 border shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? t.processing : t.sendOrder}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
