'use client';

import { useState, useEffect } from 'react';
import { X, MessageSquare, Send, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import Button from '@/components/ui/Button';

export default function StatusUpdateModal({
    isOpen,
    onClose,
    onConfirm,
    status,
    subject,
    isPending
}) {
    const [comment, setComment] = useState('');

    useEffect(() => {
        if (isOpen) {
            setComment('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(comment);
    };

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div
                className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-8 pb-0 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#E09A74]/10 rounded-2xl flex items-center justify-center text-[#E09A74]">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">Update Status</h2>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                Set to <span className="text-[#E09A74]">{status}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-3">
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Ticket Subject</span>
                            <span className="font-bold text-gray-700 truncate block">{subject}</span>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Status Update Comment (Optional)</label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Add a note about this update..."
                                rows={4}
                                className="w-full bg-white border-2 border-gray-100 rounded-[24px] p-5 font-bold text-gray-900 focus:border-[#E09A74] focus:ring-0 transition-all placeholder:text-gray-300 resize-none"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-14 rounded-2xl border-2 border-gray-100 text-gray-400 font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex-2 h-14 bg-[#2C2D35] hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl shadow-gray-200 disabled:opacity-50"
                        >
                            {isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    Confirm Update
                                    <Send className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
