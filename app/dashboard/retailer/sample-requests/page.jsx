'use client';

import React from 'react';
import { useGetRetailerSampleRequests, useUpdateSampleStatus } from '@/hooks/useSampleRequest';
import { User, Mail, Phone, MapPin, Calendar, Clock, CheckCircle, ChevronRight, Package, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { getProductThumbnail } from '@/lib/productUtils';

const STATUS_CONFIG = {
    'Sample Requested': {
        icon: Clock,
        color: 'text-amber-500',
        bg: 'bg-amber-50',
        border: 'border-amber-100',
    },
    'Sample Approved': {
        icon: CheckCircle,
        color: 'text-blue-500',
        bg: 'bg-blue-50',
        border: 'border-blue-100',
    },
    'Sample Dispatched': {
        icon: Truck,
        color: 'text-indigo-500',
        bg: 'bg-indigo-50',
        border: 'border-indigo-100',
    },
    'Sample Delivered': {
        icon: CheckCircle,
        color: 'text-green-500',
        bg: 'bg-green-50',
        border: 'border-green-100',
    }
};

export default function RetailerSampleRequestsPage() {
    const { data: requests, isLoading } = useGetRetailerSampleRequests();
    const { mutate: updateStatus, isPending: isUpdating } = useUpdateSampleStatus();

    const handleUpdateStatus = (requestId, currentStatus) => {
        let nextStatus = '';
        if (currentStatus === 'Sample Requested') nextStatus = 'Sample Approved';
        else if (currentStatus === 'Sample Approved') nextStatus = 'Sample Dispatched';
        else if (currentStatus === 'Sample Dispatched') nextStatus = 'Sample Delivered';

        if (nextStatus) {
            updateStatus({ requestId, status: nextStatus });
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 text-[#e09a74] animate-spin" />
            </div>
        );
    }

    const sampleRequests = Array.isArray(requests?.data) ? requests.data : (Array.isArray(requests) ? requests : []);

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-[#2d3142] mb-2 flex items-center gap-3">
                    <Package className="w-8 h-8 text-[#e09a74]" />
                    Sample Requests
                </h1>
                <p className="text-gray-400 font-medium">Manage and fulfill sample requests from architects.</p>
            </header>

            {sampleRequests.length === 0 ? (
                <div className="bg-white rounded-[40px] border border-gray-100 p-12 text-center shadow-sm">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Package className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-black text-[#2d3142] mb-2">No Sample Requests</h3>
                    <p className="text-gray-400 font-medium">When an architect requests a sample of your product, it will appear here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {sampleRequests.map((request) => {
                        const config = STATUS_CONFIG[request.status] || STATUS_CONFIG['Sample Requested'];
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

                                    {/* Product and Shipping details */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-gray-50/50 rounded-3xl p-6 border border-gray-50">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-white rounded-xl overflow-hidden border border-gray-100 shrink-0">
                                                <img 
                                                    src={getProductThumbnail(request.productId)} 
                                                    alt="" 
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Product</p>
                                                <p className="font-bold text-[#2d3142]">{request.productName}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Project</p>
                                            <p className="font-bold text-[#2d3142]">{request.projectId?.projectName}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Shipping Address</p>
                                            <div className="flex items-start gap-1.5 font-bold text-[#2d3142] text-xs">
                                                <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                                                <div>
                                                    <p>{request.shippingAddress?.name}</p>
                                                    <p className="text-gray-500 font-medium">{request.shippingAddress?.address}, {request.shippingAddress?.city} - {request.shippingAddress?.pincode}</p>
                                                    <p className="text-gray-500 font-medium">Ph: {request.shippingAddress?.phone}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="lg:col-span-1 space-y-1">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Notes</p>
                                            <p className="text-sm text-gray-500 font-medium italic line-clamp-2">
                                                "{request.notes || 'No additional notes provided.'}"
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex flex-col sm:flex-row gap-3">
                                        {request.status !== 'Sample Delivered' && (
                                            <Button 
                                                onClick={() => handleUpdateStatus(request._id, request.status)}
                                                disabled={isUpdating}
                                                className="flex-1 bg-[#e09a74] text-white hover:bg-[#c59678] font-black rounded-2xl py-4 flex items-center justify-center gap-2 shadow-lg shadow-orange-50 transition-all disabled:opacity-50"
                                            >
                                                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                                {request.status === 'Sample Requested' ? 'Approve Request' : 
                                                 request.status === 'Sample Approved' ? 'Mark as Dispatched' : 
                                                 'Mark as Delivered'}
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        )}
                                        {request.status === 'Sample Delivered' && (
                                            <div className="flex-1 bg-green-50 text-green-600 font-black rounded-2xl py-4 flex items-center justify-center gap-2 border border-green-100">
                                                <CheckCircle className="w-5 h-5" />
                                                Order Completed
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
