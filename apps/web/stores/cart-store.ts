import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  name: string;
  unitPrice: number;
  imageUrl: string | null;
  qty: number;
}

interface CartStore {
  items: CartItem[];
  add: (product: Omit<CartItem, 'qty'>, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  totalQty: () => number;
  subtotal: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      add: (product, qty = 1) => {
        const existing = get().items.find(
          (i) => i.productId === product.productId,
        );
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.productId === product.productId
                ? { ...i, qty: i.qty + qty }
                : i,
            ),
          });
        } else {
          set({ items: [...get().items, { ...product, qty }] });
        }
      },
      setQty: (productId, qty) => {
        if (qty <= 0) {
          set({ items: get().items.filter((i) => i.productId !== productId) });
          return;
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, qty } : i,
          ),
        });
      },
      remove: (productId) =>
        set({ items: get().items.filter((i) => i.productId !== productId) }),
      clear: () => set({ items: [] }),
      totalQty: () => get().items.reduce((s, i) => s + i.qty, 0),
      subtotal: () => get().items.reduce((s, i) => s + i.qty * i.unitPrice, 0),
    }),
    {
      name: 'coffee-cart',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
