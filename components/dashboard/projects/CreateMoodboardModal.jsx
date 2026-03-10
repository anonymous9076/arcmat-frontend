'use client';

import { useState, useEffect } from 'react';
import { X, Layout, Loader2 } from 'lucide-react';
import projectOptions from '../sidebar/project-options.json';
import Button from '@/components/ui/Button';
import { useCreateMoodboard, useUpdateMoodboard } from '@/hooks/useMoodboard';

export default function CreateMoodboardModal({ isOpen, onClose, projectId, moodboard = null }) {
    const [name, setName] = useState('');
    const createMutation = useCreateMoodboard();
    const updateMutation = useUpdateMoodboard();

    const TEMPLATES = [
        'Living Room',
        'Bedroom',
        'Kitchen',
        'Bathroom',
        'Dining',
        'Lobby'
    ];

    const isEditing = !!moodboard;

    useEffect(() => {
        if (moodboard) {
            setName(moodboard.moodboard_name);
        } else {
            setName('');
        }
    }, [moodboard, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        if (isEditing) {
            updateMutation.mutate({
                id: moodboard._id,
                data: { moodboard_name: name }
            }, {
                onSuccess: () => onClose()
            });
        } else {
            createMutation.mutate({
                moodboard_name: name,
                projectId
            }, {
                onSuccess: () => onClose()
            });
        }
    };

    if (!isOpen) return null;

    const isLoading = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
                <div className="px-8 pt-8 pb-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-[#2d3142]">
                            {isEditing ? 'Edit Space' : 'New Space'}
                        </h2>
                        <p className="text-sm text-gray-400 font-medium">
                            {isEditing ? 'Update the name of your space' : 'Create a fresh canvas for your project ideas'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs uppercase font-black tracking-widest text-[#2d3142] ml-1">
                            Space Name
                        </label>
                        <div className="relative">
                            <Layout className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Living Room Concept, Minimal Kitchen, etc."
                                className="w-full pl-12 pr-6 py-4 bg-[#f3f4f6] border-transparent focus:bg-white focus:border-[#d9a88a] focus:ring-0 rounded-2xl transition-all text-[#2d3142] font-bold placeholder:text-gray-300"
                                required
                            />
                        </div>
                    </div>

                    {!isEditing && (
                        <div className="space-y-3">
                            <label className="text-xs uppercase font-black tracking-widest text-[#2d3142] ml-1">
                                Quick Templates
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {TEMPLATES.map(template => (
                                    <button
                                        key={template}
                                        type="button"
                                        onClick={() => setName(template)}
                                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${name === template
                                            ? 'bg-[#d9a88a] text-white border-[#d9a88a]'
                                            : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-[#d9a88a]/30 hover:text-[#d9a88a]'
                                            }`}
                                    >
                                        {template}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 px-6 border border-gray-200 text-gray-500 font-bold rounded-2xl hover:bg-gray-50 transition-all"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="flex-2 py-4 bg-[#d9a88a] text-white font-black rounded-2xl hover:bg-[#c59678] shadow-lg shadow-orange-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : isEditing ? 'Update Space' : 'Create Space'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
