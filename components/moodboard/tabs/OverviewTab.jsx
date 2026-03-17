'use client';
import { useState, useCallback } from 'react';
import { Download, ChevronDown, Search, Tag, ShoppingCart, Plus, ImagePlus, List, Building2, MessageCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import PhotoUploadModal from '@/components/moodboard/PhotoUploadModal';
import CardContextMenu from '@/components/moodboard/CardContextMenu';
import MaterialHistoryModal from '@/components/moodboard/MaterialHistoryModal';
import SampleRequestModal from '@/components/moodboard/SampleRequestModal';
import RetailerContactModal from '@/components/moodboard/RetailerContactModal';
import MaterialDiscussionModal from '@/components/moodboard/MaterialDiscussionModal';
import ReplaceMaterialModal from '@/components/moodboard/ReplaceMaterialModal';
import {
    getProductThumbnail,
    getProductName,
    getProductBrand,
    getProductCategory,
    getProductSize,
    resolvePricing,
    formatCurrency,
    getImageUrl
} from '@/lib/productUtils';
import { downloadImage } from '@/lib/exportUtils';
import useProjectStore from '@/store/useProjectStore';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateEstimatedCost } from '@/hooks/useEstimatedCost';
import { useAddMaterialVersion } from '@/hooks/useMaterialHistory';
import { useQueryClient } from '@tanstack/react-query';

export const STATUS_STYLES = {
    'Specified': { dot: 'bg-green-400', label: 'text-green-600' },
    'Considering': { dot: 'bg-gray-500', label: 'text-gray-600' },
    'Excluded': { dot: 'bg-pink-400', label: 'text-pink-500' },
};

export function StatusDot({ status = 'Considering' }) {
    const s = STATUS_STYLES[status] || STATUS_STYLES['Considering'];
    return (
        <span
            className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full border-2 border-white shadow ${s.dot}`}
            title={status}
        />
    );
}

export default function OverviewTab({
    products = [],
    customPhotos = [],
    productStatuses = {},
    productNotifications = {},
    projectId,
    projectName,
    moodboardId,
    moodboardName,
    handlePhotoAdd,
    handlePhotoStatusChange,
    handleProductStatusChange,
    handlePriceQtyUpdate,
    handleRemovePhoto,
    handleRemoveProduct,
    handleReplaceProduct,
    isReplacingProduct,
    handleAddToCart,
    router,
    isArchitect,
    privacyControls,
    isTemplate = false
}) {
    const { user } = useAuth();
    const isClient = user?.role === 'customer';

    const [brandFilterOpen, setBrandFilterOpen] = useState(false);
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [addCardOpen, setAddCardOpen] = useState(false);
    const [photoModalOpen, setPhotoModalOpen] = useState(false);
    const [contextMenu, setContextMenu] = useState(null);

    const updateEstimationMutation = useUpdateEstimatedCost();
    const addMaterialVersionMutation = useAddMaterialVersion(projectId);
    const queryClient = useQueryClient();

    // Modals state
    // activeModal can be 'history', 'sample', 'retailer', 'discussion', 'replace', or null
    const [activeModal, setActiveModal] = useState(null);
    const [selectedMaterial, setSelectedMaterial] = useState(null);

    // Calculate total estimation
    const totalEstimation = (products || []).reduce((sum, p) => {
        const meta = (productStatuses || {})[p?._id] || {};
        const price = typeof meta === 'object' ? (Number(meta.price) || 0) : 0;
        const qty = typeof meta === 'object' ? (Number(meta.quantity) || 1) : 1;
        return sum + (price * qty);
    }, 0) + (customPhotos || []).reduce((sum, p) => {
        return sum + ((Number(p?.price) || 0) * (Number(p?.quantity) || 1));
    }, 0);

    const openContextMenu = useCallback((e, itemId, isPhoto) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, itemId, isPhoto });
    }, []);

    const handleReplaceProductSubmit = (oldProductId, oldProductName, newProduct, reason) => {
        // Find existing estimation 
        // OverviewTab doesn't have the full moodboard or estimation data natively passed aside from products list, 
        // but products list is basically estimatedCost.productIds.
        // We will call handleRemoveProduct(old) and then Add it, but handleRemoveProduct is passed down and doesn't return a promise easily.
        // Actually, we need to update the estimatedCost directly here to swap the IDs.

        // Let's assume the parent can pass down estimationId. Wait, we don't have it as a prop.
        // We need estimationId. Let's look at page.jsx: it passes products, not estimationId.
        // I will add estimationId as a prop shortly in page.jsx. For now, let's assume `estimationId` is passed, or we just rely on the parent.
        // Actually, let's pass an `onReplaceProduct` up to `page.jsx` where `estimation` object lives.
    };

    // Providing a placeholder moodboard if it's undefined
    const moodboard = { moodboard_name: moodboardName };
    const project = { projectName: projectName };

    return (
        <div className="h-full overflow-y-auto p-8">


            {/* Filter Bar */}
            <div className="flex items-center gap-3 mb-6 relative">
                {/* Brand Filter */}
                <div className="relative">
                    <button
                        onClick={() => { setBrandFilterOpen(o => !o); }}
                        className={`px-4 py-2 border rounded-full text-sm font-semibold transition-colors flex items-center gap-1.5 ${selectedBrands.length > 0
                            ? 'bg-[#1a1a2e] text-white border-[#1a1a2e]'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                    >
                        Brands {selectedBrands.length > 0 && <span className="bg-white/20 text-white text-[10px] font-black rounded-full px-1.5">{selectedBrands.length}</span>}
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${brandFilterOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {brandFilterOpen && (
                        <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50">
                            <div className="px-3 pb-2">
                                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                                    <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                    <input
                                        type="text"
                                        placeholder="Search brands"
                                        className="bg-transparent text-sm text-gray-700 outline-none w-full placeholder:text-gray-400"
                                        onChange={() => { }}
                                    />
                                </div>
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                                {[...new Set(products.map(p => getProductBrand(p)).filter(Boolean))].map(brand => (
                                    <label key={brand} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedBrands.includes(brand)}
                                            onChange={() => setSelectedBrands(prev =>
                                                prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
                                            )}
                                            className="w-4 h-4 rounded border-gray-300 accent-[#1a1a2e]"
                                        />
                                        <span className="text-sm text-gray-700 font-medium truncate">{brand}</span>
                                    </label>
                                ))}
                                {products.length > 0 && [...new Set(products.map(p => getProductBrand(p)).filter(Boolean))].length === 0 && (
                                    <p className="px-4 py-3 text-xs text-gray-400">No brands found</p>
                                )}
                            </div>
                            {selectedBrands.length > 0 && (
                                <div className="border-t border-gray-100 px-4 pt-2 pb-1">
                                    <button
                                        onClick={() => setSelectedBrands([])}
                                        className="text-sm text-[#d9a88a] font-semibold hover:underline"
                                    >
                                        Clear all
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <button className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-semibold text-gray-600 hover:border-gray-300 transition-colors flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> Tags
                </button>

                {/* Close dropdowns on outside click */}
                {(brandFilterOpen || addCardOpen) && (
                    <div className="fixed inset-0 z-40" onClick={() => { setBrandFilterOpen(false); setAddCardOpen(false); }} />
                )}
            </div>

            {/* Photo upload modal */}
            <PhotoUploadModal
                isOpen={photoModalOpen}
                onClose={() => setPhotoModalOpen(false)}
                onAdd={handlePhotoAdd}
            />

            {/* Context menu */}
            {contextMenu && (
                <CardContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    isPhoto={contextMenu.isPhoto}
                    currentStatus={
                        contextMenu.isPhoto
                            ? customPhotos.find(p => p.id === contextMenu.itemId)?.status ?? 'Considering'
                            : productStatuses[contextMenu.itemId] ?? 'Considering'
                    }
                    onStatusChange={(status) => {
                        if (contextMenu.isPhoto) handlePhotoStatusChange(contextMenu.itemId, status);
                        else handleProductStatusChange(contextMenu.itemId, status);
                    }}
                    onRemove={() => {
                        if (contextMenu.isPhoto) handleRemovePhoto(contextMenu.itemId);
                        else handleRemoveProduct(contextMenu.itemId);
                    }}
                    onClose={() => setContextMenu(null)}
                    isClient={isClient}
                    isTemplate={isTemplate}
                    onOpenHistory={() => {
                        const product = products.find(p => p._id === contextMenu.itemId);
                        setSelectedMaterial({ id: contextMenu.itemId, name: product ? getProductName(product) : '' });
                        setActiveModal('history');
                    }}
                    onOpenSampleReq={() => {
                        const product = products.find(p => p._id === contextMenu.itemId);
                        setSelectedMaterial({ id: contextMenu.itemId, name: product ? getProductName(product) : '' });
                        setActiveModal('sample');
                    }}
                    onOpenRetailerReq={() => {
                        const product = products.find(p => p._id === contextMenu.itemId);
                        setSelectedMaterial({ id: contextMenu.itemId, name: product ? getProductName(product) : '' });
                        setActiveModal('retailer');
                    }}
                    onOpenDiscussion={() => {
                        const product = contextMenu.isPhoto
                            ? customPhotos.find(p => p.id === contextMenu.itemId)
                            : products.find(p => p._id === contextMenu.itemId);

                        const name = contextMenu.isPhoto ? product?.title : (product ? getProductName(product) : '');
                        setSelectedMaterial({ id: contextMenu.itemId, name: name });
                        setActiveModal('discussion');
                    }}
                    onOpenReplace={() => {
                        const product = products.find(p => p._id === contextMenu.itemId);
                        setSelectedMaterial({ id: contextMenu.itemId, name: product ? getProductName(product) : '' });
                        setActiveModal('replace');
                    }}
                    onDownload={() => {
                        const photo = contextMenu.isPhoto 
                            ? customPhotos.find(p => p.id === contextMenu.itemId)
                            : products.find(p => p._id === contextMenu.itemId);
                        
                        const url = contextMenu.isPhoto ? photo?.previewUrl : getProductThumbnail(photo);
                        const name = contextMenu.isPhoto ? photo?.title : getProductName(photo);
                        if (url) downloadImage(url, `${name || 'material'}.jpg`);
                        else toast.error('No image available for download');
                    }}
                    productNotifications={productNotifications}
                    itemId={contextMenu.itemId}
                />
            )}

            {products.length === 0 && customPhotos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-gray-200 rounded-3xl text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                        <ShoppingCart className="w-7 h-7 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-600 mb-2">No materials yet</h3>
                    <p className="text-sm text-gray-400 mb-6 max-w-sm">Add products from the catalog or upload custom images.</p>
                    {isArchitect && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    useProjectStore.getState().setActiveMoodboard(moodboardId, moodboard?.moodboard_name, projectId, project?.projectName || '');
                                    router.push('/productlist');
                                }}
                                className="px-6 py-3 bg-[#1a1a2e] text-white font-bold rounded-2xl hover:bg-[#2d2d4a] transition-colors flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Add Products
                            </button>
                            <button
                                onClick={() => setPhotoModalOpen(true)}
                                className="px-6 py-3 border border-[#d9a88a] text-[#d9a88a] font-bold rounded-2xl hover:bg-[#fef7f2] transition-colors flex items-center gap-2"
                            >
                                <ImagePlus className="w-4 h-4" /> Upload Image
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {/* + Add Card */}
                    {isArchitect && (
                        <div className="relative h-full">
                            <button
                                onClick={() => setAddCardOpen(o => !o)}
                                className="w-full h-full border-2 border-dashed border-[#d9a88a]/40 rounded-2xl flex flex-col items-center justify-center gap-2 min-h-[220px] cursor-pointer hover:border-[#d9a88a] hover:bg-[#fef7f2] transition-all group bg-[#fef7f2]/50"
                            >
                                <div className="w-10 h-10 rounded-full bg-[#d9a88a]/10 flex items-center justify-center">
                                    <Plus className="w-5 h-5 text-[#d9a88a]" />
                                </div>
                                <span className="text-xs font-semibold text-[#d9a88a] text-center px-2">Images, Video &amp; Pinterest</span>
                            </button>
                            {addCardOpen && (
                                <div className="absolute top-2 left-full ml-2 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50">
                                    <button
                                        onClick={() => {
                                            setAddCardOpen(false);
                                            useProjectStore.getState().setActiveMoodboard(moodboardId, moodboard?.moodboard_name, projectId, project?.projectName || '');
                                            router.push('/productlist');
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                                    >
                                        <div className="w-7 h-7 bg-[#1a1a2e] rounded-lg flex items-center justify-center shrink-0">
                                            <List className="w-4 h-4 text-white" />
                                        </div>
                                        Browse Product List
                                    </button>
                                    <button
                                        onClick={() => { setAddCardOpen(false); setPhotoModalOpen(true); }}
                                        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                                    >
                                        <div className="w-7 h-7 bg-[#d9a88a] rounded-lg flex items-center justify-center shrink-0">
                                            <ImagePlus className="w-4 h-4 text-white" />
                                        </div>
                                        Upload Photo
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Custom uploaded photos */}
                    {customPhotos.map((photo) => (
                        <div
                            key={photo.id}
                            onContextMenu={(e) => openContextMenu(e, photo.id, true)}
                            className="flex flex-col h-full border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-all group cursor-context-menu bg-white"
                        >
                            <div className="relative aspect-square bg-gray-100 overflow-hidden">
                                {getImageUrl(photo.previewUrl) ? (
                                    <img src={getImageUrl(photo.previewUrl)} alt={photo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                        <ImagePlus className="w-8 h-8 text-gray-300" />
                                    </div>
                                )}
                                <StatusDot status={photo.status} />

                                {/* Photo Notification Badges (Unread Comments) */}
                                <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                                    {productNotifications[photo.id]?.unreadMessages > 0 && (
                                        <div
                                            className="flex items-center justify-center bg-red-500 text-white rounded-full px-1.5 py-0.5 shadow-md border border-white"
                                            title={`${productNotifications[photo.id].unreadMessages} new message${productNotifications[photo.id].unreadMessages > 1 ? 's' : ''}`}
                                        >
                                            <MessageCircle className="w-3 h-3 mr-0.5" />
                                            <span className="text-[10px] font-bold leading-none">{productNotifications[photo.id].unreadMessages}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="p-3 flex flex-col gap-2 flex-1">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Uploaded Image</p>
                                    <p className="text-sm font-bold text-[#1a1a2e] leading-snug line-clamp-1">{photo.title}</p>
                                </div>

                                <div>
                                    {(!isClient || privacyControls?.showPriceToClient) && (
                                        <p className="text-xs font-bold text-[#1a1a2e]">
                                            Est. Market Price: {formatCurrency(photo.price || 0)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Product cards */}
                    {products
                        .filter(p => selectedBrands.length === 0 || selectedBrands.includes(getProductBrand(p)))
                        .map((product, i) => {
                            const imgUrl = getProductThumbnail(product);
                            const name = getProductName(product);
                            const brand = getProductBrand(product);
                            const productId = product._id;
                            const hasVariants = (typeof product.productId === 'object' ? product.productId?.variants?.length : 0) || 0;
                            const statusData = productStatuses[productId] ?? 'Considering';
                            const status = typeof statusData === 'object' ? statusData.status : statusData;
                            const price = typeof statusData === 'object' ? (statusData.price || 0) : 0;
                            const qty = typeof statusData === 'object' ? (statusData.quantity || 1) : 1;

                            return (
                                <div
                                    key={`${productId || 'p'}-${i}`}
                                    onContextMenu={(e) => openContextMenu(e, productId, false)}
                                    className="flex flex-col h-full border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-all group cursor-context-menu bg-white"
                                >
                                    <Link 
                                        href={`/productdetails/${typeof product?.productId === 'object' ? product?.productId?._id : (product?.productId || product._id)}?variantId=${productId}`}
                                        className="relative aspect-square bg-gray-50 overflow-hidden cursor-pointer block"
                                    >
                                        {imgUrl ? (
                                            <img src={imgUrl} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                <Building2 className="w-8 h-8 text-gray-300" />
                                            </div>
                                        )}
                                        <StatusDot status={status} />

                                        {/* Product Notification Badges */}
                                        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                                            {productNotifications[productId]?.unreadMessages > 0 && (
                                                <div
                                                    className="flex items-center justify-center bg-red-500 text-white rounded-full px-1.5 py-0.5 shadow-md border border-white"
                                                    title={`${productNotifications[productId].unreadMessages} new message${productNotifications[productId].unreadMessages > 1 ? 's' : ''}`}
                                                >
                                                    <MessageCircle className="w-3 h-3 mr-0.5" />
                                                    <span className="text-[10px] font-bold leading-none">{productNotifications[productId].unreadMessages}</span>
                                                </div>
                                            )}
                                            {productNotifications[productId]?.pendingApprovals > 0 && (
                                                <div
                                                    className="flex items-center justify-center bg-amber-500 text-white rounded-full px-1.5 py-0.5 shadow-md border border-white"
                                                    title={`${productNotifications[productId].pendingApprovals} pending approval${productNotifications[productId].pendingApprovals > 1 ? 's' : ''}`}
                                                >
                                                    <AlertCircle className="w-3 h-3 mr-0.5" />
                                                    <span className="text-[10px] font-bold leading-none">{productNotifications[productId].pendingApprovals}</span>
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                    <Link 
                                        href={`/productdetails/${typeof product?.productId === 'object' ? product?.productId?._id : (product?.productId || product._id)}?variantId=${productId}`}
                                        className="p-3 flex flex-col gap-2 flex-1 cursor-pointer block"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{hasVariants > 0 ? `${hasVariants} Finishes` : '0 Finishes'}</p>
                                                {getProductSize(product) && <p className="text-[10px] text-gray-400 font-medium whitespace-nowrap">{getProductSize(product)}</p>}
                                            </div>
                                            <p className="text-sm font-bold text-[#1a1a2e] leading-snug line-clamp-1 hover:text-[#d9a88a] transition-colors">{brand}</p>
                                            <p className="text-[10px] text-gray-400 truncate">{name}</p>
                                        </div>

                                        <div>
                                            {(!isClient || privacyControls?.showPriceToClient) && (
                                                <p className="text-xs font-bold text-[#1a1a2e]">
                                                    Est. Market Price: {formatCurrency(price || resolvePricing(product).price)}
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                </div>
                            );
                        })}
                </div>
            )}

            <div className="mt-8 pt-8 border-t border-gray-50">
                <p className="text-[10px] text-gray-400 italic">
                    * Prices shown are indicative and subject to final quotation by the vendor.
                </p>
            </div>

            {/* Feature Modals */}
            <MaterialHistoryModal
                isOpen={activeModal === 'history'}
                onClose={() => { setActiveModal(null); setSelectedMaterial(null); }}
                projectId={projectId}
                spaceId={moodboardId}
                materialId={selectedMaterial?.id}
                currentMaterialName={selectedMaterial?.name}
                onStatusChange={handleProductStatusChange}
            />

            <SampleRequestModal
                isOpen={activeModal === 'sample'}
                onClose={() => { setActiveModal(null); setSelectedMaterial(null); }}
                projectId={projectId}
                spaceId={moodboardId}
                materialId={selectedMaterial?.id}
                materialName={selectedMaterial?.name}
            />

            <RetailerContactModal
                isOpen={activeModal === 'retailer'}
                onClose={() => { setActiveModal(null); setSelectedMaterial(null); }}
                projectId={projectId}
                materialId={selectedMaterial?.id}
                materialName={selectedMaterial?.name}
            />

            <MaterialDiscussionModal
                isOpen={activeModal === 'discussion'}
                onClose={() => { setActiveModal(null); setSelectedMaterial(null); }}
                projectId={projectId}
                spaceId={moodboardId}
                materialId={selectedMaterial?.id}
                materialName={selectedMaterial?.name}
            />

            {/* Replace uses a callback passed to parent or handled locally if we pass the right props. We will pass a prop handleReplaceProduct up. */}
            <ReplaceMaterialModal
                isOpen={activeModal === 'replace'}
                onClose={() => { setActiveModal(null); setSelectedMaterial(null); }}
                projectId={projectId}
                spaceId={moodboardId}
                oldMaterialId={selectedMaterial?.id}
                oldMaterialName={selectedMaterial?.name}
                onReplace={handleReplaceProduct}
                isReplacing={isReplacingProduct}
            />
        </div>
    );
}
