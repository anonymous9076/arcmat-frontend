'use client';

import { useState, useEffect } from 'react';
import { X, Search, Loader2, IndianRupee, Layout, CheckCircle2, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useGetMoodboardDropdown } from '@/hooks/useMoodboard';
import { useCreateEstimatedCost, useUpdateEstimatedCost } from '@/hooks/useEstimatedCost';
import useProjectStore from '@/store/useProjectStore';

export default function AddToMoodboardModal({ isOpen, onClose, product }) {
    const { activeProjectId, activeProjectName, activeMoodboardId, activeMoodboardName } = useProjectStore();
    const [selectedMoodboardId, setSelectedMoodboardId] = useState('');
    const { data: moodboardsData, isLoading: moodboardsLoading } = useGetMoodboardDropdown(activeProjectId);
    const createEstimateMutation = useCreateEstimatedCost();
    const updateEstimateMutation = useUpdateEstimatedCost();

    const moodboards = moodboardsData?.data || [];

    useEffect(() => {
        if (isOpen) {
            if (activeMoodboardId) {
                setSelectedMoodboardId(activeMoodboardId);
            } else {
                setSelectedMoodboardId('');
            }
        }
    }, [isOpen, activeMoodboardId]);

    // Removed auto-confirm effect

    const handleAdd = () => {
        if (!selectedMoodboardId || !product) return;

        const selectedMb = moodboards.find(mb => mb._id === selectedMoodboardId);
        const productIdToSend = product.override_id || product._id;

        console.log("AddToMoodboardModal handleAdd:", {
            product_name: product.product_name || product.productId?.product_name,
            product_id: product._id,
            override_id: product.override_id,
            productIdToSend
        });

        if (selectedMb?.estimatedCostId) {
            // UPDATING existing estimation
            const existingRetailerProductIds = selectedMb.estimatedCostId.productIds || [];
            if (existingRetailerProductIds.includes(productIdToSend)) {
                onClose(); // Already added, just close
                return;
            }

            updateEstimateMutation.mutate({
                id: selectedMb.estimatedCostId._id,
                data: {
                    productIds: [...existingRetailerProductIds, productIdToSend]
                }
            }, {
                onSuccess: () => onClose()
            });
        } else {
            // CREATING new estimation
            createEstimateMutation.mutate({
                moodboardId: selectedMoodboardId,
                projectId: activeProjectId,
                productIds: [productIdToSend]
            }, {
                onSuccess: () => onClose()
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
                <div className="p-8 pb-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-[#2d3142]">
                            Add to Moodboard
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="px-8 py-4">
                    <div className="bg-gray-50 rounded-3xl p-4 flex items-center gap-4 mb-2 border border-gray-100">
                        <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden shadow-sm shrink-0 border border-gray-50">
                            {product.variant_images?.[0]?.secure_url || product.productId?.product_images?.[0]?.secure_url || product.secure_url ? (
                                <img
                                    src={product.variant_images?.[0]?.secure_url || product.productId?.product_images?.[0]?.secure_url || product.secure_url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-200">
                                    <Layout className="w-6 h-6" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-[#2d3142] truncate">{product?.product_name || product?.productId?.product_name}</h4>
                            <p className="text-xs text-gray-400 font-medium">{product?.productId?.brand?.name || product?.brand_name || 'Brand'}</p>
                        </div>
                    </div>

                    {activeMoodboardId ? (
                        ''
                    ) : (
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">
                                Choose Moodboard
                            </label>

                            {moodboardsLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-8 h-8 text-[#d9a88a] animate-spin" />
                                </div>
                            ) : moodboards.length > 0 ? (
                                <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {moodboards.map((mb) => (
                                        <button
                                            key={mb._id}
                                            onClick={() => setSelectedMoodboardId(mb._id)}
                                            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${selectedMoodboardId === mb._id
                                                ? 'border-[#d9a88a] bg-[#fef7f2]'
                                                : 'border-gray-50 bg-white hover:border-gray-200'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedMoodboardId === mb._id ? 'bg-[#d9a88a] text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                    <Layout className="w-5 h-5" />
                                                </div>
                                                <span className={`font-bold ${selectedMoodboardId === mb._id ? 'text-[#d9a88a]' : 'text-[#2d3142]'}`}>
                                                    {mb.moodboard_name}
                                                </span>
                                            </div>
                                            {selectedMoodboardId === mb._id && (
                                                <CheckCircle2 className="w-5 h-5 text-[#d9a88a]" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 bg-orange-50 rounded-3xl text-center border border-dashed border-orange-200">
                                    <p className="text-orange-500 font-bold text-sm mb-2">No moodboards found</p>
                                    <p className="text-orange-400 text-xs">Create a moodboard in the project first.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-8 pt-4 flex gap-3">
                    <Button
                        onClick={onClose}
                        className="flex-1 py-4 px-6 border border-gray-200 text-gray-500 font-bold rounded-2xl hover:bg-gray-50 transition-all"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAdd}
                        disabled={!selectedMoodboardId || createEstimateMutation.isPending || updateEstimateMutation.isPending}
                        className="flex-2 py-4 bg-[#d9a88a] text-white font-black rounded-2xl hover:bg-[#c59678] shadow-lg shadow-orange-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                        {createEstimateMutation.isPending || updateEstimateMutation.isPending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            'Add to board'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
