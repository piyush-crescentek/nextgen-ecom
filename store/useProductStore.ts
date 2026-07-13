import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product, type OhPrice, type ProductPricingField } from '@/lib/types';
import { getMockProductDetail, getMockCategoryLanding } from '@/lib/mock-data';

interface CategoryProduct {
    id?: number;
    title: string;
    image: string;
    slug: string;
    category_slug: string;
    subcategory_slug: string | null;
    price: {
        max: string;
        min: string;
        currency: string;
    };
    description: string;
    oh_prices?: OhPrice[];
    forms_pricing?: ProductPricingField | null;
}

interface CategoryData {
    name?: string;
    title?: string;
    description: string;
    short_description?: string;
    image?: string;
    products: CategoryProduct[];
}

interface ProductState {
    productsBySlug: Record<string, Product>;
    categoriesBySlug: Record<string, CategoryData>;
    isLoading: boolean;
    error: string | null;

    fetchProduct: (slug: string) => Promise<Product | null>;
    fetchCategoryData: (categorySlug: string, identifier: string | number) => Promise<CategoryData | null>;
    getProduct: (slug: string) => Product | null;
    getCategory: (slug: string) => CategoryData | null;
    setProduct: (product: Product) => void;
    setCategoryData: (slug: string, data: CategoryData) => void;
}

export const useProductStore = create<ProductState>()(
    persist(
        (set, get) => ({
            productsBySlug: {},
            categoriesBySlug: {},
            isLoading: false,
            error: null,

            getProduct: (slug) => get().productsBySlug[slug] || null,
            getCategory: (slug) => get().categoriesBySlug[slug] || null,

            // Static mock data — no API call is made.
            fetchProduct: async (slug) => {
                const productData = getMockProductDetail(slug);
                if (productData) {
                    set((state) => ({
                        productsBySlug: { ...state.productsBySlug, [slug]: productData },
                        isLoading: false,
                        error: null,
                    }));
                    return productData;
                }
                set({ isLoading: false, error: 'Product not found' });
                return null;
            },

            fetchCategoryData: async (categorySlug) => {
                const finalData = getMockCategoryLanding(categorySlug);
                if (finalData) {
                    set((state) => ({
                        categoriesBySlug: { ...state.categoriesBySlug, [categorySlug]: finalData },
                        isLoading: false,
                        error: null,
                    }));
                    return finalData;
                }
                set({ isLoading: false, error: 'Category not found' });
                return null;
            },

            setProduct: (product: Product) => set((state) => ({
                productsBySlug: { ...state.productsBySlug, [product.slug]: product },
            })),

            setCategoryData: (slug: string, data: CategoryData) => set((state) => ({
                categoriesBySlug: { ...state.categoriesBySlug, [slug]: data },
            })),
        }),
        {
            name: 'product-storage-v2-mock',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
