'use client';
import { useState, useCallback } from 'react';
import { ChevronDown, Search, Tag, ShoppingCart, Plus, ImagePlus, List, Building2 } from 'lucide-react';
import { toast } from 'sonner';

import PhotoUploadModal from '@/components/moodboard/PhotoUploadModal';
import CardContextMenu from '@/components/moodboard/CardContextMenu';
import { getProductThumbnail, getProductName, getProductBrand, getProductCategory } from '@/lib/productUtils';
import useProjectStore from '@/store/useProjectStore';

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
    products,
    customPhotos,
    productStatuses,
    projectId,
    projectName,
    moodboardId,
    moodboardName,
    handlePhotoAdd,
    handlePhotoStatusChange,
    handleProductStatusChange,
    handleRemovePhoto,
    handleRemoveProduct,
    handleAddToCart,
    router
}) {
    const [brandFilterOpen, setBrandFilterOpen] = useState(false);
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [addCardOpen, setAddCardOpen] = useState(false);
    const [photoModalOpen, setPhotoModalOpen] = useState(false);
    const [contextMenu, setContextMenu] = useState(null);

    const openContextMenu = useCallback((e, itemId, isPhoto) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, itemId, isPhoto });
    }, []);

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
                    onEditTitle={contextMenu.isPhoto ? () => {
                        toast.info('Edit via the product list');
                    } : null}
                    onClose={() => setContextMenu(null)}
                />
            )}

            {products.length === 0 && customPhotos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-gray-200 rounded-3xl text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                        <ShoppingCart className="w-7 h-7 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-600 mb-2">No materials yet</h3>
                    <p className="text-sm text-gray-400 mb-6 max-w-sm">Add products from the catalog or upload custom images.</p>
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
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {/* + Add Card */}
                    <div className="relative">
                        <button
                            onClick={() => setAddCardOpen(o => !o)}
                            className="w-full border-2 border-dashed border-[#d9a88a]/40 rounded-2xl flex flex-col items-center justify-center gap-2 min-h-[220px] cursor-pointer hover:border-[#d9a88a] hover:bg-[#fef7f2] transition-all group bg-[#fef7f2]/50"
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

                    {/* Custom uploaded photos */}
                    {customPhotos.map((photo) => (
                        <div
                            key={photo.id}
                            onContextMenu={(e) => openContextMenu(e, photo.id, true)}
                            className="flex flex-col border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-all group cursor-context-menu"
                        >
                            <div className="relative aspect-square bg-gray-100 overflow-hidden">
                                {photo.previewUrl ? (
                                    <img src={photo.previewUrl} alt={photo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                        <ImagePlus className="w-8 h-8 text-gray-300" />
                                    </div>
                                )}
                                <StatusDot status={photo.status} />
                            </div>
                            <div className="p-3 flex flex-col gap-0.5 flex-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Uploaded Image</p>
                                <p className="text-sm font-bold text-[#1a1a2e] leading-snug line-clamp-2">{photo.title}</p>
                                {photo.description && <p className="text-xs text-gray-400 truncate">{photo.description}</p>}
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
                            const hasVariants = (typeof product.productId === 'object' ? product.productId?.variants?.length : 0) || 0;
                            const productId = product._id;
                            const status = productStatuses[productId] ?? 'Considering';

                            return (
                                <div
                                    key={`${productId || 'p'}-${i}`}
                                    onContextMenu={(e) => openContextMenu(e, productId, false)}
                                    className="flex flex-col border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-all group cursor-context-menu"
                                >
                                    <div className="relative aspect-square bg-gray-50 overflow-hidden">
                                        {imgUrl && imgUrl !== '/Icons/arcmatlogo.svg' ? (
                                            <img src={imgUrl} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                <Building2 className="w-8 h-8 text-gray-300" />
                                            </div>
                                        )}
                                        <StatusDot status={status} />
                                    </div>
                                    <div className="p-3 flex flex-col gap-1 flex-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{hasVariants > 0 ? `${hasVariants} Finishes` : '0 Finishes'}</p>
                                        <p className="text-sm font-bold text-[#1a1a2e] leading-snug line-clamp-2">{brand}</p>
                                        <p className="text-xs text-gray-400 truncate">{name}</p>
                                        <div className="mt-auto pt-2">
                                            {hasVariants > 0 ? (
                                                <button className="w-full py-2 border border-gray-200 text-xs font-bold text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
                                                    Sample Finishes
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleAddToCart(product)}
                                                    className="w-full py-2 bg-[#1a1a2e] text-white text-xs font-bold rounded-xl hover:bg-[#2d2d4a] transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <ShoppingCart className="w-3 h-3" /> Add to Cart
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            )}
        </div>
    );
}
