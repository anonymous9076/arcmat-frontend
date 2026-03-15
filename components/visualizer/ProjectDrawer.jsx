'use client';

import Image from 'next/image';
import { X, Plus, ChevronDown } from 'lucide-react';
import { getVariantImageUrl, getProductImageUrl } from '@/lib/productUtils';

export default function ProjectDrawer({ isOpen, onClose, savedMaterials, onAdd, onRemove, selectedMaterial }) {

    const getImgUrl = (v) => {
        if (!v) return '/Icons/arcmatlogo.svg';
        // Try every known image field in order of priority
        if (v.images?.length) return ;
        if (v.variant_images?.length) return ;
        if (typeof v.productId === 'object' && v.productId?.product_images?.length)
            return ;
        if (v.photoUrl) return v.photoUrl;
        return '/Icons/arcmatlogo.svg';
    };

    const getName = (v) => v?.name || v?.product_name || v?.productId?.product_name || 'Material';

    return (
        <>
            {/* Backdrop */}
            {isOpen && <div className="absolute inset-0 z-20" onClick={onClose} />}

            {/* Drawer */}
            <div className={`absolute bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-2xl rounded-t-2xl transition-transform duration-300 ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800">Project Drawer</span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full font-medium">
                            {savedMaterials.length} items
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedMaterial && (
                            <button
                                onClick={() => onAdd(selectedMaterial)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e09a74] text-white text-xs font-semibold rounded-lg hover:bg-[#d08a64] transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" /> Add to Project
                            </button>
                        )}
                        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Swatches */}
                <div className="px-5 py-4 overflow-x-auto">
                    {savedMaterials.length === 0 ? (
                        <div className="flex items-center justify-center h-20 text-gray-400 text-sm">
                            No materials saved yet — click &quot;Add to Project&quot; to save one.
                        </div>
                    ) : (
                        <div className="flex gap-3">
                            {savedMaterials.map((v, i) => {
                                const imgUrl = getImgUrl(v);
                                const name = getName(v);
                                return (
                                    <div key={v._id || i} className="flex flex-col items-center gap-1 group shrink-0">
                                        <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-gray-200 group-hover:border-[#e09a74] transition-all">
                                            <Image src={imgUrl} alt={name} fill className="object-cover" />
                                            <button
                                                onClick={() => onRemove(v._id)}
                                                className="absolute top-0.5 right-0.5 w-4 h-4 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                                            >
                                                <X className="w-2.5 h-2.5 text-gray-700" />
                                            </button>
                                        </div>
                                        <span className="text-[10px] text-gray-500 max-w-[64px] truncate text-center">{name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
