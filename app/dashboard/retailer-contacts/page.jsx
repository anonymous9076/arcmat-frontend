// ─── page.jsx (RetailerContactsPage) ─────────────────────────────────────────

'use client';

import React from 'react';
import { useGetMyRetailerRequests, RETAILER_REQ_KEYS } from '@/hooks/useRetailerRequest';
import { useMarkRetailerChatRead } from '@/hooks/useProject';
import { useQueryClient } from '@tanstack/react-query';
import { User, MessageSquare, MapPin, Calendar, Clock, CheckCircle, Package, Phone, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { getProductThumbnail } from '@/lib/productUtils';
import MessageModal from '@/components/sections/MessageModal';

const STATUS_CONFIG = {
    'Pending': { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
    'Processing': { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
    'Confirmed': { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-100' },
    'Closed': { icon: CheckCircle, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-100' },
};

export default function RetailerContactsPage() {
    const queryClient = useQueryClient();
    const { data: requestsData, isLoading } = useGetMyRetailerRequests();
    const { mutate: markRetailerChatRead } = useMarkRetailerChatRead();
    const [messagingRequest, setMessagingRequest] = React.useState(null);
    const requests = requestsData?.data || [];

    // BUG FIX 4: When opening a chat, immediately clear unread count in the
    // local cache so the badge on the Chat button disappears without waiting
    // for the next refetch cycle
    const handleOpenChat = (request) => {
        setMessagingRequest(request);

        // Optimistically clear unread badge immediately on click
        queryClient.setQueryData(RETAILER_REQ_KEYS.mine(), (old) => {
            if (!old?.data) return old;
            return { ...old, data: old.data.map(r => r._id === request._id ? { ...r, unreadMessages: 0 } : r) };
        });

        // Call the dedicated retailer-chat mark-read endpoint
        const targetRetailerId = request.retailerId?._id || request.retailerId;
        const targetMaterialId = request.materialId?._id || request.materialId;
        if (targetRetailerId && targetMaterialId) {
            markRetailerChatRead({ retailerId: targetRetailerId, materialId: targetMaterialId });
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 text-[#e09a74] animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-[#2d3142] mb-2 flex items-center gap-3">
                    <MessageSquare className="w-8 h-8 text-[#e09a74]" />
                    Retailer Contacts
                </h1>
                <p className="text-gray-400 font-medium">Manage your material inquiries and private chats with retailers.</p>
            </header>

            {requests.length === 0 ? (
                <div className="bg-white rounded-[40px] border border-gray-100 p-12 text-center shadow-sm">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <User className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-black text-[#2d3142] mb-2">No Contact Requests</h3>
                    <p className="text-gray-400 font-medium mb-8">When you request a retailer's contact for a material, it will appear here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {requests.map((request) => {
                        const config = STATUS_CONFIG[request.status] || STATUS_CONFIG['Pending'];
                        const StatusIcon = config.icon;
                        const retailer = request.retailerId;

                        return (
                            <div key={request._id} className="bg-white rounded-[32px] border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 group">
                                <div className="p-8">
                                    <div className="flex flex-col lg:flex-row justify-between gap-6 mb-8">
                                        <div className="flex gap-5">
                                            <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden border border-gray-50 shrink-0">
                                                <img
                                                    src={getProductThumbnail(request.materialId)}
                                                    alt=""
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-[#2d3142] mb-1">{request.materialName}</h3>
                                                <div className="flex flex-wrap gap-4 text-sm text-gray-400 font-medium">
                                                    <div className="flex items-center gap-1.5">
                                                        <Package className="w-4 h-4 text-[#e09a74]" />
                                                        {request.projectId?.projectName}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <MapPin className="w-4 h-4" />
                                                        {request.city}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl ${config.bg} ${config.color} border ${config.border} font-black text-xs uppercase tracking-wider`}>
                                                <StatusIcon className="w-4 h-4" />
                                                {request.status}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold uppercase tracking-widest">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {format(new Date(request.createdAt), 'dd MMM, yyyy')}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50/50 rounded-3xl p-6 border border-gray-50">
                                        {retailer ? (
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                                                        <User className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Assigned Retailer</p>
                                                        <p className="font-bold text-[#2d3142]">{retailer.name}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-6">
                                                    {retailer.email && (
                                                        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                                                            <Mail className="w-4 h-4 text-gray-400" />
                                                            {retailer.email}
                                                        </div>
                                                    )}
                                                    {retailer.mobile && (
                                                        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                                                            <Phone className="w-4 h-4 text-gray-400" />
                                                            {retailer.mobile}
                                                        </div>
                                                    )}
                                                </div>
                                                {/* BUG FIX 4: Use handleOpenChat instead of direct setMessagingRequest */}
                                                <Button
                                                    onClick={() => handleOpenChat(request)}
                                                    className="relative bg-white border-2 border-[#e09a74] text-[#e09a74] hover:bg-[#e09a74] hover:text-white font-black rounded-2xl py-3 px-6 flex items-center gap-2 transition-all shadow-sm"
                                                >
                                                    <MessageSquare className="w-4 h-4" />
                                                    Chat with Retailer
                                                    {request.unreadMessages > 0 && (
                                                        <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white animate-bounce-subtle">
                                                            {request.unreadMessages}
                                                        </span>
                                                    )}
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-4 text-gray-400">
                                                <Clock className="w-5 h-5" />
                                                <p className="text-sm font-medium italic">Arcmat is currently assigning a retailer. You'll be notified soon.</p>
                                            </div>
                                        )}
                                    </div>

                                    {request.notes && (
                                        <div className="mt-6 flex gap-3 p-4 bg-orange-50/30 rounded-2xl border border-orange-50/50 text-sm text-gray-600">
                                            <div className="font-black text-[10px] uppercase tracking-widest text-[#e09a74] mt-0.5 shrink-0">Your Note:</div>
                                            <p className="font-medium italic leading-relaxed">"{request.notes}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {messagingRequest && (
                <MessageModal
                    isOpen={!!messagingRequest}
                    onClose={() => setMessagingRequest(null)}
                    projectId={messagingRequest.projectId?._id || messagingRequest.projectId}
                    materialName={messagingRequest.materialName}
                    materialId={messagingRequest.materialId?._id || messagingRequest.materialId}
                    retailerId={messagingRequest.retailerId?._id || messagingRequest.retailerId}
                />
            )}
        </div>
    );
}