"use client"
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useCompareStore } from '@/store/useCompareStore'
import { toast } from '@/components/ui/Toast'
import clsx from 'clsx'
import dynamic from 'next/dynamic'
const AddToMoodboardModal = dynamic(() => import('@/components/dashboard/projects/AddToMoodboardModal'), { ssr: false })
import { X, ShoppingCart, Trash2, Check, AlertCircle, Plus } from 'lucide-react'
import { getProductImageUrl, getVariantImageUrl, formatCurrency, resolvePricing } from '@/lib/productUtils'
import { useAddToCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { useCartStore } from '@/store/useCartStore'
import useProjectStore from '@/store/useProjectStore'

const CompareModal = () => {
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

    if (!mounted || !isCompareModalOpen) return null;

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

    // Extract all unique attributes
    const allAttrKeysMap = new Map();
    comparedProducts.forEach(p => {
        let attrs = p.dynamicAttributes;
        if (typeof attrs === 'string') {
            try { attrs = JSON.parse(attrs); } catch (e) { attrs = []; }
        }
        if (Array.isArray(attrs)) {
            attrs.forEach(a => {
                const key = a.attributeName || a.key;
                if (key) {
                    const lowKey = key.toLowerCase();
                    if (!allAttrKeysMap.has(lowKey)) {
                        allAttrKeysMap.set(lowKey, key);
                    }
                }
            });
        }
    });
    const allAttrKeys = Array.from(allAttrKeysMap.values());

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
                onClick={closeCompareModal}
            />

            <div className="bg-white w-full max-w-7xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
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
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto custom-scrollbar bg-gray-50/50">
                    <div className="min-w-[800px] lg:min-w-full inline-block align-top">
                        <div className="grid divide-y divide-gray-100 bg-white shadow-sm ring-1 ring-gray-900/5 my-6 mx-6 rounded-xl overflow-hidden">

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

                                            <div className="relative aspect-square w-40 h-40 mx-auto mb-4 bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
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
                                                    {(root.brand && typeof root.brand === 'object') ? (root.brand.name || root.brand.brand_name) : (root.brand || 'Arcmat')}
                                                </div>
                                                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[40px] mb-2">
                                                    {root.product_name || root.name}
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
                                    const { price, mrp } = resolvePricing(product.productId && typeof product.productId === 'object' ? product.productId : product, product.productId && typeof product.productId === 'object' ? product : null);
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

                            {/* Attributes Rows */}
                            {allAttrKeys.map((key) => (
                                <div key={key} className="grid" style={{ gridTemplateColumns: `200px repeat(${comparedProducts.length}, minmax(280px, 1fr))` }}>
                                    <div className="p-4 px-6 bg-gray-50/80 text-sm font-medium text-gray-600 flex items-center capitalize">
                                        {key}
                                    </div>
                                    {comparedProducts.map((product) => {
                                        let attrs = product.dynamicAttributes;
                                        if (typeof attrs === 'string') {
                                            try { attrs = JSON.parse(attrs); } catch (e) { attrs = []; }
                                        }
                                        const attr = (Array.isArray(attrs) ? attrs : []).find(a => (a.attributeName || a.key)?.toLowerCase() === key.toLowerCase());
                                        const value = attr?.attributeValue || attr?.value;

                                        return (
                                            <div key={product._id || product.id} className="p-4 px-6 border-l border-gray-100 flex items-center justify-center text-center">
                                                {value ? (
                                                    <span className="text-sm text-gray-700 font-medium">{value}</span>
                                                ) : (
                                                    <span className="text-gray-300 text-lg">-</span>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            ))}

                            {/* Specifications / Other Details (Static) */}
                            <div className="grid" style={{ gridTemplateColumns: `200px repeat(${comparedProducts.length}, minmax(280px, 1fr))` }}>
                                {/* <div className="p-4 px-6 bg-gray-50/80 text-sm font-medium text-gray-600 flex items-center">
                                    Availability
                                </div> */}
                                {/* {comparedProducts.map((product) => {
                                    const stock = product.stock || (product.productId?.stock) || 0;
                                    console.log('hi', product)
                                    return (
                                        <div key={product._id || product.id} className="p-4 px-6 border-l border-gray-100 flex items-center justify-center">
                                            {stock > 0 ? (
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
                                })} */}
                            </div>

                            {/* Action Row */}
                            <div className="grid sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]" style={{ gridTemplateColumns: `200px repeat(${comparedProducts.length}, minmax(280px, 1fr))` }}>
                                <div className="p-6 bg-white border-t border-gray-100 flex items-center font-semibold text-gray-900">
                                    Action
                                </div>
                                {comparedProducts.map((product) => (
                                    <div key={product._id || product.id} className="p-6 bg-white border-l border-t border-gray-100 flex justify-center items-center">
                                        <button
                                            onClick={() => {
                                                if (isArchitect) {
                                                    setSelectedProductForBoard(product);
                                                    setIsAddModalOpen(true);
                                                } else {
                                                    handleAddToCart(product);
                                                }
                                            }}
                                            className="w-full h-11 bg-[#e09a74] text-white hover:bg-[#d08963] active:scale-95 transition-all rounded-xl text-sm font-bold flex items-center justify-center shadow-lg shadow-orange-500/20"
                                        >
                                            {isArchitect ? <Plus className="w-4 h-4 mr-2" /> : <ShoppingCart className="w-4 h-4 mr-2" />}
                                            {isArchitect ? (activeMoodboardName ? `Add to ${activeMoodboardName}` : 'Add to Board') : 'Add to Cart'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
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

export default CompareModal
