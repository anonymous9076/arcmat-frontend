'use client';

import { useState } from 'react';
import { Layout, IndianRupee, ArrowRight, Trash2, Plus, Edit2, Check, X } from 'lucide-react';
import Link from 'next/link';
import useProjectStore from '@/store/useProjectStore';
import { useUpdateMoodboard } from '@/hooks/useMoodboard';
import { toast } from 'sonner';

export default function MoodboardCard({ moodboard, projectId, onDelete }) {
    const { _id, moodboard_name, estimatedCostId } = moodboard;
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(moodboard_name);

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

    return (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-300 group relative">
            <div className="flex justify-between items-start mb-6">
                <div className="space-y-1 w-full mr-4">
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <input
                                autoFocus
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="text-xl font-bold text-[#2d3142] w-full border-b-2 border-[#d9a88a] focus:outline-none bg-transparent pb-1"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSave();
                                    if (e.key === 'Escape') handleCancel();
                                }}
                            />
                            <button
                                onClick={handleSave}
                                disabled={isPending}
                                className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg shrink-0 transition-colors disabled:opacity-50"
                                title="Save"
                            >
                                <Check className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={isPending}
                                className="p-1.5 bg-gray-50 text-gray-400 hover:bg-gray-100 rounded-lg shrink-0 transition-colors disabled:opacity-50"
                                title="Cancel"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-[#2d3142] group-hover:text-[#d9a88a] transition-colors line-clamp-1">
                                {moodboard_name}
                            </h3>
                            <button
                                onClick={(e) => { e.preventDefault(); setIsEditing(true); }}
                                className="p-1.5 text-gray-400 hover:text-[#d9a88a] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Rename moodboard"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 text-sm text-gray-400 font-medium">
                        <Layout className="w-4 h-4" />
                        <span>Moodboard</span>
                    </div>
                </div>
                <button
                    onClick={(e) => { e.preventDefault(); onDelete(_id); }}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0"
                    title="Delete moodboard"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>

            <div className="bg-[#fef7f2] rounded-2xl p-4 mb-6">
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest block mb-1">
                    Estimated Cost
                </span>
                <div className="flex items-center gap-1 text-lg font-black text-[#d9a88a]">
                    <IndianRupee className="w-4 h-4" />
                    {estimatedCostId?.costing?.toLocaleString('en-IN') || '0'}
                </div>
            </div>

            <div className="flex gap-3 mt-6">
                <Link
                    href={`/dashboard/projects/${projectId}/moodboards/${_id}`}
                    className="flex-[1.2] flex items-center justify-center gap-2 py-3 bg-[#2d3142] text-white hover:bg-[#d9a88a] rounded-2xl font-bold transition-all group/btn shadow-lg shadow-gray-100"
                >
                    View Details
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>

                <Link
                    href="/productlist"
                    onClick={() => useProjectStore.getState().setActiveMoodboard(_id, moodboard_name, projectId, "")}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border-2 border-gray-100 text-[#d9a88a] hover:border-[#d9a88a] rounded-2xl font-bold transition-all group/add hover:bg-[#fef7f2]"
                >
                    <Plus className="w-4 h-4" />
                    Add Items
                </Link>
            </div>
        </div>
    );
}
