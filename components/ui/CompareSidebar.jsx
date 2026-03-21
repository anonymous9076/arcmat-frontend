"use client"
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useCompareStore } from '@/store/useCompareStore'
import { toast } from '@/components/ui/Toast'
import clsx from 'clsx'
import dynamic from 'next/dynamic'
const AddToMoodboardModal = dynamic(() => import('@/components/dashboard/projects/AddToMoodboardModal'), { ssr: false })
import { X, ShoppingCart, Trash2, Check, AlertCircle, ChevronRight, Plus } from 'lucide-react'
import { getProductImageUrl, getVariantImageUrl, formatCurrency, resolvePricing, getSpecifications, getProductName, getProductCategory, getProductBrand } from '@/lib/productUtils'
import { useAddToCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { useCartStore } from '@/store/useCartStore'
import useProjectStore from '@/store/useProjectStore'

const CompareSidebar = () => {
    const isCompareModalOpen = useCompareStore(state => state.isCompareModalOpen);
    const closeCompareModal = useCompareStore(state => state.closeCompareModal);
    const comparedProducts = useCompareStore(state => state.comparedProducts);
    const removeProduct = useCompareStore(state => state.removeProduct);
    const { mutate: addToCartBackend } = useAddToCart();
    const { user, isAuthenticated } = useAuth();
    const { activeMoodboardName } = useProjectStore();
    const isArchitect = user?.role === 'architect';
    const [selectedProductForBoard, setSelectedProductForBoard] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const handleAddToCart = (product) => {
        const isVariantCentric = Boolean(product.productId && typeof product.productId === 'object');
        const rootProduct = isVariantCentric ? product.productId : product;
        const variantItem = isVariantCentric ? product : null;
        const name = rootProduct.product_name || rootProduct.name;

        if (isAuthenticated) {
            addToCartBackend({
                product_name: name,
                product_id: rootProduct?._id,
                product_qty: 1,
                product_variant_id: variantItem?._id || null,
                item_or_variant: isVariantCentric ? 'variant' : 'item'
            });
            toast.success(`${name} added to cart`);
        } else {
            useCartStore.getState().addItem(rootProduct, 1, variantItem);
            toast.success(`${name} added to cart!`);
        }
    };

    // Extract all unique attributes using getSpecifications helper
    const allAttrKeysMap = new Map();
    comparedProducts.forEach(p => {
        const isVariant = Boolean(p.productId && typeof p.productId === 'object');
        const root = isVariant ? p.productId : p;
        const variant = isVariant ? p : null;
        const specs = getSpecifications(root, variant);
        specs.forEach(s => {
            if (s.label && s.value) {
                const lowKey = s.label.toLowerCase();
                if (!allAttrKeysMap.has(lowKey)) {
                    allAttrKeysMap.set(lowKey, s.label);
                }
            }
        });
    });
    const allAttrKeys = Array.from(allAttrKeysMap.values()).filter(key => key.toLowerCase() !== 'sku');

    return (
        <div className={clsx(
            "fixed inset-y-0 right-0 z-100 flex transition-transform duration-300 ease-in-out bg-white shadow-2xl border-l border-gray-200",
            isCompareModalOpen ? "translate-x-0" : "translate-x-full"
        )}
            style={{ width: 'min(90vw, 1200px)' }}
        >

            {/* Toggle Button (Visible when closed? No, usually handled by other UI) 
                But we need a close button inside.
            */}

            <div className="flex flex-col w-full h-full">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-20">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Compare Products</h2>
                        <p className="text-sm text-gray-500 mt-0.5">{comparedProducts.length} items selected</p>
                    </div>
                    <button
                        onClick={closeCompareModal}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto custom-scrollbar bg-gray-50/50 p-6">
                    {comparedProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <p>No items to compare.</p>
                        </div>
                    ) : (
                        <div className="grid divide-y divide-gray-100 bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl overflow-hidden align-top min-w-full">

                            {/* Product Header Row */}
                            <div className="grid" style={{ gridTemplateColumns: `200px repeat(${comparedProducts.length}, minmax(280px, 1fr))` }}>
                                <div className="p-6 bg-gray-50/80 font-semibold text-gray-900 flex items-center">
                                    Product Details
                                </div>
                                {comparedProducts.map((product) => {
                                    const isVariant = Boolean(product.productId && typeof product.productId === 'object');
                                    const root = isVariant ? product.productId : product;
                                    const variantImages = Array.isArray(product.variant_images) ? product.variant_images : [];
                                    const rootImages = Array.isArray(root.product_images) ? root.product_images : [];
                                    const image = variantImages[0] || rootImages[0] || root.image || root.product_image1;
                                    const imageUrl = variantImages.includes(image) ? getVariantImageUrl(image) : getProductImageUrl(image);

                                    return (
                                        <div key={product._id || product.id} className="p-6 relative group border-l border-gray-100 hover:bg-orange-50/10 transition-colors">
                                            <button
                                                onClick={() => removeProduct(product._id || product.id)}
                                                className="absolute top-3 right-3 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                                title="Remove"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>

                                            <div className="relative aspect-square w-32 h-32 mx-auto mb-4 bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                                                <Image
                                                    src={imageUrl}
                                                    alt={root.product_name || ''}
                                                    fill
                                                    className="object-contain p-2"
                                                    unoptimized
                                                />
                                            </div>

                                            <div className="text-center">
                                                <div className="text-xs font-bold text-[#e09a74] uppercase tracking-wider mb-1">
                                                    {getProductBrand(product)}
                                                </div>
                                                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[40px] mb-2">
                                                    {getProductName(product)}
                                                </h3>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Price Row */}
                            <div className="grid" style={{ gridTemplateColumns: `200px repeat(${comparedProducts.length}, minmax(280px, 1fr))` }}>
                                <div className="p-4 px-6 bg-gray-50/80 text-sm font-medium text-gray-600 flex items-center">
                                    Price
                                </div>
                                {comparedProducts.map((product) => {
                                    const isVariant = Boolean(product.productId && typeof product.productId === 'object');
                                    const { price, mrp } = resolvePricing(isVariant ? product.productId : product, isVariant ? product : null);
                                    return (
                                        <div key={product._id || product.id} className="p-4 px-6 border-l border-gray-100 flex flex-col items-center justify-center">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-lg font-bold text-gray-900">{formatCurrency(price)}</span>
                                                {mrp > price && (
                                                    <span className="text-sm text-gray-400 line-through decoration-gray-400/50">
                                                        {formatCurrency(mrp)}
                                                    </span>
                                                )}
                                            </div>
                                            {mrp > price && (
                                                <span className="text-[10px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full mt-1">
                                                    {Math.round(((mrp - price) / mrp) * 100)}% OFF
                                                </span>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            {/* SKU Row */}
                            <div className="grid" style={{ gridTemplateColumns: `200px repeat(${comparedProducts.length}, minmax(280px, 1fr))` }}>
                                <div className="p-4 px-6 bg-gray-50/80 text-sm font-medium text-gray-600 flex items-center">
                                    SKU
                                </div>
                                {comparedProducts.map((product) => (
                                    <div key={product._id || product.id} className="p-4 px-6 border-l border-gray-100 flex items-center justify-center text-center">
                                        <span className="text-sm text-gray-700 font-mono uppercase tracking-tight">
                                            {product.product_unique_id || "-"}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Category Row */}
                            <div className="grid" style={{ gridTemplateColumns: `200px repeat(${comparedProducts.length}, minmax(280px, 1fr))` }}>
                                <div className="p-4 px-6 bg-gray-50/80 text-sm font-medium text-gray-600 flex items-center">
                                    Category
                                </div>
                                {comparedProducts.map((product) => (
                                    <div key={product._id || product.id} className="p-4 px-6 border-l border-gray-100 flex items-center justify-center text-center">
                                        <span className="text-sm text-gray-700">{getProductCategory(product)}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Description Row */}
                            <div className="grid" style={{ gridTemplateColumns: `200px repeat(${comparedProducts.length}, minmax(280px, 1fr))` }}>
                                <div className="p-4 px-6 bg-gray-50/80 text-sm font-medium text-gray-600 flex items-center">
                                    Description
                                </div>
                                {comparedProducts.map((product) => {
                                    const isVariant = Boolean(product.productId && typeof product.productId === 'object');
                                    const root = isVariant ? product.productId : product;
                                    const desc = root.description || product.description || "";
                                    return (
                                        <div key={product._id || product.id} className="p-4 px-6 border-l border-gray-100 flex items-center justify-center">
                                            <p className="text-xs text-gray-500 line-clamp-3 text-center leading-relaxed">
                                                {desc || "No description available"}
                                            </p>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Attributes Rows */}
                            {allAttrKeys.map((key) => (
                                <div key={key} className="grid" style={{ gridTemplateColumns: `200px repeat(${comparedProducts.length}, minmax(280px, 1fr))` }}>
                                    <div className="p-4 px-6 bg-gray-50/80 text-sm font-medium text-gray-600 flex items-center capitalize">
                                        {key}
                                    </div>
                                    {comparedProducts.map((product) => {
                                        const isVariant = Boolean(product.productId && typeof product.productId === 'object');
                                        const root = isVariant ? product.productId : product;
                                        const variant = isVariant ? product : null;
                                        const specs = getSpecifications(root, variant);
                                        const spec = specs.find(s => s.label?.toLowerCase() === key.toLowerCase());

                                        return (
                                            <div key={product._id || product.id} className="p-4 px-6 border-l border-gray-100 flex items-center justify-center text-center">
                                                {spec?.value ? (
                                                    <span className="text-sm text-gray-700 font-medium">{spec.value}</span>
                                                ) : (
                                                    <span className="text-gray-300 text-lg">-</span>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            ))}

                            {/* Stock / Availability */}
                            <div className="grid" style={{ gridTemplateColumns: `200px repeat(${comparedProducts.length}, minmax(280px, 1fr))` }}>
                                <div className="p-4 px-6 bg-gray-50/80 text-sm font-medium text-gray-600 flex items-center">
                                    Availability
                                </div>
                                {comparedProducts.map((product) => {
                                    const isVariant = Boolean(product.productId && typeof product.productId === 'object');
                                    const root = isVariant ? product.productId : product;
                                    // Robust stock check: check variant stock first, then root stock fields
                                    const stockCount = 
                                        product.stock !== undefined ? product.stock : 
                                        (product.stockQuantity !== undefined ? product.stockQuantity : 
                                        (root.stock !== undefined ? root.stock : 
                                        (root.stockQuantity !== undefined ? root.stockQuantity : 0)));
                                    
                                    const inStock = product.inStock !== undefined ? product.inStock : 
                                                   (root.inStock !== undefined ? root.inStock : stockCount > 0);

                                    return (
                                        <div key={product._id || product.id} className="p-4 px-6 border-l border-gray-100 flex items-center justify-center">
                                            {inStock ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                                                    <Check className="w-3 h-3" /> In Stock
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                                                    <AlertCircle className="w-3 h-3" /> Out of Stock
                                                </span>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Action Row */}
                            <div className="grid sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]" style={{ gridTemplateColumns: `200px repeat(${comparedProducts.length}, minmax(280px, 1fr))` }}>
                                <div className="p-6 bg-white border-t border-gray-100 flex items-center font-semibold text-gray-900">
                                    Action
                                </div>
                                {comparedProducts.map((product) => (
                                    <div key={product._id || product.id} className="p-6 bg-white border-l border-t border-gray-100 flex justify-center items-center">
                                        {isArchitect ? (
                                            <button
                                                onClick={() => {
                                                    setSelectedProductForBoard(product);
                                                    setIsAddModalOpen(true);
                                                }}
                                                className="w-full h-11 bg-[#e09a74] text-white hover:bg-[#d08963] active:scale-95 transition-all rounded-xl text-sm font-bold flex items-center justify-center shadow-lg shadow-orange-500/20"
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                {activeMoodboardName ? `Add to ${activeMoodboardName}` : 'Add to Board'}
                                            </button>
                                        ) : (
                                            /* Add to Cart hidden for all users */
                                            null
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {isAddModalOpen && selectedProductForBoard && (
                    <AddToMoodboardModal
                        isOpen={isAddModalOpen}
                        onClose={() => {
                            setIsAddModalOpen(false);
                            setSelectedProductForBoard(null);
                        }}
                        product={selectedProductForBoard}
                    />
                )}
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e5e7eb;
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #d1d5db;
                }
            `}</style>
        </div>
    )
}

export default CompareSidebar
