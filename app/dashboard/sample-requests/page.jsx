'use client';

import React from 'react';
import { useGetMySampleRequests, useDeleteSampleRequest, useUpdateSampleRequest } from '@/hooks/useSampleRequest';
import { Package, Truck, CheckCircle, Clock, ChevronRight, MapPin, Calendar, Layout } from 'lucide-react';
import { format } from 'date-fns';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { getProductThumbnail } from '@/lib/productUtils';
import DeleteConfirmationModal from '@/components/moodboard/DeleteConfirmationModal';

const STATUS_CONFIG = {
    'Sample Requested': {
        icon: Clock,
        color: 'text-amber-500',
        bg: 'bg-amber-50',
        border: 'border-amber-100',
        description: 'Waiting for Arcmat warehouse to approve.'
    },
    'Sample Approved': {
        icon: CheckCircle,
        color: 'text-blue-500',
        bg: 'bg-blue-50',
        border: 'border-blue-100',
        description: 'Approved! Preparing for dispatch.'
    },
    'Sample Dispatched': {
        icon: Truck,
        color: 'text-purple-500',
        bg: 'bg-purple-50',
        border: 'border-purple-100',
        description: 'On its way to your office.'
    },
    'Sample Delivered': {
        icon: CheckCircle,
        color: 'text-green-500',
        bg: 'bg-green-50',
        border: 'border-green-100',
        description: 'Delivered successfully.'
    }
};

export default function SampleRequestsPage() {
    const { data: requestsData, isLoading } = useGetMySampleRequests();
    const { mutate: deleteRequest, isLoading: isDeleting } = useDeleteSampleRequest();
    const { mutate: updateRequest, isLoading: isUpdating } = useUpdateSampleRequest();

    const [editingRequest, setEditingRequest] = React.useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [requestToDelete, setRequestToDelete] = React.useState(null);

    const requests = requestsData?.data || [];

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 text-[#d9a88a] animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[#2d3142] mb-2 flex items-center gap-3">
                        <Package className="w-8 h-8 text-[#d9a88a]" />
                        Sample Requests
                    </h1>
                    <p className="text-gray-400 font-medium">Track all your material samples across projects.</p>
                </div>

                <Link href="/productlist">
                    <Button className="bg-[#d9a88a] text-white hover:bg-[#c59678] font-bold rounded-2xl px-6 py-3 shadow-lg shadow-orange-50 transition-all flex items-center gap-2">
                        <Layout className="w-4 h-4" />
                        Discover Materials
                    </Button>
                </Link>
            </header>

            {requests.length === 0 ? (
                <div className="bg-white rounded-[40px] border border-gray-100 p-12 text-center shadow-sm">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Package className="w-10 h-10 text-gray-300" />
                    </div>

                    <h3 className="text-xl font-black text-[#2d3142] mb-2">No Requests Yet</h3>

                    <p className="text-gray-400 font-medium mb-8">
                        Start adding materials to your projects to request samples.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {requests.map((request) => {
                        const config = STATUS_CONFIG[request.status] || STATUS_CONFIG['Sample Requested'];
                        const StatusIcon = config.icon;

                        return (
                            <div
                                key={request._id}
                                className="bg-white rounded-[32px] border border-gray-100 p-6 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 group"
                            >
                                <div className="flex flex-col lg:flex-row gap-6">

                                    {/* Material Info */}
                                    <div className="flex gap-4 lg:w-1/3 shrink-0">
                                        <div className="w-24 h-24 bg-gray-50 rounded-2xl overflow-hidden border border-gray-50 shadow-sm shrink-0">
                                            <img
                                                src={getProductThumbnail(request.productId)}
                                                alt=""
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>

                                        <div className="flex flex-col justify-center min-w-0">
                                            <h4 className="font-black text-lg text-[#2d3142] truncate">
                                                {request.productName || request.productId?.product_name || 'Material'}
                                            </h4>

                                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                                                <Layout className="w-3 h-3" />
                                                {request.projectId?.projectName || 'Project'}
                                            </div>

                                            <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                                                <Calendar className="w-3 h-3" />
                                                Requested on {format(new Date(request.createdAt), 'dd MMM, yyyy')}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Info */}
                                    <div className="flex-1 flex flex-col justify-center gap-4 py-2 border-y lg:border-y-0 lg:border-x border-gray-100 lg:px-8">

                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl ${config.bg} ${config.color}`}>
                                                <StatusIcon className="w-5 h-5" />
                                            </div>

                                            <div>
                                                <div className={`text-sm font-black ${config.color} uppercase tracking-tight`}>
                                                    {request.status}
                                                </div>

                                                <p className="text-xs text-gray-400 font-medium">
                                                    {config.description}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-500">
                                            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full">
                                                <MapPin className="w-3 h-3 text-gray-400" />
                                                {request.shippingAddress?.city}, {request.shippingAddress?.pincode}
                                            </div>

                                            {request.dispatchedAt && (
                                                <div className="flex items-center gap-1.5 bg-purple-50 px-3 py-1.5 rounded-full text-purple-600">
                                                    <Truck className="w-3 h-3" />
                                                    Dispatched: {format(new Date(request.dispatchedAt), 'dd MMM')}
                                                </div>
                                            )}
                                        </div>

                                    </div>

                                    {/* Actions */}
                                    <div className="lg:w-48 flex flex-col gap-2 items-center justify-center">

                                        <div className="flex gap-2 w-full">
                                            <Button
                                                onClick={() => {
                                                    setRequestToDelete(request._id);
                                                    setIsDeleteModalOpen(true);
                                                }}
                                                disabled={isDeleting}
                                                className="flex-1 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white border border-red-100 font-bold rounded-xl py-2 px-3 text-xs transition-all"
                                            >
                                                Delete
                                            </Button>

                                            <Button
                                                onClick={() => setEditingRequest(request)}
                                                className="flex-1 bg-gray-50 text-[#2d3142] hover:bg-[#d9a88a] hover:text-white font-bold rounded-xl py-2 px-3 text-xs transition-all"
                                            >
                                                Edit
                                            </Button>
                                        </div>

                                        <Link href={`/dashboard/projects/${request.projectId?._id}/moodboards`} className="w-full">
                                            <Button className="w-full bg-white border border-gray-100 text-gray-400 hover:text-[#d9a88a] font-bold rounded-xl py-2 px-3 text-[10px] flex items-center justify-center gap-1 transition-all">
                                                View Project
                                                <ChevronRight className="w-3 h-3" />
                                            </Button>
                                        </Link>

                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {editingRequest && (
                <EditSampleModal
                    request={editingRequest}
                    onClose={() => setEditingRequest(null)}
                    onSave={(data) => {
                        updateRequest({ requestId: editingRequest._id, ...data });
                        setEditingRequest(null);
                    }}
                    isLoading={isUpdating}
                />
            )}

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setRequestToDelete(null);
                }}
                onConfirm={() => {
                    if (requestToDelete) {
                        deleteRequest(requestToDelete);
                    }
                }}
                title="Delete Sample Request?"
                message="Are you sure you want to delete this sample request? This action cannot be undone."
            />
        </div>
    );
}

function EditSampleModal({ request, onClose, onSave, isLoading }) {

    const [notes, setNotes] = React.useState(request.notes || '');
    const [city, setCity] = React.useState(request.shippingAddress?.city || '');
    const [pincode, setPincode] = React.useState(request.shippingAddress?.pincode || '');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-[40px] w-full max-w-md p-8 shadow-2xl">

                <h3 className="text-2xl font-black text-[#2d3142] mb-6">
                    Edit Sample Request
                </h3>

                <div className="space-y-4">

                    <input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold"
                    />

                    <input
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="Pincode"
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold"
                    />

                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        placeholder="Notes"
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold resize-none"
                    />

                </div>

                <div className="mt-8 flex gap-3">

                    <Button
                        onClick={onClose}
                        className="flex-1 bg-gray-100 text-gray-500 rounded-2xl py-3"
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={() =>
                            onSave({
                                notes,
                                shippingAddress: { ...request.shippingAddress, city, pincode }
                            })
                        }
                        disabled={isLoading}
                        className="flex-1 bg-[#d9a88a] text-white rounded-2xl py-3"
                    >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>

                </div>

            </div>
        </div>
    );
}