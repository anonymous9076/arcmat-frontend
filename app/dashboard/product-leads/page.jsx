'use client';

import React from 'react';
import { useGetProductLeads, useUpdateProductLeadStatus } from '@/hooks/useProduct';
import { MessageSquare, User, Package, Calendar, MapPin, Phone, Mail, XCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { getProductThumbnail } from '@/lib/productUtils';

const Field = ({ label, value, icon: Icon }) => (
    <div>
        <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-[#2d3142]">
            {Icon && <Icon className="w-3.5 h-3.5 text-gray-300 shrink-0" />}
            <span className="truncate">{value || '—'}</span>
        </div>
    </div>
);

export default function ProductLeadsPage() {
    const { data: leadsData, isLoading } = useGetProductLeads();
    const { mutate: updateStatus, isPending: isUpdating } = useUpdateProductLeadStatus();
    const [selectedLead, setSelectedLead] = React.useState(null);
    const [pendingStatus, setPendingStatus] = React.useState('');

    React.useEffect(() => {
        if (selectedLead) setPendingStatus(selectedLead.status);
    }, [selectedLead]);

    const leads = leadsData?.data || [];

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-[#d9a88a] animate-spin" />
            </div>
        );
    }

    const statusColor = (s) => {
        if (s === 'Pending') return 'bg-amber-50 text-amber-500 border-amber-100';
        if (s === 'Reviewed') return 'bg-blue-50 text-blue-500 border-blue-100';
        return 'bg-green-50 text-green-500 border-green-100';
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-[#2d3142] mb-1 flex items-center gap-2.5">
                    <MessageSquare className="w-6 h-6 text-[#d9a88a]" />
                    Product Leads
                </h1>
                <p className="text-sm text-gray-400">Review and manage customer inquiries.</p>
            </header>

            {leads.length === 0 ? (
                <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center">
                    <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-4" />
                    <p className="text-sm text-gray-400">No inquiries yet. They will appear here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {leads.map((lead) => (
                        <div
                            key={lead._id}
                            onClick={() => setSelectedLead(lead)}
                            className="bg-white rounded-3xl border border-gray-100 px-6 py-5 hover:shadow-md hover:shadow-gray-100/60 transition-all duration-200 cursor-pointer group"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
                                <div className="flex gap-3.5 col-span-1 items-center">
                                    <div className="w-12 h-12 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 shrink-0">
                                        <img src={getProductThumbnail(lead.productId)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm text-[#2d3142] truncate">{lead.productId?.product_name || lead.productId?.name || 'Product'}</p>
                                        <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                                            <Package className="w-3 h-3" />{lead.productId?.brand?.name || 'Brand'}
                                        </p>
                                    </div>
                                </div>

                                <div className="col-span-1 lg:border-l border-gray-100 lg:pl-5">
                                    <p className="text-sm text-[#2d3142]">{lead.firstName} {lead.lastName}</p>
                                    <p className="text-[11px] text-gray-400 truncate mt-0.5">{lead.email}</p>
                                </div>

                                <div className="col-span-1 lg:border-l border-gray-100 lg:pl-5">
                                    <div className="flex flex-wrap gap-1 mb-1">
                                        {lead.catalogue && <span className="px-2 py-0.5 bg-blue-50 text-blue-400 text-[10px] rounded-full border border-blue-100">Catalogue</span>}
                                        {lead.priceList && <span className="px-2 py-0.5 bg-green-50 text-green-400 text-[10px] rounded-full border border-green-100">Price List</span>}
                                        {lead.bimCad && <span className="px-2 py-0.5 bg-purple-50 text-purple-400 text-[10px] rounded-full border border-purple-100">BIM/CAD</span>}
                                        {(!lead.catalogue && !lead.priceList && !lead.bimCad) && <span className="px-2 py-0.5 bg-gray-50 text-gray-400 text-[10px] rounded-full">General</span>}
                                    </div>
                                    <p className="text-[11px] text-gray-400">{format(new Date(lead.createdAt), 'dd MMM, yyyy')}</p>
                                </div>

                                <div className="col-span-1 flex justify-end">
                                    <span className={`px-3 py-1 rounded-full text-[10px] border ${statusColor(lead.status)}`}>
                                        {lead.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {selectedLead && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                    <div className="bg-white rounded-[32px] w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl border border-gray-100 scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

                        {/* Header */}
                        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-gray-50">
                            <div>
                                <h2 className="text-base font-semibold text-[#2d3142]">Inquiry Details</h2>
                                <p className="text-[11px] text-gray-400 mt-0.5">{format(new Date(selectedLead.createdAt), 'PPPP')}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-[10px] border ${statusColor(selectedLead.status)}`}>
                                    {selectedLead.status}
                                </span>
                                <button onClick={() => setSelectedLead(null)} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                                    <XCircle className="w-[18px] h-[18px] text-gray-300 hover:text-gray-400" />
                                </button>
                            </div>
                        </div>

                        {/* Fields */}
                        <div className="px-8 py-6 space-y-6">

                            {/* Customer */}
                            <div>
                                <p className="text-[10px] text-gray-300 uppercase tracking-widest mb-3">Customer</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Full Name" icon={User} value={`${selectedLead.firstName} ${selectedLead.lastName}`} />
                                    <Field label="Profession" value={`${selectedLead.profession || ''}${selectedLead.company ? ` @ ${selectedLead.company}` : ''}`} />
                                    <Field label="Email" icon={Mail} value={selectedLead.email} />
                                    <Field label="Phone" icon={Phone} value={selectedLead.tel} />
                                </div>
                            </div>

                            {/* Product & Location */}
                            <div>
                                <p className="text-[10px] text-gray-300 uppercase tracking-widest mb-3">Product & Location</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Product</p>
                                        <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                                            <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-100 shrink-0">
                                                <img src={getProductThumbnail(selectedLead.productId)} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <span className="text-sm text-[#2d3142] truncate">{selectedLead.productId?.product_name || selectedLead.productId?.name}</span>
                                        </div>
                                    </div>
                                    <Field label="City & Postcode" icon={MapPin} value={`${selectedLead.city || ''}${selectedLead.postcode ? `, ${selectedLead.postcode}` : ''}`} />
                                    <Field label="Address" value={`${selectedLead.address || ''}${selectedLead.no ? ` ${selectedLead.no}` : ''}`} />
                                </div>
                            </div>

                            {/* Requested Items */}
                            <div>
                                <p className="text-[10px] text-gray-300 uppercase tracking-widest mb-3">Requested Items</p>
                                <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 flex flex-wrap gap-2 min-h-[44px] items-center">
                                    {selectedLead.catalogue && <span className="px-2.5 py-1 bg-blue-50 text-blue-400 text-[10px] rounded-full border border-blue-100">Catalogue</span>}
                                    {selectedLead.priceList && <span className="px-2.5 py-1 bg-green-50 text-green-400 text-[10px] rounded-full border border-green-100">Price List</span>}
                                    {selectedLead.bimCad && <span className="px-2.5 py-1 bg-purple-50 text-purple-400 text-[10px] rounded-full border border-purple-100">BIM/CAD</span>}
                                    {selectedLead.retailersList && <span className="px-2.5 py-1 bg-amber-50 text-amber-400 text-[10px] rounded-full border border-amber-100">Retailers List</span>}
                                    {selectedLead.contactRepresentative && <span className="px-2.5 py-1 bg-red-50 text-red-400 text-[10px] rounded-full border border-red-100">Representative</span>}
                                    {!selectedLead.catalogue && !selectedLead.priceList && !selectedLead.bimCad && !selectedLead.retailersList && !selectedLead.contactRepresentative && (
                                        <span className="text-xs text-gray-300 italic">No specific items requested</span>
                                    )}
                                </div>
                            </div>

                            {/* Message */}
                            <div>
                                <p className="text-[10px] text-gray-300 uppercase tracking-widest mb-3">Message</p>
                                <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-[#2d3142] leading-relaxed min-h-[80px]">
                                    {selectedLead.message || <span className="text-gray-300 italic">No message provided.</span>}
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <p className="text-[10px] text-gray-300 uppercase tracking-widest mb-1">Status</p>
                                <select
                                    value={pendingStatus}
                                    onChange={(e) => setPendingStatus(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-[#2d3142] outline-none focus:ring-1 focus:ring-[#d9a88a] transition-all appearance-none cursor-pointer"
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Reviewed">Reviewed</option>
                                    <option value="Contacted">Contacted</option>
                                </select>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-2 px-8 pb-8">
                            <button
                                onClick={() => setSelectedLead(null)}
                                className="px-5 py-2 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
                            >
                                Close
                            </button>
                            <button
                                disabled={isUpdating || pendingStatus === selectedLead.status}
                                onClick={() => updateStatus({ id: selectedLead._id, status: pendingStatus }, {
                                    onSuccess: (data) => setSelectedLead(data.data)
                                })}
                                className="px-5 py-2 text-sm bg-[#2d3142] text-white rounded-xl hover:bg-[#d9a88a] transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2"
                            >
                                {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
