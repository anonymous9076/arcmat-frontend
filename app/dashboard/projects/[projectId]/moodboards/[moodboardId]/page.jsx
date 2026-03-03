'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Image from 'next/image';
import Button from '@/components/ui/Button';

import { useParams, useRouter } from 'next/navigation';
import { useGetMoodboard, useDeleteMoodboard, useUpdateMoodboard } from '@/hooks/useMoodboard';
import { useUpdateEstimatedCost } from '@/hooks/useEstimatedCost';
import { useQueryClient } from '@tanstack/react-query';
import useProjectStore from '@/store/useProjectStore';
import {
    ArrowLeft, IndianRupee, Layout, Package, ShoppingCart, Trash2, Loader2,
    Info, X, Plus, Edit2, Check, MonitorPlay, Type, FileOutput, Minus, Download
} from 'lucide-react';
import {
    getProductImageUrl,
    getProductName,
    getProductCategory,
    getProductThumbnail
} from '@/lib/productUtils';
import { useAuthStore } from '@/store/useAuthStore';

export default function MoodboardDetailPage() {
    const { projectId, moodboardId } = useParams();
    const router = useRouter();
    const { user } = useAuthStore();
    const setActiveMoodboard = useProjectStore(state => state.setActiveMoodboard);

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [localBoardItems, setLocalBoardItems] = useState([]);

    const { data: moodboardData, isLoading } = useGetMoodboard(moodboardId);
    const deleteMutation = useDeleteMoodboard();
    const updateEstimationMutation = useUpdateEstimatedCost();
    const { mutate: updateMoodboard, isPending: isUpdatingName } = useUpdateMoodboard();
    const queryClient = useQueryClient();

    const moodboard = moodboardData?.data;

    useEffect(() => {
        if (moodboard?.moodboard_name) {
            setEditName(moodboard.moodboard_name);
        }
        if (moodboard?.canvasState) {
            setLocalBoardItems(moodboard.canvasState);
        }
    }, [moodboard]);

    const project = moodboard?.projectId;
    const estimation = moodboard?.estimatedCostId;
    const products = estimation?.productIds || [];

    const handleAddProducts = () => {
        if (moodboard) {
            setActiveMoodboard(
                moodboard._id,
                moodboard.moodboard_name,
                project?._id,
                project?.projectName
            );
            router.push('/productlist');
        }
    };

    const handleRemoveProduct = (productId) => {
        if (!estimation?._id) return;

        if (window.confirm('Remove this product from the moodboard?')) {
            const updatedProductIds = products
                .map(p => p._id)
                .filter(id => id !== productId);

            updateEstimationMutation.mutate({
                id: estimation._id,
                data: { productIds: updatedProductIds }
            }, {
                onSuccess: () => {
                    toast.success('Product removed from moodboard');
                    // Invalidate both current moodboard and project list
                    queryClient.invalidateQueries(['moodboard', moodboardId]);
                }
            });
        }
    };


    const handleSaveName = () => {
        if (!editName.trim()) {
            toast.error('Moodboard name cannot be empty');
            return;
        }

        if (editName === moodboard?.moodboard_name) {
            setIsEditing(false);
            return;
        }

        updateMoodboard(
            { id: moodboardId, data: { moodboard_name: editName } },
            {
                onSuccess: () => {
                    setIsEditing(false);
                    queryClient.invalidateQueries(['moodboard', moodboardId]);
                }
            }
        );
    };

    const handleCancelName = () => {
        setEditName(moodboard?.moodboard_name || '');
        setIsEditing(false);
    };

    const handleUpdateItem = (id, updates) => {
        const nextItems = localBoardItems.map(item =>
            item.id === id ? { ...item, ...updates } : item
        );
        setLocalBoardItems(nextItems);

        // Calculate new budget
        const newBudget = nextItems.filter(i => i.type !== 'text').reduce((sum, item) => {
            return sum + (Number(item.price || 0) * Number(item.quantity || 1));
        }, 0);

        // Persist to backend
        updateMoodboard({
            id: moodboardId,
            data: {
                canvasState: nextItems,
                totalBudget: newBudget
            }
        });
    };

    const exportAsCSV = () => {
        const materials = localBoardItems.filter(i => i.type !== 'text');
        if (materials.length === 0) {
            toast.error('No materials to export');
            return;
        }
        const headers = ['Product Name', 'Category', 'Quantity', 'Unit Price', 'Total Cost'];
        let grandTotal = 0;
        const rows = materials.map(item => {
            const m = item.material || {};
            const name = m.product_name || m.name || 'Material';
            const category = m.category || m.product_type || 'Material';
            const qty = item.quantity || 1;
            const unitPrice = item.price || 0;
            const total = qty * unitPrice;
            grandTotal += total;
            return [name, category, qty, unitPrice, total].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
        });
        const totalRow = ['', '', '', '"Grand Total"', `"${grandTotal}"`].join(',');
        const csvContent = [headers.join(','), ...rows, totalRow].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${(moodboard?.moodboard_name || 'moodboard').replace(/\s+/g, '-')}-materials.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-[#d9a88a] animate-spin mb-4" />
                <p className="text-gray-400 font-bold">Loading details...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-400 hover:text-[#d9a88a] font-bold mb-8 transition-colors group"
            >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                Back to Moodboards
            </button>

            <div className="flex flex-col lg:flex-row gap-12 items-start">
                {/* Left Column: Details & Materials */}
                <div className="flex-1 space-y-12">
                    {/* Header Information */}
                    <div>
                        <div className="flex items-center gap-3 text-[#d9a88a] font-black uppercase tracking-widest text-xs mb-3">
                            <Layout className="w-4 h-4" />
                            Moodboard Detail
                        </div>
                        {isEditing ? (
                            <div className="flex items-center gap-3 mb-6">
                                <input
                                    autoFocus
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="text-5xl font-black text-[#2d3142] tracking-tighter bg-transparent border-b-2 border-[#d9a88a] focus:outline-none w-full max-w-xl pb-1"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveName();
                                        if (e.key === 'Escape') handleCancelName();
                                    }}
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSaveName}
                                        disabled={isUpdatingName}
                                        className="p-3 bg-green-50 text-green-600 hover:bg-green-100 rounded-2xl transition-all disabled:opacity-50"
                                    >
                                        <Check className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={handleCancelName}
                                        className="p-3 bg-gray-50 text-gray-500 hover:bg-gray-100 rounded-2xl transition-all"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 mb-6 group/title w-fit">
                                <h1 className="text-5xl font-black text-[#2d3142] tracking-tighter">
                                    {moodboard?.moodboard_name}
                                </h1>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-2.5 text-gray-300 bg-gray-50 hover:bg-[#d9a88a] hover:text-white rounded-2xl opacity-0 group-hover/title:opacity-100 transition-all shadow-sm"
                                >
                                    <Edit2 className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                        <div className="flex items-center gap-4">
                            <div className="px-4 py-1.5 bg-gray-100 text-gray-500 rounded-full text-xs font-bold ring-1 ring-gray-200 shadow-sm">
                                Project: {project?.projectName}
                            </div>
                            <div className="px-4 py-1.5 bg-[#fef7f2] text-[#d9a88a] rounded-full text-xs font-bold ring-1 ring-[#d9a88a]/20 shadow-sm">
                                {products.length} Products
                            </div>
                        </div>
                    </div>

                    {/* Visualizer Canvas Content (List Column) */}
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-[#f8f7f5] rounded-[32px] border border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                    <MonitorPlay className="w-6 h-6 text-[#d9a88a]" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-[#2d3142]">Materials on Board</h2>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                        {localBoardItems?.length || 0} items visualized
                                    </p>
                                </div>
                            </div>

                            {/* Est. Total Banner */}
                            <div className="bg-white border border-[#d9a88a]/20 rounded-2xl px-5 py-3 flex items-center gap-6 shadow-sm">
                                <span className="text-gray-400 font-bold uppercase tracking-tighter text-[10px]">Est. Total</span>
                                <span className="text-[#d9a88a] text-xl font-black tracking-tighter">
                                    ₹{(typeof moodboard?.totalBudget === 'number' ? moodboard.totalBudget : (estimation?.costing || 0)).toLocaleString('en-IN')}
                                </span>
                            </div>
                        </div>

                        {localBoardItems?.length > 0 ? (
                            <div className="space-y-4">
                                {localBoardItems.map((item, index) => {
                                    if (item.type === 'material') {
                                        return (
                                            <DetailBoardItemRow
                                                key={item.id}
                                                item={item}
                                                onUpdateItem={handleUpdateItem}
                                            />
                                        );
                                    }
                                    if (item.type === 'text') {
                                        return (
                                            <div key={index} className="bg-white border border-gray-100 p-6 rounded-[32px] flex items-center gap-6 group hover:shadow-md transition-all">
                                                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-[#fef7f2] transition-colors">
                                                    <Type className="w-6 h-6 text-[#d9a88a]" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-base font-bold text-gray-700 italic">
                                                        "{item.text || 'Empty Text'}"
                                                    </p>
                                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1 block">Canvas Memo</span>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })}
                            </div>
                        ) : (
                            <div className="py-20 bg-[#f8f7f5] rounded-[48px] border border-dashed border-gray-200 text-center">
                                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                    <MonitorPlay className="w-8 h-8 text-gray-200" />
                                </div>
                                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Canvas is empty</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Summaries & Actions */}
                <div className="w-full lg:w-[380px] space-y-6 lg:sticky lg:top-8">
                    <div className="bg-[#2d3142] rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#d9a88a] opacity-10 rounded-full -translate-y-12 translate-x-12 group-hover:scale-150 transition-transform duration-700" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 text-gray-400 font-black uppercase tracking-widest text-[10px] mb-8">
                                <ShoppingCart className="w-4 h-4 text-[#d9a88a]" />
                                Budget Summary
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <span className="text-gray-400 text-sm font-medium">Estimated Total</span>
                                    <div className="text-5xl font-black flex items-center gap-2 tracking-tighter text-[#d9a88a]">
                                        <IndianRupee className="w-8 h-8" />
                                        {(typeof moodboard?.totalBudget === 'number' ? moodboard.totalBudget : (estimation?.costing || 0)).toLocaleString('en-IN')}
                                    </div>
                                </div>

                                <button
                                    onClick={exportAsCSV}
                                    className="w-full flex items-center justify-center gap-2 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold hover:bg-[#d9a88a] hover:border-[#d9a88a] transition-all"
                                >
                                    <FileOutput className="w-4 h-4" />
                                    Download Material CSV
                                </button>

                                <div className="pt-6 border-t border-gray-700/50 flex justify-between gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Items</span>
                                        <span className="font-bold">{products.length} Products</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Tax Status</span>
                                        <span className="text-xs px-2 py-0.5 bg-gray-700/50 rounded-md font-bold text-white">INC. GST</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-[40px] p-8 shadow-sm">
                        <h4 className="font-black text-[#2d3142] mb-6 flex items-center gap-2 text-sm uppercase tracking-widest">
                            <Info className="w-4 h-4 text-[#d9a88a]" />
                            Quick Actions
                        </h4>
                        <div className="space-y-3">
                            <Button
                                onClick={() => {
                                    if (moodboard) {
                                        setActiveMoodboard(
                                            moodboard._id,
                                            moodboard.moodboard_name,
                                            project?._id,
                                            project?.projectName
                                        );
                                        router.push('/dashboard/visualizer');
                                    }
                                }}
                                className="w-full py-4 bg-[#d9a88a] text-white font-black rounded-2xl hover:bg-[#c59678] shadow-lg shadow-orange-100 transition-all flex items-center justify-center gap-2"
                            >
                                <MonitorPlay className="w-5 h-5" />
                                Open in Visualizer
                            </Button>
                            <Button
                                onClick={handleAddProducts}
                                className="w-full py-4 bg-white border border-gray-200 text-[#2d3142] font-black rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Add Products
                            </Button>
                            <Button
                                onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this moodboard?')) {
                                        deleteMutation.mutate(moodboardId, {
                                            onSuccess: () => router.push(`/dashboard/projects/${projectId}/moodboards`)
                                        });
                                    }
                                }}
                                className="w-full py-4 border border-red-50 text-red-500 font-black rounded-2xl hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                            >
                                <Trash2 className="w-5 h-5" />
                                Delete Moodboard
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DetailBoardItemRow({ item, onUpdateItem }) {
    const [localPrice, setLocalPrice] = useState(String(item.price || 0));
    const m = item.material || {};
    const iName = getProductName(m);
    const thumb = getProductThumbnail(m);
    const categoryName = getProductCategory(m);

    const handlePriceChange = (e) => {
        const val = e.target.value;
        if (val === '' || /^\d*\.?\d*$/.test(val)) {
            setLocalPrice(val);
            if (val !== '' && !val.endsWith('.')) {
                onUpdateItem(item.id, { price: Number(val) });
            }
        }
    };

    return (
        <div className="bg-white border border-gray-100 p-4 rounded-3xl hover:shadow-md transition-all space-y-4">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl relative overflow-hidden shrink-0 border border-gray-100">
                    <img src={thumb} alt={iName} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-base font-bold text-[#2d3142] truncate">{iName}</h4>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        {categoryName}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
                <div className="flex-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Quantity</span>
                    <div className="flex items-center justify-between bg-gray-50 rounded-xl p-1.5 border border-gray-100">
                        <button
                            onClick={() => onUpdateItem(item.id, { quantity: Math.max(1, (item.quantity || 1) - 1) })}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-gray-400 hover:text-[#d9a88a] shadow-sm transition-all"
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-bold text-[#2d3142]">{item.quantity || 1}</span>
                        <button
                            onClick={() => onUpdateItem(item.id, { quantity: (item.quantity || 1) + 1 })}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-gray-400 hover:text-[#d9a88a] shadow-sm transition-all"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="flex-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Unit Price (₹)</span>
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
                        className="w-full h-11 px-4 rounded-xl bg-gray-50 border border-gray-100 focus:border-[#d9a88a] focus:bg-white text-sm font-bold text-[#2d3142] outline-none transition-all"
                    />
                </div>
            </div>
        </div>
    );
}
