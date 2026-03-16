'use client';

import { useState } from 'react';
import { X, Loader2, Package, MapPin, Truck } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useCreateSampleRequest } from '@/hooks/useSampleRequest';
import { toast } from 'sonner';

export default function RequestSampleModal({ isOpen, onClose, product, projectId, retailerId }) {
    const [address, setAddress] = useState({
        name: '',
        phone: '',
        address: '',
        city: '',
        pincode: ''
    });
    const [notes, setNotes] = useState('');
    
    const createSampleMutation = useCreateSampleRequest(projectId);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!address.address || !address.city || !address.phone) {
            toast.warning("Please fill in the shipping address.");
            return;
        }

        createSampleMutation.mutate({
            productId: product._id,
            productName: product.product_name,
            materialId: product._id,
            materialName: product.product_name,
            shippingAddress: address,
            notes: notes,
            retailerId: retailerId
        }, {
            onSuccess: () => {
                onClose();
            }
        });
    };

    return (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="p-8 pb-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-[#2d3142] flex items-center gap-2">
                            <Package className="w-6 h-6 text-[#d9a88a]" />
                            Request Sample
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="px-8 py-4 overflow-y-auto custom-scrollbar flex-1">
                    <div className="bg-gray-50 rounded-3xl p-4 flex items-center gap-4 mb-6 border border-gray-100">
                        <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden shadow-sm shrink-0 border border-gray-50">
                            <img
                                src={product.product_images?.[0]?.secure_url || product.secure_url || '/Icons/arcmatlogo.svg'}
                                alt=""
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-[#2d3142] truncate">{product.product_name}</h4>
                            <p className="text-xs text-gray-400 font-medium">{product.brand?.name || 'Brand'}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">
                                Shipping Details
                            </label>
                            <input
                                placeholder="Receiver's Name"
                                value={address.name}
                                onChange={(e) => setAddress({ ...address, name: e.target.value })}
                                className="w-full p-4 rounded-2xl border-2 border-gray-50 bg-white font-bold text-[#2d3142] focus:border-[#d9a88a] outline-none transition-all placeholder:text-gray-300"
                            />
                            <input
                                placeholder="Phone Number"
                                value={address.phone}
                                onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                                className="w-full p-4 rounded-2xl border-2 border-gray-50 bg-white font-bold text-[#2d3142] focus:border-[#d9a88a] outline-none transition-all placeholder:text-gray-300"
                            />
                            <textarea
                                placeholder="Full Shipping Address"
                                value={address.address}
                                onChange={(e) => setAddress({ ...address, address: e.target.value })}
                                rows={3}
                                className="w-full p-4 rounded-2xl border-2 border-gray-50 bg-white font-bold text-[#2d3142] focus:border-[#d9a88a] outline-none transition-all placeholder:text-gray-300 resize-none"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    placeholder="City"
                                    value={address.city}
                                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                    className="w-full p-4 rounded-2xl border-2 border-gray-50 bg-white font-bold text-[#2d3142] focus:border-[#d9a88a] outline-none transition-all placeholder:text-gray-300"
                                />
                                <input
                                    placeholder="Pincode"
                                    value={address.pincode}
                                    onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                                    className="w-full p-4 rounded-2xl border-2 border-gray-50 bg-white font-bold text-[#2d3142] focus:border-[#d9a88a] outline-none transition-all placeholder:text-gray-300"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">
                                Additional Notes (Optional)
                            </label>
                            <textarea
                                placeholder="Any specific requirements for the sample..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                                className="w-full p-4 rounded-2xl border-2 border-gray-50 bg-white font-bold text-[#2d3142] focus:border-[#d9a88a] outline-none transition-all placeholder:text-gray-300 resize-none"
                            />
                        </div>
                    </div>
                    
                    <div className="mt-6 p-4 bg-orange-50 rounded-2xl border border-dashed border-orange-200">
                        <div className="flex gap-3">
                            <Truck className="w-5 h-5 text-orange-500 shrink-0" />
                            <p className="text-xs text-orange-700 leading-relaxed font-medium">
                                Samples are usually dispatched within 2-3 business days. You can track the status in your Architect Dashboard.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-8 pt-4 flex gap-3">
                    <Button
                        onClick={onClose}
                        className="flex-1 py-4 px-6 border border-gray-200 text-gray-500 font-bold rounded-2xl hover:bg-gray-50 transition-all font-inter"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={createSampleMutation.isPending}
                        className="flex-2 py-4 bg-[#d9a88a] text-white font-black rounded-2xl hover:bg-[#c59678] shadow-lg shadow-orange-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                        {createSampleMutation.isPending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            'Request Sample'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
