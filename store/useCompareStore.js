import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from '@/components/ui/Toast';

export const useCompareStore = create(
    persist(
        (set, get) => ({
            comparedProducts: [],
            isCompareModalOpen: false,

            sanitizeProduct: (product) => {
                if (!product) return null;
                const isVariant = Boolean(product.productId && typeof product.productId === 'object');
                const root = isVariant ? product.productId : product;

                return {
                    _id: product._id,
                    id: product.id || product._id,
                    product_name: root.product_name || root.name,
                    name: root.product_name || root.name,
                    description: product.description || root.description,
                    skucode: product.skucode || root.skucode,
                    stock: product.stock !== undefined ? product.stock : root.stock,
                    stockQuantity: product.stockQuantity !== undefined ? product.stockQuantity : root.stockQuantity,
                    inStock: product.inStock !== undefined ? product.inStock : root.inStock,
                    brand: root.brand,
                    product_images: root.product_images || [],
                    variant_images: product.variant_images || [],
                    image: product.image || root.image || root.product_image1,
                    product_image1: root.product_image1,
                    selling_price: product.selling_price || root.selling_price,
                    price: product.price || root.price,
                    mrp_price: product.mrp_price || root.mrp_price,
                    mrp: product.mrp || root.mrp,
                    minPrice: root.minPrice,
                    color: product.color,
                    size: product.size,
                    weight: product.weight,
                    weight_type: product.weight_type,
                    dynamicAttributes: product.dynamicAttributes || root.dynamicAttributes || [],
                    productId: isVariant ? {
                        _id: root._id,
                        id: root.id || root._id,
                        product_name: root.product_name || root.name,
                        description: root.description,
                        skucode: root.skucode,
                        brand: root.brand,
                        categoryId: root.categoryId,
                        subcategoryId: root.subcategoryId,
                        product_images: root.product_images || [],
                        selling_price: root.selling_price,
                        mrp_price: root.mrp_price,
                        stock: root.stock,
                        stockQuantity: root.stockQuantity,
                    } : null
                };
            },

            toggleProduct: (product) => {
                const current = get().comparedProducts;
                const productId = product._id || product.id;
                const isAlreadyAdded = current.some(p => (p._id || p.id) === productId);

                if (isAlreadyAdded) {
                    set({
                        comparedProducts: current.filter(p => (p._id || p.id) !== productId)
                    });
                } else {
                    if (current.length >= 3) {
                        toast.error("You can compare up to 3 products at a time.", "Limit Reached");
                        return;
                    }
                    const sanitized = get().sanitizeProduct(product);
                    set({
                        comparedProducts: [...current, sanitized]
                    });
                }
            },

            removeProduct: (productId) => {
                set({
                    comparedProducts: get().comparedProducts.filter(p => (p._id || p.id) !== productId)
                });
            },

            clearAll: () => set({ comparedProducts: [] }),

            openCompareModal: () => {
                if (get().comparedProducts.length < 2) {
                    toast.warning("Please select at least 2 products to compare.", "Comparison");
                    return;
                }
                set({ isCompareModalOpen: true });
            },

            closeCompareModal: () => set({ isCompareModalOpen: false }),
        }),
        {
            name: 'compare-storage',
            getStorage: () => (typeof window !== 'undefined' ? sessionStorage : null),
        }
    )
);
