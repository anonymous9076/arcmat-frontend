'use client';

import { useParams, useRouter } from 'next/navigation';
import { useGetMoodboard, useDeleteMoodboard } from '@/hooks/useMoodboard';
import { useUpdateEstimatedCost } from '@/hooks/useEstimatedCost';
import { useQueryClient } from '@tanstack/react-query';
import useProjectStore from '@/store/useProjectStore';
import { ArrowLeft, IndianRupee, Layout, Package, ShoppingCart, Trash2, Loader2, Info, X, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import { toast } from 'sonner';
import Image from 'next/image';

export default function MoodboardDetailPage() {
    const { projectId, moodboardId } = useParams();
    const router = useRouter();
    const setActiveMoodboard = useProjectStore(state => state.setActiveMoodboard);

    const { data: moodboardData, isLoading } = useGetMoodboard(moodboardId);
    const deleteMutation = useDeleteMoodboard();
    const updateEstimationMutation = useUpdateEstimatedCost();
    const queryClient = useQueryClient();

    const moodboard = moodboardData?.data;
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
            router.push('/dashboard/products');
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

            <div className="flex flex-col lg:flex-row gap-10">
                <div className="flex-1 space-y-10">
                    {/* Header */}
                    <div>
                        <div className="flex items-center gap-3 text-[#d9a88a] font-black uppercase tracking-widest text-xs mb-3">
                            <Layout className="w-4 h-4" />
                            Moodboard Detail
                        </div>
                        <h1 className="text-5xl font-black text-[#2d3142] mb-4 tracking-tighter">
                            {moodboard?.moodboard_name}
                        </h1>
                        <div className="flex items-center gap-4">
                            <div className="px-4 py-1.5 bg-gray-100 text-gray-500 rounded-full text-xs font-bold">
                                Project: {project?.projectName}
                            </div>
                            <div className="px-4 py-1.5 bg-[#fef7f2] text-[#d9a88a] rounded-full text-xs font-bold">
                                {products.length} Products
                            </div>
                        </div>
                    </div>

                    {/* Products List */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black text-[#2d3142] flex items-center gap-3">
                                <Package className="w-6 h-6 text-[#d9a88a]" />
                                Curated Products
                            </h2>
                        </div>

                        {products.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {products.map((rp, index) => {
                                    if (!rp) return null;
                                    const product = rp.productId || {};

                                    return (
                                        <div key={index} className="bg-white border border-gray-100 p-4 rounded-3xl flex items-center gap-6 hover:shadow-md transition-all group">
                                            <div className="w-24 h-24 bg-gray-50 rounded-2xl relative overflow-hidden shrink-0 border border-gray-50">
                                                {(rp.variant_images?.[0]?.secure_url || product.product_images?.[0]?.secure_url) ? (
                                                    <Image
                                                        src={rp.variant_images?.[0]?.secure_url || product.product_images?.[0]?.secure_url}
                                                        alt={product.product_name || 'Material'}
                                                        fill
                                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-200">
                                                        <Package className="w-8 h-8" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[10px] text-[#d9a88a] font-black uppercase tracking-widest mb-1">
                                                    {product.brand?.name || product.brand_name || 'Generic'}
                                                </div>
                                                <h4 className="text-lg font-bold text-[#2d3142] truncate group-hover:text-[#d9a88a] transition-colors">
                                                    {product.product_name || 'Untitled Material'}
                                                </h4>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-gray-400 text-sm line-clamp-1">
                                                        {product.sort_description || 'No description available'}
                                                    </p>
                                                    {rp.selling_price && (
                                                        <div className="bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100 flex items-center gap-1">
                                                            <IndianRupee className="w-3 h-3 text-[#d9a88a]" />
                                                            <span className="text-xs font-black text-[#2d3142]">{rp.selling_price.toLocaleString('en-IN')}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 shrink-0">
                                                <div className="text-right">
                                                    <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">
                                                        Status
                                                    </div>
                                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${rp.status === 1 ? 'bg-green-50 text-green-500' : 'bg-orange-50 text-orange-500'}`}>
                                                        {rp.status === 1 ? 'Available' : 'Pending'}
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleRemoveProduct(rp._id)}
                                                    disabled={updateEstimationMutation.isPending}
                                                    className="p-2.5 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                                    title="Remove from list"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-20 bg-gray-50 rounded-[40px] border border-dashed border-gray-200 text-center">
                                <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-400 font-bold">No products added yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar - Cost Summary */}
                <div className="w-full lg:w-[380px] space-y-8">
                    <div className="bg-[#2d3142] rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#d9a88a] opacity-10 rounded-full -translate-y-12 translate-x-12" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 text-gray-400 font-black uppercase tracking-widest text-[10px] mb-8">
                                <ShoppingCart className="w-4 h-4" />
                                Budget Summary
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <span className="text-gray-400 text-sm font-medium">Estimated Total</span>
                                    <div className="text-5xl font-black flex items-center gap-2 tracking-tighter">
                                        <IndianRupee className="w-8 h-8 text-[#d9a88a]" />
                                        {estimation?.costing?.toLocaleString('en-IN') || '0'}
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-700/50">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-gray-400 text-sm font-medium">Product Count</span>
                                        <span className="font-bold">{products.length} Items</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 text-sm font-medium">Tax Status</span>
                                        <span className="text-xs px-2 py-0.5 bg-gray-700/50 rounded-md font-bold">INC. GST</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-[40px] p-8">
                        <h4 className="font-black text-[#2d3142] mb-6 flex items-center gap-2">
                            <Info className="w-5 h-5 text-[#d9a88a]" />
                            Quick Actions
                        </h4>
                        <div className="space-y-4">
                            <Button
                                onClick={handleAddProducts}
                                className="w-full py-4 bg-[#d9a88a] text-white font-black rounded-2xl hover:bg-[#c59678] shadow-lg shadow-orange-100 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Add Products
                            </Button>
                            <Button
                                className="w-full py-4 bg-[#f3f4f6] text-[#2d3142] font-black rounded-2xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                            >
                                Share with Client
                            </Button>
                            <Button
                                onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this moodboard?')) {
                                        deleteMutation.mutate(moodboardId, {
                                            onSuccess: () => router.push(`/dashboard/projects/${projectId}/moodboards`)
                                        });
                                    }
                                }}
                                className="w-full py-4 border border-red-100 text-red-500 font-black rounded-2xl hover:bg-red-50 transition-all flex items-center justify-center gap-2"
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
