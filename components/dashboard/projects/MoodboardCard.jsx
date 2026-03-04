'use client';

import { useState } from 'react';
import { Layout, IndianRupee, ArrowRight, Trash2, Plus, Edit2, Check, X, MonitorPlay, FolderOpen, Camera } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import useProjectStore from '@/store/useProjectStore';
import { useUpdateMoodboard } from '@/hooks/useMoodboard';
import { getProductImageUrl } from '@/lib/productUtils';
import { toast } from 'sonner';
import CoverSelectionModal from './CoverSelectionModal';

export default function MoodboardCard({ moodboard, projectId, onDelete }) {
    const { _id, moodboard_name, estimatedCostId } = moodboard;
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(moodboard_name);
    const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);

    const { mutate: updateMoodboard, isPending } = useUpdateMoodboard();

    const handleSave = () => {
        if (!editName.trim()) {
            toast.error('Moodboard name cannot be empty');
            return;
        }

        if (editName === moodboard_name) {
            setIsEditing(false);
            return;
        }

        updateMoodboard(
            { id: _id, data: { moodboard_name: editName } },
            {
                onSuccess: () => {
                    setIsEditing(false);
                }
            }
        );
    };

    const handleCancel = () => {
        setEditName(moodboard_name);
        setIsEditing(false);
    };

    const handleCoverSelect = (selection) => {
        const formData = new FormData();
        if (selection.type === 'file') {
            formData.append('coverImage', selection.file);
        } else {
            formData.append('coverImage', selection.url);
        }

        updateMoodboard(
            { id: _id, data: formData },
            {
                onSuccess: () => {
                    toast.success('Cover image updated');
                    setIsCoverModalOpen(false);
                }
            }
        );
    };

    const getPreviewItems = (board) => {
        if (!board?.canvasState?.length) return [];
        return board.canvasState
            .filter(item => item.type === 'material' && item.material)
            .slice(0, 4)
            .map(item => {
                const m = item.material;
                if (m.images?.length) return getProductImageUrl(m.images[0]);
                if (m.variant_images?.length) return getProductImageUrl(m.variant_images[0]);
                if (typeof m.productId === 'object' && m.productId?.product_images?.length)
                    return getProductImageUrl(m.productId.product_images[0]);
                return '/Icons/arcmatlogo.svg';
            });
    };

    const previewImages = getPreviewItems(moodboard);
    const itemCount = moodboard.canvasState?.filter(i => i.type === 'material').length || 0;

    return (
        <div className="bg-white rounded-[32px] border border-gray-100 p-5 shadow-sm hover:shadow-xl hover:shadow-orange-50/20 transition-all duration-500 group relative flex flex-col h-full">
            {/* Action Buttons (Top Right Overlay) */}
            <div className="absolute top-4 right-4 flex gap-1 opaque group-hover:opacity-100 transition-opacity z-20">
                <button
                    onClick={(e) => { e.preventDefault(); onDelete(_id); }}
                    className="p-2 bg-white/80 backdrop-blur shadow-sm text-gray-400 hover:text-red-500 rounded-xl transition-all"
                    title="Delete moodboard"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Image Grid Preview */}
            <div className="relative aspect-square mb-6 group/preview">
                <Link
                    href={`/dashboard/projects/${projectId}/moodboards/${_id}`}
                    className="absolute inset-0 rounded-[24px] overflow-hidden bg-gray-50 flex flex-col border border-gray-100 group-hover/preview:border-[#d9a88a]/20 transition-colors z-10"
                    onClick={() => useProjectStore.getState().setActiveMoodboard(_id, moodboard_name, projectId, "")}
                >
                    {moodboard.coverImage ? (
                        <div className="relative h-full w-full">
                            <Image src={moodboard.coverImage} alt="" fill className="object-cover group-hover/preview:scale-110 transition-transform duration-700" />
                        </div>
                    ) : (
                        <div className="h-full w-full grid grid-cols-2 grid-rows-2 gap-[2px]">
                            {previewImages.length > 0 ? (
                                <>
                                    {previewImages.length === 1 ? (
                                        <div className="col-span-2 row-span-2 relative h-full w-full">
                                            <Image src={previewImages[0]} alt="" fill className="object-cover group-hover/preview:scale-110 transition-transform duration-700" />
                                        </div>
                                    ) : previewImages.length === 2 ? (
                                        <>
                                            <div className="row-span-2 relative h-full w-full"><Image src={previewImages[0]} alt="" fill className="object-cover group-hover/preview:scale-105 transition-transform duration-700" /></div>
                                            <div className="row-span-2 relative h-full w-full"><Image src={previewImages[1]} alt="" fill className="object-cover group-hover/preview:scale-105 transition-transform duration-700" /></div>
                                        </>
                                    ) : previewImages.length === 3 ? (
                                        <>
                                            <div className="row-span-2 relative h-full w-full"><Image src={previewImages[0]} alt="" fill className="object-cover group-hover/preview:scale-105 transition-transform duration-700" /></div>
                                            <div className="relative h-full w-full"><Image src={previewImages[1]} alt="" fill className="object-cover group-hover/preview:scale-105 transition-transform duration-700" /></div>
                                            <div className="relative h-full w-full"><Image src={previewImages[2]} alt="" fill className="object-cover group-hover/preview:scale-105 transition-transform duration-700" /></div>
                                        </>
                                    ) : (
                                        previewImages.map((img, i) => (
                                            <div key={i} className="relative h-full w-full hover:z-10 bg-white">
                                                <Image src={img} alt="" fill className="object-cover group-hover/preview:scale-110 transition-transform duration-700" />
                                            </div>
                                        ))
                                    )}
                                </>
                            ) : (
                                <div className="col-span-2 row-span-2 flex flex-col items-center justify-center gap-3 text-gray-200">
                                    <Layout className="w-10 h-10" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">No Items Added</span>
                                </div>
                            )}
                        </div>
                    )}
                </Link>

                {/* Cover Edit Button */}
                <button
                    onClick={() => setIsCoverModalOpen(true)}
                    className="absolute top-4 left-4 p-2.5 bg-white/90 backdrop-blur text-gray-500 hover:text-[#d9a88a] rounded-xl shadow-lg opacity-0 translate-y-2 group-hover/preview:opacity-100 group-hover/preview:translate-y-0 transition-all duration-300 z-20"
                    title="Change Cover"
                >
                    <Camera className="w-4 h-4" />
                </button>

                {/* Visualizer Floating Button - Moved OUTSIDE the Link above */}
                <Link
                    href="/dashboard/visualizer"
                    onClick={() => {
                        useProjectStore.getState().setActiveMoodboard(_id, moodboard_name, projectId, "");
                    }}
                    className="absolute bottom-4 right-4 p-3 bg-white/95 backdrop-blur text-[#d9a88a] rounded-2xl shadow-xl opacity-0 translate-y-2 group-hover/preview:opacity-100 group-hover/preview:translate-y-0 transition-all duration-300 hover:scale-110 active:scale-95 z-20"
                    title="Open Visualizer"
                >
                    <MonitorPlay className="w-5 h-5" />
                </Link>
            </div>

            {/* Info Section */}
            <div className="px-1 flex flex-col flex-1">
                <div className="flex justify-between items-start gap-4 mb-2">
                    <div className="min-w-0 flex-1">
                        {isEditing ? (
                            <div className="flex items-center gap-2 mb-1">
                                <input
                                    autoFocus
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="text-lg font-bold text-[#2d3142] w-full border-b-2 border-[#d9a88a] focus:outline-none bg-transparent"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSave();
                                        if (e.key === 'Escape') handleCancel();
                                    }}
                                />
                                <button onClick={handleSave} className="p-1 text-[#d9a88a]"><Check className="w-4 h-4" /></button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 group/name">
                                <h3 className="text-lg font-extrabold text-[#2d3142] truncate group-hover:text-[#d9a88a] transition-colors">
                                    {moodboard_name}
                                </h3>
                                <button
                                    onClick={(e) => { e.preventDefault(); setIsEditing(true); }}
                                    className="p-1 text-gray-300 hover:text-[#d9a88a] transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                        <p className="text-xs text-gray-400 font-bold tracking-tight">
                            {itemCount} {itemCount === 1 ? 'item' : 'items'} • ArcMat
                        </p>
                    </div>
                </div>

                <div className="mt-auto pt-4 flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">Estimated Cost</span>
                        <div className="flex items-center gap-1 text-base font-black text-[#d9a88a]">
                            <IndianRupee className="w-3.5 h-3.5" />
                            {estimatedCostId?.costing?.toLocaleString('en-IN') || '0'}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/productlist"
                            onClick={() => useProjectStore.getState().setActiveMoodboard(_id, moodboard_name, projectId, "")}
                            className="p-2.5 bg-[#fef7f2] text-[#d9a88a] hover:bg-[#d9a88a] hover:text-white rounded-xl transition-all"
                            title="Add Items"
                        >
                            <Plus className="w-5 h-5" />
                        </Link>
                        <Link
                            href={`/dashboard/projects/${projectId}/moodboards/${_id}`}
                            className="p-2.5 bg-[#2d3142] text-white hover:bg-[#d9a88a] rounded-xl transition-all"
                            title="View Details"
                        >
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </div>

            <CoverSelectionModal
                isOpen={isCoverModalOpen}
                onClose={() => setIsCoverModalOpen(false)}
                onSelect={handleCoverSelect}
                materials={moodboard.canvasState?.filter(i => i.type === 'material') || []}
                isUploading={isPending}
            />
        </div>
    );
}
