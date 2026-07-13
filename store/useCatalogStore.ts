import { create } from 'zustand';
import { Category } from './useMenuStore';

interface ProductInfo {
    id: number;
    categoryId: number;
    subCategoryId: number | null;
    categoryName: string;
    subCategoryName: string | null;
    productName: string;
    slug: string;
}

interface CatalogState {
    productLookup: Record<number, ProductInfo>;
    allProductIds: number[];
    categoryMap: Record<number, Category>;
    initializeCatalog: (menuData: Category[]) => void;
}

export const useCatalogStore = create<CatalogState>((set) => ({
    productLookup: {},
    allProductIds: [],
    categoryMap: {},

    initializeCatalog: (menuData: Category[]) => {
        const productLookup: Record<number, ProductInfo> = {};
        const allProductIdsSet = new Set<number>();
        const categoryMap: Record<number, Category> = {};

        menuData.forEach((category) => {
            categoryMap[category.id] = category;

            // Process products directly in category
            category.products?.forEach((product) => {
                productLookup[product.id] = {
                    id: product.id,
                    categoryId: category.id,
                    subCategoryId: null,
                    categoryName: category.name,
                    subCategoryName: null,
                    productName: product.name,
                    slug: product.slug,
                };
                allProductIdsSet.add(product.id);
            });

            // Process products in subcategories
            category.subcategories?.forEach((sub) => {
                sub.products?.forEach((product) => {
                    productLookup[product.id] = {
                        id: product.id,
                        categoryId: category.id,
                        subCategoryId: sub.id,
                        categoryName: category.name,
                        subCategoryName: sub.name,
                        productName: product.name,
                        slug: product.slug,
                    };
                    allProductIdsSet.add(product.id);
                });
            });
        });

        const allProductIds = Array.from(allProductIdsSet);


        set({
            productLookup,
            allProductIds,
            categoryMap
        });
    },
}));
