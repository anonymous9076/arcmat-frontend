'use client';
import { X, AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function ConfirmActivateModal({ isOpen, onClose, onConfirm, isLoading }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-linear-to-r from-green-50 to-emerald-50">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Confirm Activation</h2>
                            <p className="text-xs text-gray-500 font-medium">This action will affect all products</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/50 rounded-full transition-colors text-gray-400"
                        disabled={isLoading}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <p className="text-sm text-amber-900 font-medium">
                            ⚠️ You are about to activate <strong>ALL products and variants</strong> for this brand.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm text-gray-700">
                            This action will:
                        </p>
                        <ul className="space-y-1.5 text-sm text-gray-600 ml-4">
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">✓</span>
                                <span>Set all products to <strong>Active</strong> status</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">✓</span>
                                <span>Set all variants to <strong>Active</strong> status</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">✓</span>
                                <span>Make products visible to customers</span>
                            </li>
                        </ul>
                    </div>

                    <p className="text-xs text-gray-500 italic">
                        You can deactivate individual products later if needed.
                    </p>
                </div>

                {/* Actions */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                    <Button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 bg-white text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-100 border border-gray-200"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Activating...
                            </div>
                        ) : (
                            'Activate All'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
