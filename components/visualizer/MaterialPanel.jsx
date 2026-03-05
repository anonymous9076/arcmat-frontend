'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react';
import {
    getProductImageUrl,
    getVariantImageUrl,
    getProductName,
    getProductCategory,
    getProductBrand,
    getProductThumbnail
} from '@/lib/productUtils';

export default function MaterialPanel({ materials, selectedMaterial, stagedMaterial, onSelect, isOpen, onToggle }) {
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('All');

    const tabs = useMemo(() => {
        const cats = new Set(['All']);
        materials.forEach(v => {
            const cat =
                (typeof v.categoryId === 'object' ? v.categoryId?.name : null) ||
                (typeof v.productId === 'object' ? v.productId?.categoryId?.name : null) ||
                v.category || v.product_type;
            if (cat) cats.add(cat);
        });
        return Array.from(cats).slice(0, 8);
    }, [materials]);

    const filtered = useMemo(() => {
        return materials.filter(v => {
            const name = getProductName(v).toLowerCase();
            const brand = getProductBrand(v).toLowerCase();
            const matchesSearch = search === '' || name.includes(search.toLowerCase()) || brand.includes(search.toLowerCase());
            const catName = getProductCategory(v);
            const matchesTab = activeTab === 'All' || catName === activeTab;
            return matchesSearch && matchesTab;
        });
    }, [materials, search, activeTab]);

    const getImgUrl = (v) => getProductThumbnail(v);
    const getCategoryBadge = (v) => getProductCategory(v);
    const getProductItemName = (v) => getProductName(v);
    const getBrandName = (v) => getProductBrand(v);

    return (
        <div className="relative h-full flex flex-col bg-[#f8f7f5]">
            {/* Toggle Button (Absolute Positioned for when collapsed) */}
            {!isOpen && (
                <button
                    onClick={onToggle}
                    className="absolute left-4 top-4 z-50 p-2 bg-[#1a1a2e] text-white rounded-xl shadow-lg hover:bg-[#2d2d4a] transition-all"
                >
                    <Search className="w-5 h-5" />
                </button>
            )}

            <div className={`flex flex-col h-full transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                {/* Search */}
                <div className="px-3 pt-3 pb-2">
                    <div className="relative flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search materials…"
                                className="w-full pl-9 pr-9 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e09a74]/40 focus:border-[#e09a74] placeholder-gray-400 text-gray-700"
                            />
                            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <SlidersHorizontal className="w-4 h-4" />
                            </button>
                        </div>
                        <button
                            onClick={onToggle}
                            className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                            title="Collapse panel"
                        >
                            <ChevronDown className="w-5 h-5 rotate-90" />
                        </button>
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="flex items-center gap-1 px-3 pb-2 overflow-x-auto no-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${activeTab === tab ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Hint when a material is staged */}
                {stagedMaterial && (
                    <div className="mx-3 mb-2 px-3 py-2 bg-orange-50 border border-orange-100 rounded-lg text-xs font-semibold text-orange-600 text-center">
                        Click the canvas to place it
                    </div>
                )}

                {/* Material Grid - Scrollbar hidden via CSS */}
                <div
                    className="flex-1 min-h-0 overflow-y-auto px-3 pb-4 scroll-smooth"
                    style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                    }}
                >
                    <style jsx>{`
                        div::-webkit-scrollbar {
                            display: none;
                        }
                    `}</style>
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                            <Search className="w-8 h-8 mb-2 opacity-50" />
                            <p className="text-sm">No materials found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            {filtered.map((v) => {
                                const isSelected = selectedMaterial?._id === v._id;
                                const isStaged = stagedMaterial?._id === v._id;
                                const imgUrl = getImgUrl(v);
                                const badge = getCategoryBadge(v);
                                const productName = getProductItemName(v);
                                const brandName = getBrandName(v);

                                return (
                                    <button
                                        key={v._id}
                                        draggable
                                        onDragStart={(e) => {
                                            e.dataTransfer.setData('application/json', JSON.stringify(v));
                                            e.dataTransfer.effectAllowed = 'copy';
                                        }}
                                        onClick={() => onSelect(v)}
                                        className={`group text-left rounded-xl overflow-hidden border-2 transition-all duration-200 bg-white cursor-grab active:cursor-grabbing ${isStaged ? 'border-orange-400 shadow-md shadow-orange-400/20 ring-2 ring-orange-300 ring-offset-1' : isSelected ? 'border-[#e09a74] shadow-md shadow-[#e09a74]/20' : 'border-transparent hover:border-gray-300 hover:shadow-sm'}`}
                                    >
                                        <div className="relative aspect-square bg-gray-100 overflow-hidden">
                                            <Image
                                                src={imgUrl}
                                                alt={productName}
                                                fill
                                                sizes="(max-width: 240px) 50vw, 120px"
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                onError={e => { e.target.src = '/Icons/arcmatlogo.svg'; }}
                                            />
                                            <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-black/60 text-white text-[10px] font-medium rounded backdrop-blur-sm">
                                                {badge}
                                            </span>
                                            {isStaged && (
                                                <div className="absolute inset-0 bg-orange-400/10 flex items-center justify-center">
                                                    <span className="px-2 py-1 bg-orange-500 text-white text-[10px] font-bold rounded-full shadow">Staged</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-2">
                                            <p className="text-xs font-semibold text-gray-800 truncate leading-tight">{productName}</p>
                                            {brandName && <p className="text-[10px] text-gray-500 truncate mt-0.5">{brandName}</p>}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
