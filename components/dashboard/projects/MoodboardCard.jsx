'use client';

import { Layout, IndianRupee, ArrowRight, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';
import useProjectStore from '@/store/useProjectStore';

export default function MoodboardCard({ moodboard, projectId, onDelete }) {
    const { _id, moodboard_name, estimatedCostId } = moodboard;

    return (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-300 group relative">
            <div className="flex justify-between items-start mb-6">
                <div className="space-y-1">
                    <h3 className="text-xl font-bold text-[#2d3142] group-hover:text-[#d9a88a] transition-colors">
                        {moodboard_name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-sm text-gray-400 font-medium">
                        <Layout className="w-4 h-4" />
                        <span>Moodboard</span>
                    </div>
                </div>
                <button
                    onClick={(e) => { e.preventDefault(); onDelete(_id); }}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
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
                    href="/dashboard/products"
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
