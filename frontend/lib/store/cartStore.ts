'use client';

import { create } from 'zustand';

interface CartState {
  itemCount: number;
  setItemCount: (count: number) => void;
  incrementCount: () => void;
  decrementCount: () => void;
  resetCount: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  itemCount: 0,
  setItemCount: (count) => set({ itemCount: count }),
  incrementCount: () => set((s) => ({ itemCount: s.itemCount + 1 })),
  decrementCount: () => set((s) => ({ itemCount: Math.max(0, s.itemCount - 1) })),
  resetCount: () => set({ itemCount: 0 }),
}));
