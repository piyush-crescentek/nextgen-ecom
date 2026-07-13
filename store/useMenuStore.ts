import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';


export interface Product {
    id: number;
    name: string;
    slug: string;
}

export interface Subcategory {
    id: number;
    name: string;
    slug: string;
    products: Product[];
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    type?: string;
    order: number;
    subcategories: Subcategory[];
    products: Product[];
}

interface MenuState {
    menuData: Category[];
    isLoading: boolean;
    error: string | null;
    fetchMenu: () => Promise<void>;
    setMenuData: (data: Category[]) => void;
}

export const useMenuStore = create<MenuState>()(
    persist(
        (set) => ({
            menuData: [],
            isLoading: false,
            error: null,

            // Static mock menu — no API call is made.
            fetchMenu: async () => {
                const { MOCK_MENU } = await import('@/lib/mock-data');
                set({ menuData: MOCK_MENU, isLoading: false, error: null });
            },

            setMenuData: (data: Category[]) => set({ menuData: data, isLoading: false, error: null }),
        }),
        {
            name: 'menu-storage-v4-mock',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
