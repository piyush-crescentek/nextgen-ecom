"use client";

import { useEffect } from "react";
import { useMenuStore } from "@/store/useMenuStore";
import { useCatalogStore } from "@/store/useCatalogStore";

export default function GlobalStateInitializer() {
    const { menuData, fetchMenu } = useMenuStore();
    const { initializeCatalog } = useCatalogStore();

    useEffect(() => {
        // Initial fetch if menuData is empty
        if (menuData.length === 0) {
            fetchMenu();
        }
    }, [fetchMenu, menuData.length]);

    useEffect(() => {
        // Whenever menuData updates, re-initialize the processed catalog store
        if (menuData.length > 0) {
            initializeCatalog(menuData);
        }
    }, [menuData, initializeCatalog]);

    return null; // This component doesn't render anything
}
