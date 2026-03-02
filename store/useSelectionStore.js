import { create } from 'zustand';

export const useSelectionStore = create((set, get) => ({
    selectedProducts: [],

    toggleProduct: (product) => set((state) => {
        // Handle RetailerProducts (nested productId) and generic Products
        const getProductId = (p) => {
            const baseProduct = p.productId ? p.productId : p;
            return String(baseProduct._id || baseProduct.id || p._id || p.id || p.override_id);
        };

        const currentId = getProductId(product);
        const exists = state.selectedProducts.some(p => getProductId(p) === currentId);

        if (exists) {
            return {
                selectedProducts: state.selectedProducts.filter(p => getProductId(p) !== currentId)
            };
        } else {
            return {
                selectedProducts: [...state.selectedProducts, product]
            };
        }
    }),

    clearSelection: () => set({ selectedProducts: [] }),

    isSelected: (productId) => {
        const state = get();
        return state.selectedProducts.some(p => (p._id || p.id || String(p.override_id)) === productId);
    }
}));
