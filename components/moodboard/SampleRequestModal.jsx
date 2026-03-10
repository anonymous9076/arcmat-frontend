import { useState } from 'react';
import { useCreateSampleRequest } from '@/hooks/useSampleRequest';
import { Loader2, X, PackageOpen } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function SampleRequestModal({ isOpen, onClose, projectId, spaceId, materialId, materialName }) {
    const createMutation = useCreateSampleRequest(projectId);
    const [notes, setNotes] = useState('');
    const [address, setAddress] = useState({
        name: '',
        phone: '',
        address: '',
        city: '',
        pincode: ''
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate(
            {
                spaceId,
                materialId,
                materialName,
                shippingAddress: address,
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
                            <PackageOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#2d3142]">Request Material Sample</h2>
                            <p className="text-sm font-bold text-gray-500 mt-0.5">{materialName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-4 mb-8">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Recipient Name</label>
                            <input
                                required
                                value={address.name}
                                onChange={e => setAddress({ ...address, name: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#d9a88a] focus:ring-1 focus:ring-[#d9a88a] outline-none text-sm font-medium transition-all"
                                placeholder="E.g. John Doe"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Phone</label>
                                <input
                                    required
                                    value={address.phone}
                                    onChange={e => setAddress({ ...address, phone: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#d9a88a] focus:ring-1 focus:ring-[#d9a88a] outline-none text-sm font-medium transition-all"
                                    placeholder="Mobile number"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Pincode</label>
                                <input
                                    required
                                    value={address.pincode}
                                    onChange={e => setAddress({ ...address, pincode: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#d9a88a] focus:ring-1 focus:ring-[#d9a88a] outline-none text-sm font-medium transition-all"
                                    placeholder="E.g. 110001"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Shipping Address</label>
                            <textarea
                                required
                                value={address.address}
                                onChange={e => setAddress({ ...address, address: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#d9a88a] focus:ring-1 focus:ring-[#d9a88a] outline-none text-sm font-medium transition-all min-h-[80px] resize-none"
                                placeholder="Full delivery address"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">City / Region</label>
                            <input
                                required
                                value={address.city}
                                onChange={e => setAddress({ ...address, city: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#d9a88a] focus:ring-1 focus:ring-[#d9a88a] outline-none text-sm font-medium transition-all"
                                placeholder="E.g. New Delhi"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Additional Notes (Optional)</label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#d9a88a] focus:ring-1 focus:ring-[#d9a88a] outline-none text-sm font-medium transition-all min-h-[60px] resize-none"
                                placeholder="Any specific requirements or size preferences?"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end items-center">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <Button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="bg-[#3c4153] hover:bg-[#2d3142] text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center min-w-[140px]"
                        >
                            {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Request Sample'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
