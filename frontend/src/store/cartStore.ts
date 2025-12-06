import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  storeId: number;
  image_url: string;
}

interface CartState {
  items: CartItem[];
  storeId: number | null; // To ensure cart only contains items from one store
  addItem: (item: CartItem) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      storeId: null,
      addItem: (item) => {
        const currentItems = get().items;
        const currentStoreId = get().storeId;

        // Check if cart is empty or item is from the same store
        if (currentItems.length > 0 && currentStoreId !== item.storeId) {
           // Logic to handle cross-store conflict is usually UI handled, 
           // but here we enforce strict replacement or rejection.
           // For now, we'll assume the UI handles the confirmation to clear cart.
           // Here we will strictly replace if store is different for simplicity of this method,
           // or we could throw an error. Let's replace for now as a simple "new session"
           set({ items: [item], storeId: item.storeId });
           return;
        }

        const existingItem = currentItems.find((i) => i.productId === item.productId);

        if (existingItem) {
          set({
            items: currentItems.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
            storeId: item.storeId,
          });
        } else {
          set({ items: [...currentItems, item], storeId: item.storeId });
        }
      },
      removeItem: (productId) => {
        set((state) => {
          const newItems = state.items.filter((i) => i.productId !== productId);
          return {
            items: newItems,
            storeId: newItems.length === 0 ? null : state.storeId,
          };
        });
      },
      updateQuantity: (productId, quantity) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        }));
      },
      clearCart: () => set({ items: [], storeId: null }),
    }),
    {
      name: 'cart-storage',
    }
  )
);
