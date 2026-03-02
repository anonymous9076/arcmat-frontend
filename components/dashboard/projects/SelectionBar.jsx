"use client"
import React, { useState } from 'react';
import { useSelectionStore } from '@/store/useSelectionStore';
import { X, LayoutTemplate } from 'lucide-react';
import dynamic from 'next/dynamic';

const AddToMoodboardModal = dynamic(() => import('@/components/dashboard/projects/AddToMoodboardModal'), { ssr: false });

export default function SelectionBar() {
    const { selectedProducts, clearSelection } = useSelectionStore();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    if (selectedProducts.length === 0) return null;

    return (
        <>
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
                <div className="bg-[#2d3142] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-4 sm:gap-6 border-2 border-white/10 backdrop-blur-xl">
                    <div className="flex items-center gap-2">
                        <div className="bg-[#d9a88a] text-[#2d3142] w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                            {selectedProducts.length}
                        </div>
                        <span className="text-sm font-medium hidden sm:inline">
                            Products Selected
                        </span>
                    </div>

                    <div className="h-6 w-px bg-white/20" />

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-[#d9a88a] hover:bg-white text-[#2d3142] hover:text-[#d9a88a] px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 whitespace-nowrap"
                        >
                            <LayoutTemplate className="w-4 h-4" />
                            Add to Moodboard
                        </button>
                        <button
                            onClick={clearSelection}
                            className="p-2 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl transition-colors shrink-0"
                            title="Clear Selection"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {isAddModalOpen && (
                <AddToMoodboardModal
                    isOpen={isAddModalOpen}
                    onClose={() => {
                        setIsAddModalOpen(false);
                        clearSelection();
                    }}
                    products={selectedProducts}
                />
            )}
        </>
    );
}
