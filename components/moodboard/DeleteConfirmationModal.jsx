'use client';

import { X, AlertTriangle, Trash2 } from 'lucide-react';

export default function DeleteConfirmationModal({ isOpen, onClose, onConfirm, title, message }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div
                className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header/Icon Area */}
                <div className="relative pt-8 pb-4 flex flex-col items-center">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                        <Trash2 className="w-8 h-8 text-red-500" />
                    </div>

                    <h3 className="text-xl font-black text-[#1a1a2e] px-6 text-center">
                        {title || 'Delete Render?'}
                    </h3>
                </div>

                {/* Body */}
                <div className="px-8 pb-8">
                    <p className="text-center text-gray-500 font-medium leading-relaxed">
                        {message || 'This action cannot be undone. This render will be permanently removed from your space.'}
                    </p>
                </div>

                {/* Footer/Actions */}
                <div className="grid grid-cols-2 gap-3 px-6 pb-6 mt-2">
                    <button
                        onClick={onClose}
                        className="px-6 py-3.5 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-2xl transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="px-6 py-3.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-2xl shadow-lg shadow-red-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}
