'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { maxCartProducts, maxCartQuantity, readSavedCart } from './cart-data';

export type CartBranch = {
  id: string;
  name: string;
  slug: string;
};

export type CartItem = {
  productId: string;
  name: string;
  unitPrice: string;
  quantity: number;
};

type CartState = {
  branch: CartBranch | null;
  items: CartItem[];
  addItem: (branch: CartBranch, item: Omit<CartItem, 'quantity'>) => boolean;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      branch: null,
      items: [],
      addItem: (branch, item) => {
        let added = false;

        set((state) => {
          if (state.branch && state.branch.id !== branch.id) {
            return state;
          }

          added = true;
          const existingItem = state.items.find(
            (currentItem) => currentItem.productId === item.productId
          );

          if (existingItem) {
            if (existingItem.quantity >= maxCartQuantity) {
              added = false;
              return state;
            }
            return {
              ...state,
              items: state.items.map((currentItem) =>
                currentItem.productId === item.productId
                  ? { ...currentItem, quantity: currentItem.quantity + 1 }
                  : currentItem
              )
            };
          }

          if (state.items.length >= maxCartProducts) {
            added = false;
            return state;
          }

          return {
            branch,
            items: [...state.items, { ...item, quantity: 1 }]
          };
        });

        return added;
      },
      setQuantity: (productId, quantity) => {
        if (!Number.isInteger(quantity) || quantity > maxCartQuantity) return;
        set((state) => {
          if (quantity <= 0) {
            const items = state.items.filter((item) => item.productId !== productId);
            return { items, branch: items.length === 0 ? null : state.branch };
          }

          return {
            items: state.items.map((item) =>
              item.productId === productId ? { ...item, quantity } : item
            )
          };
        });
      },
      removeItem: (productId) => {
        set((state) => {
          const items = state.items.filter((item) => item.productId !== productId);
          return { items, branch: items.length === 0 ? null : state.branch };
        });
      },
      clear: () => set({ branch: null, items: [] })
    }),
    {
      name: 'brasa-viva-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ branch: state.branch, items: state.items }),
      merge: (persisted, current) => ({ ...current, ...readSavedCart(persisted) })
    }
  )
);
