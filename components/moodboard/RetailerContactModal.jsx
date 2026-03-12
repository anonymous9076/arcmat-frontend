import { useState } from 'react';
import { useCreateRetailerRequest } from '@/hooks/useRetailerRequest';
import { Loader2, X, Users2 } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function RetailerContactModal({ isOpen, onClose, projectId, materialId, materialName }) {
    const createMutation = useCreateRetailerRequest();
    const [city, setCity] = useState('');
    const [notes, setNotes] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(
            {
                projectId,
                materialId,
                materialName,
                city,
                notes
            },
            { onSuccess: onClose }
        );
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl relative animate-in zoom-in-95 duration-200 cursor-default"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-[#fef7f2]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#d9a88a]">
                            <Users2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#2d3142]">Request Retailer Contact</h2>
                            <p className="text-sm font-bold text-gray-500 mt-0.5">{materialName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-sm font-medium text-gray-600 mb-6 bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 leading-relaxed">
                        Need to source this material directly? Let us know which city you're looking to purchase in, and our team will connect you with an authorized retailer shortly.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">City for Procurement</label>
                            <input
                                required
                                value={city}
                                onChange={e => setCity(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#d9a88a] focus:ring-1 focus:ring-[#d9a88a] outline-none text-sm font-medium transition-all"
                                placeholder="E.g. Delhi, Mumbai"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Additional Notes (Optional)</label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#d9a88a] focus:ring-1 focus:ring-[#d9a88a] outline-none text-sm font-medium transition-all min-h-[80px] resize-none"
                                placeholder="E.g. Need bulk quantity of approx 50 sheets"
                            />
                        </div>

                        <div className="flex gap-3 justify-end items-center pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <Button
                                type="submit"
                                disabled={createMutation.isPending || !city}
                                className="bg-[#3c4153] hover:bg-[#2d3142] text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center min-w-[150px]"
                            >
                                {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Request Contact'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
