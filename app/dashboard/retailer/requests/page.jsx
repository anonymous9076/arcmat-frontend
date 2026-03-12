'use client';

import React from 'react';
import { useGetRetailerAssignedRequests, useUpdateRetailerRequestStatus } from '@/hooks/useRetailerRequest';
import { User, Mail, Phone, MapPin, Calendar, Clock, CheckCircle, ChevronRight, MessageSquare, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { getProductThumbnail } from '@/lib/productUtils';
import MessageModal from '@/components/sections/MessageModal';
import Link from 'next/link';

const STATUS_CONFIG = {
    'Pending': {
        icon: Clock,
        color: 'text-amber-500',
        bg: 'bg-amber-50',
        border: 'border-amber-100',
    },
    'Processing': {
        icon: Clock,
        color: 'text-blue-500',
        bg: 'bg-blue-50',
        border: 'border-blue-100',
    },
    'Confirmed': {
        icon: CheckCircle,
        color: 'text-green-500',
        bg: 'bg-green-50',
        border: 'border-green-100',
    },
    'Closed': {
        icon: CheckCircle,
        color: 'text-gray-500',
        bg: 'bg-gray-50',
        border: 'border-gray-100',
    }
};

export default function RetailerRequestsPage() {
    const { data: requestsData, isLoading } = useGetRetailerAssignedRequests();
    const { mutate: updateStatus, isLoading: isUpdating } = useUpdateRetailerRequestStatus();
    const [messagingRequest, setMessagingRequest] = React.useState(null);
    const requests = requestsData?.data || [];

    const handleCall = (mobile) => {
        if (mobile) window.location.href = `tel:${mobile}`;
    };

    const handleMarkProcessed = (requestId) => {
        updateStatus({ requestId, status: 'Processing' });
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
                    <User className="w-8 h-8 text-[#e09a74]" />
                    Architect Contact Requests
                </h1>
                <p className="text-gray-400 font-medium">Manage and respond to architects interested in your materials.</p>
            </header>

            {requests.length === 0 ? (
                <div className="bg-white rounded-[40px] border border-gray-100 p-12 text-center shadow-sm">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <MessageSquare className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-black text-[#2d3142] mb-2">No Requests Found</h3>
                    <p className="text-gray-400 font-medium">When an architect requests your contact for a project, it will appear here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {requests.map((request) => {
                        const config = STATUS_CONFIG[request.status] || STATUS_CONFIG['Pending'];
                        const StatusIcon = config.icon;

                        return (
                            <div key={request._id} className="bg-white rounded-[32px] border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 group">
                                <div className="p-8">
                                    <div className="flex flex-col lg:flex-row justify-between gap-6 mb-8">
                                        {/* Architect Info */}
                                        <div className="flex gap-5">
                                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0 border border-gray-50 text-[#e09a74]">
                                                <User className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-xl font-black text-[#2d3142]">{request.professionalId?.name}</h3>
                                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black tracking-widest uppercase rounded-full border border-indigo-100">
                                                        Architect
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-4 text-sm text-gray-400 font-medium">
                                                    <div className="flex items-center gap-1.5">
                                                        <Mail className="w-4 h-4" />
                                                        {request.professionalId?.email}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Phone className="w-4 h-4" />
                                                        {request.professionalId?.mobile}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status & Date */}
                                        <div className="flex flex-col items-end gap-2">
                                            <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl ${config.bg} ${config.color} border ${config.border} font-black text-xs uppercase tracking-wider`}>
                                                <StatusIcon className="w-4 h-4" />
                                                {request.status}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold uppercase tracking-widest">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {format(new Date(request.createdAt), 'dd MMMM, yyyy')}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-gray-50/50 rounded-3xl p-6 border border-gray-50">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-white rounded-xl overflow-hidden border border-gray-100 shrink-0">
                                                <img 
                                                    src={getProductThumbnail(request.materialId)} 
                                                    alt="" 
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Interested In</p>
                                                <p className="font-bold text-[#2d3142]">{request.materialName}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Project</p>
                                            <p className="font-bold text-[#2d3142]">{request.projectId?.projectName}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Location</p>
                                            <div className="flex items-center gap-1.5 font-bold text-[#2d3142]">
                                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                {request.city}
                                            </div>
                                        </div>
                                        <div className="lg:col-span-1 space-y-1">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Professional Notes</p>
                                            <p className="text-sm text-gray-500 font-medium italic line-clamp-2">
                                                "{request.notes || 'No additional notes provided.'}"
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex flex-col sm:flex-row gap-3">
                                        <Button 
                                            onClick={() => handleCall(request.professionalId?.mobile)}
                                            className="flex-1 bg-[#2d3142] text-white hover:bg-black font-black rounded-2xl py-4 flex items-center justify-center gap-2 transition-all"
                                        >
                                            <Phone className="w-4 h-4" />
                                            Call Architect
                                        </Button>
                                        <Button 
                                            onClick={() => setMessagingRequest(request)}
                                            className="relative flex-1 border-2 border-gray-100 text-gray-500 hover:bg-gray-50 font-black rounded-2xl py-4 flex items-center justify-center gap-2 transition-all"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                            Send Message
                                            {request.unreadMessages > 0 && (
                                                <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white animate-bounce-subtle">
                                                    {request.unreadMessages}
                                                </span>
                                            )}
                                        </Button>
                                        <div className="hidden sm:block w-fit">
                                            <Button 
                                                onClick={() => {
                                                    const nextStatus = request.status === 'Pending' ? 'Processing' : 'Confirmed';
                                                    updateStatus({ requestId: request._id, status: nextStatus });
                                                }}
                                                disabled={isUpdating || (request.status !== 'Pending' && request.status !== 'Processing')}
                                                className="bg-[#e09a74] text-white hover:bg-[#c59678] font-black rounded-2xl py-4 px-8 shadow-lg shadow-orange-50 transition-all flex items-center gap-2 disabled:opacity-50"
                                            >
                                                {request.status === 'Pending' ? 'Mark as Processed' : (request.status === 'Processing' ? 'Complete Request' : 'Confirmed')}
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
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
                    projectId={messagingRequest.projectId?._id}
                    materialName={messagingRequest.materialName}
                    materialId={messagingRequest.materialId?._id || messagingRequest.materialId}
                    retailerId={messagingRequest.retailerId?._id || messagingRequest.retailerId}
                />
            )}
        </div>
    );
}
