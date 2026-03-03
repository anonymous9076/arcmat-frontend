'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingCart, Check, ChevronRight, ReceiptText, Minus, Plus } from 'lucide-react';
import {
    getProductImageUrl,
    getVariantImageUrl,
    getColorCode,
    getSpecifications,
    resolvePricing,
    formatCurrency,
    getProductName,
    getProductCategory,
    getProductBrand,
    getProductThumbnail
} from '@/lib/productUtils';
import { useAddToCart } from '@/hooks/useCart';
import { useCartStore } from '@/store/useCartStore';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/Toast';

function getVariantColor(v) {
    return v?.color || v?.dynamicAttributes?.find(a => a.key?.toLowerCase() === 'color')?.value;
}

export default function DetailsPanel({
    selectedMaterial,
    onVariantChange,
    totalBudget = 0,
    materialCount = 0,
    boardItems = [],
    onUpdateItem,
    currentPhase = 'Concept Design',
    onPhaseUpdate,
    projectId,
    moodboardId,
    projectBudget
}) {
    const [activeTab, setActiveTab] = useState('details');
    const [isAdded, setIsAdded] = useState(false);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const { isAuthenticated } = useAuth();
    const { mutate: addToCartBackend } = useAddToCart();

    if (!selectedMaterial) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-white text-gray-400 gap-3 p-6">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <p className="text-sm text-center text-gray-400 font-medium">Select a material<br />to view details</p>
            </div>
        );
    }

    const product = typeof selectedMaterial.productId === 'object' ? selectedMaterial.productId : {};
    const variants = product.variants || [];

    const name = getProductName(selectedMaterial);
    const brandName = getProductBrand(selectedMaterial);
    const badge = getProductCategory(selectedMaterial);
    const imgSrc = getProductThumbnail(selectedMaterial);

    const specs = getSpecifications(
        Object.keys(product).length > 0 ? product : selectedMaterial,
        selectedMaterial
    );

    const { price, hasPrice } = resolvePricing(
        Object.keys(product).length > 0 ? product : selectedMaterial,
        selectedMaterial
    );

    const handleAddToCart = () => {
        if (isAuthenticated) {
            addToCartBackend({
                product_name: name,
                product_id: product._id,
                product_qty: 1,
                product_variant_id: selectedMaterial?._id || null,
                item_or_variant: 'variant',
            });
        } else {
            useCartStore.getState().addItem(product, 1, selectedMaterial);
            toast.success(`${name} added to cart!`);
        }
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
    };

    const colorOptions = variants.length > 0 ? variants : [selectedMaterial];

    const TAB = ({ id, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`pb-2.5 text-sm font-semibold mr-4 transition-colors border-b-2 ${activeTab === id ? 'text-gray-900 border-gray-900' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="flex flex-col h-full bg-white overflow-y-auto">

            {/* Tabs */}
            <div className="flex border-b border-gray-200 px-4 pt-3 shrink-0">
                <TAB id="details" label="Details" />
                <TAB id="colors" label="Colors" />
                <TAB id="estimate" label="Project List" />
            </div>

            {/* Hero image */}
            <div className="relative shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgSrc} alt={name} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }} />
                <button
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow hover:scale-110 transition-transform"
                >
                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                </button>
                <div className="absolute bottom-3 left-3">
                    <span className="px-2 py-0.5 bg-black/60 text-white text-[10px] font-medium rounded-full backdrop-blur-sm">{badge}</span>
                </div>
            </div>

            {/* Name */}
            <div className="px-4 mt-4 shrink-0">
                <h2 className="text-base font-bold text-gray-900 leading-tight">{name}</h2>
                {brandName && <p className="text-sm text-gray-500 mt-0.5">{brandName}</p>}
                {hasPrice && <p className="text-base font-black text-gray-900 mt-2">{formatCurrency(price)}</p>}
            </div>

            {/* DETAILS TAB */}
            {activeTab === 'details' && specs.length > 0 && (
                <div className="px-4 mt-4 shrink-0">
                    <div className="space-y-2.5 border-t border-gray-100 pt-4">
                        {specs.slice(0, 8).map((spec, i) => {
                            const isSKU = spec.label?.toUpperCase() === 'SKU';
                            const displayValue = isSKU && typeof spec.value === 'string' && spec.value.length > 12
                                ? spec.value.substring(0, 8) + '...' + spec.value.substring(spec.value.length - 4)
                                : spec.value;

                            return (
                                <div key={i} className="flex items-start justify-between gap-2">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-24 shrink-0">{spec.label}</span>
                                    <span className={`text-xs text-gray-800 text-right flex-1 ${isSKU ? 'font-mono' : ''}`} title={isSKU ? spec.value : undefined}>
                                        {displayValue}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* COLORS TAB */}
            {activeTab === 'colors' && (
                <div className="px-4 mt-5 shrink-0">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        {colorOptions.length} Color{colorOptions.length !== 1 ? 's' : ''} Available
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                        {colorOptions.map((v) => {
                            const isSelected = selectedMaterial._id === v._id;
                            const colorName = getVariantColor(v);
                            const code = getColorCode(colorName);
                            const vImg = getProductThumbnail(v);

                            return (
                                <button
                                    key={v._id}
                                    onClick={() => onVariantChange(v)}
                                    className={`group flex flex-col items-center gap-1.5 p-1.5 rounded-xl border-2 transition-all ${isSelected ? 'border-[#e09a74] bg-[#e09a74]/5 shadow-md' : 'border-transparent hover:border-gray-200 hover:bg-gray-50'}`}
                                >
                                    <div className="w-full rounded-lg overflow-hidden" style={{ aspectRatio: '1/1' }}>
                                        {vImg && vImg !== '/Icons/arcmatlogo.svg' ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={vImg} alt={colorName || 'variant'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                        ) : (
                                            <div className="w-full h-full" style={{ backgroundColor: code || '#e5e7eb' }} />
                                        )}
                                    </div>
                                    {colorName && <span className="text-[10px] text-gray-600 font-medium text-center leading-tight truncate w-full">{colorName}</span>}
                                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#e09a74]" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ESTIMATE TAB */}
            {activeTab === 'estimate' && (
                <div className="px-4 mt-5 shrink-0">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            <ReceiptText className="w-3.5 h-3.5 text-[#e09a74]" />
                            Materials on Board
                        </h3>
                        <span className="text-xs text-gray-400 font-medium">{materialCount} item{materialCount !== 1 ? 's' : ''}</span>
                    </div>

                    {/* Total budget & Phase */}
                    {materialCount >= 0 && (
                        <div className="mb-4 space-y-3">
                            <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-orange-700">Est. Total</span>
                                    <span className="text-sm font-black text-orange-700">{formatCurrency(totalBudget)}</span>
                                </div>
                                {projectBudget && !isNaN(Number(projectBudget)) && Number(projectBudget) > 0 && (
                                    <div className="flex flex-col gap-1.5 pt-2 border-t border-orange-200/50 mt-1">
                                        <div className="flex items-center justify-between text-[10px] font-bold text-orange-600/80">
                                            <span>Project Budget</span>
                                            <span>{formatCurrency(Number(projectBudget))}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-orange-200/50 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${totalBudget > Number(projectBudget) ? 'bg-red-500' : 'bg-orange-500'}`}
                                                style={{ width: `${Math.min(100, (totalBudget / Number(projectBudget)) * 100)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-end mt-0.5">
                                            <span className={`text-[9px] font-bold ${totalBudget > Number(projectBudget) ? 'text-red-600' : 'text-orange-600/80'}`}>
                                                {totalBudget > Number(projectBudget)
                                                    ? 'Over Budget'
                                                    : `${Math.round((totalBudget / Number(projectBudget)) * 100)}% Used`
                                                }
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl">
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Project Phase</label>
                                <select
                                    value={currentPhase}
                                    onChange={(e) => onPhaseUpdate?.(e.target.value)}
                                    className="w-full bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer"
                                >
                                    <option value="Concept Design">Concept Design</option>
                                    <option value="Design Development">Design Development</option>
                                    <option value="Construction">Construction</option>
                                    <option value="Finished">Finished</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3 pb-2 max-h-[36vh] overflow-y-auto pr-1">
                        {boardItems
                            .filter(i => i.type !== 'text')
                            .map((item) => (
                                <BoardItemRow
                                    key={item.id}
                                    item={item}
                                    onUpdateItem={onUpdateItem}
                                />
                            ))}

                        {boardItems.filter(i => i.type !== 'text' && !i.material?.isCustomPhoto).length === 0 && (
                            <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <p className="text-xs text-gray-400 italic">No materials on board yet</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="px-4 mt-4 pb-6 flex flex-col gap-2 shrink-0">
                <button
                    onClick={handleAddToCart}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${isAdded ? 'bg-green-600 text-white' : 'bg-gray-900 text-white hover:bg-gray-700'}`}
                >
                    {isAdded ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                    {isAdded ? 'Added to Cart' : 'Add to Cart'}
                </button>
                <Link
                    href={`/dashboard/projects/${projectId}/moodboards/${moodboardId}`}
                    className="w-full"
                >
                    <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all">
                        View Full Details <ChevronRight className="w-4 h-4" />
                    </button>
                </Link>
            </div>
        </div>
    );
}

function BoardItemRow({ item, onUpdateItem }) {
    const [localPrice, setLocalPrice] = useState(String(item.price || 0));
    const iName = getProductName(item.material);
    const categoryName = getProductCategory(item.material);
    const thumb = getProductThumbnail(item.material);

    const handlePriceChange = (e) => {
        const val = e.target.value;
        // Allow decimals, leading zeros, and empty strings for better typing experience
        if (val === '' || /^\d*\.?\d*$/.test(val)) {
            setLocalPrice(val);
            if (val !== '' && !val.endsWith('.')) {
                onUpdateItem(item.id, { price: Number(val) });
            }
        }
    };

    return (
        <div className="flex flex-col gap-2 border-b border-gray-50 pb-3 last:border-0">
            <div className="flex items-center gap-3">
                <div className="shrink-0 w-10 h-10 rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumb} alt={iName} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col overflow-hidden">
                    <span className="truncate text-gray-900 font-bold text-sm leading-tight">{iName}</span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-tight">{categoryName}</span>
                </div>
            </div>
            <div className="flex items-end gap-3">
                <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-gray-400 uppercase ml-1">Qty</span>
                    <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg p-1">
                        <button onClick={() => onUpdateItem(item.id, { quantity: Math.max(1, (item.quantity || 1) - 1) })} className="w-6 h-6 flex items-center justify-center rounded-md bg-white text-gray-500 hover:text-gray-900 shadow-sm transition-all">
                            <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-bold text-gray-900">{item.quantity || 1}</span>
                        <button onClick={() => onUpdateItem(item.id, { quantity: (item.quantity || 1) + 1 })} className="w-6 h-6 flex items-center justify-center rounded-md bg-white text-gray-500 hover:text-gray-900 shadow-sm transition-all">
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>
                </div>
                <div className="flex flex-col gap-1 flex-1">
                    <span className="text-[9px] font-bold text-gray-400 uppercase ml-1">Price (₹)</span>
                    <input
                        type="text"
                        inputMode="decimal"
                        value={localPrice}
                        onChange={handlePriceChange}
                        onBlur={() => {
                            if (localPrice === '' || isNaN(Number(localPrice))) {
                                setLocalPrice('0');
                                onUpdateItem(item.id, { price: 0 });
                            } else {
                                setLocalPrice(String(Number(localPrice)));
                            }
                        }}
                        className="w-full h-8 px-2 rounded-lg bg-gray-100 border border-transparent focus:border-[#e09a74] focus:bg-white text-xs font-bold text-gray-900 outline-none transition-all"
                    />
                </div>
            </div>
        </div>
    );
}
