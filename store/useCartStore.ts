import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
    id: string | number;
    name: string;
    price: number;
    image: string;
    quantity: number;
    slug: string;
    category?: string;
}

interface CartState {
    isOpen: boolean;
    items: CartItem[];
    openCart: () => void;
    closeCart: () => void;
    addItem: (item: CartItem) => void;
    removeItem: (id: string | number) => void;
    updateQuantity: (id: string | number, quantity: number) => void;
    clearCart: () => void;
    totalItems: () => number;
    totalAmount: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            isOpen: false,
            items: [],
            openCart: () => set({ isOpen: true }),
            closeCart: () => set({ isOpen: false }),
            addItem: (item) => {
                const items = get().items;
                const existingItem = items.find((i) =>
                    (i.id && item.id && String(i.id) === String(item.id)) ||
                    (i.slug && item.slug && i.slug === item.slug)
                );

                if (existingItem) {
                    // Do nothing or just notify that it's already in cart
                    return;
                } else {
                    if (!item.id) {
                        console.error('❌ CartStore Warning: Adding item without ID!', item);
                    }
                    set({ items: [...items, { ...item, quantity: 1 }] });
                }
            },
            removeItem: (id) => {
                set({ items: get().items.filter((i) => i.id !== id) });
            },
            updateQuantity: (id, quantity) => {
                if (quantity < 1) return;
                set({
                    items: get().items.map((i) =>
                        i.id === id ? { ...i, quantity } : i
                    ),
                });
            },
            clearCart: () => set({ items: [] }),
            totalItems: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
            totalAmount: () => get().items.reduce((acc, item) => acc + (item.price * item.quantity), 0),
        }),
        {
            name: 'cart-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
