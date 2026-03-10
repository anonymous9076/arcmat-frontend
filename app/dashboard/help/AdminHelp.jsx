'use client';

import { useState } from 'react';
import { useSupportQueries, useUpdateSupportStatus, useDeleteSupportQuery } from '@/hooks/useSupport';
import Container from '@/components/ui/Container';
import {
    MessageSquare,
    Clock,
    CheckCircle2,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    User,
    Trash2,
    Loader2,
    ExternalLink,
    Filter
} from 'lucide-react';
import clsx from 'clsx';
import StatusUpdateModal from '@/components/dashboard/help/StatusUpdateModal';

// Fallback for Activity icon if not imported correctly
const Activity = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
);

const STATUS_CONFIG = {
    'pending': { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-100', icon: Clock },
    'in-progress': { label: 'In Progress', color: 'bg-blue-50 text-blue-700 border-blue-100', icon: Activity },
    'resolved': { label: 'Resolved', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2 },
    'closed': { label: 'Closed', color: 'bg-gray-50 text-gray-700 border-gray-100', icon: AlertCircle }
};

export default function AdminHelp({ isAdmin }) {
    const { data: queries = [], isLoading } = useSupportQueries(isAdmin);
    const updateMutation = useUpdateSupportStatus();
    const deleteMutation = useDeleteSupportQuery();

    const [expandedId, setExpandedId] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');

    const filteredQueries = queries.filter(q => statusFilter === 'all' || q.status === statusFilter);

    const [statusModal, setStatusModal] = useState({
        isOpen: false,
        queryId: null,
        newStatus: '',
        subject: ''
    });

    const handleUpdateStatus = (queryId, newStatus, subject) => {
        setStatusModal({
            isOpen: true,
            queryId,
            newStatus,
            subject
        });
    };

    const confirmStatusUpdate = (comment) => {
        updateMutation.mutate({
            queryId: statusModal.queryId,
            data: { status: statusModal.newStatus, comment }
        }, {
            onSuccess: () => {
                setStatusModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <Container>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                            <MessageSquare className="w-8 h-8 text-[#E09A74]" />
                            Support Tickets
                        </h1>
                        <p className="text-gray-500 font-medium mt-1">Manage and respond to platform user queries</p>
                    </div>

                    <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                        <Filter className="w-4 h-4 text-gray-400 ml-2" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent border-none text-sm font-bold text-gray-700 focus:ring-0 cursor-pointer pr-8"
                        >
                            <option value="all">All statuses</option>
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-4">
                        <Loader2 className="w-10 h-10 text-[#E09A74] animate-spin" />
                        <p className="text-sm font-black text-gray-300 uppercase tracking-widest">Loading queries...</p>
                    </div>
                ) : filteredQueries.length === 0 ? (
                    <div className="bg-white rounded-[40px] p-20 text-center border border-dashed border-gray-200">
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No support tickets found</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredQueries.map((query) => {
                            const isExpanded = expandedId === query._id;
                            const StatusIcon = STATUS_CONFIG[query.status]?.icon || Clock;

                            return (
                                <div
                                    key={query._id}
                                    className={clsx(
                                        "bg-white rounded-[32px] border transition-all overflow-hidden",
                                        isExpanded ? "ring-2 ring-[#E09A74]/20 border-[#E09A74] shadow-2xl shadow-gray-200" : "border-gray-100 hover:border-gray-200 shadow-sm"
                                    )}
                                >
                                    {/* Header / Summary */}
                                    <div
                                        className="p-6 md:p-8 flex items-center justify-between cursor-pointer select-none"
                                        onClick={() => setExpandedId(isExpanded ? null : query._id)}
                                    >
                                        <div className="flex items-center gap-6 flex-1">
                                            <div className={clsx(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border",
                                                STATUS_CONFIG[query.status]?.color
                                            )}>
                                                <StatusIcon className="w-6 h-6" />
                                            </div>

                                            <div className="min-w-0">
                                                <h3 className="text-lg font-black text-gray-900 truncate">{query.subject}</h3>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                                        <User className="w-3 h-3" />
                                                        {query.userId?.name || 'Unknown User'}
                                                    </span>
                                                    <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                        {new Date(query.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <span className={clsx(
                                                "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                                STATUS_CONFIG[query.status]?.color
                                            )}>
                                                {STATUS_CONFIG[query.status]?.label}
                                            </span>
                                            <div className="w-10 h-10 rounded-full hover:bg-gray-50 flex items-center justify-center text-gray-300 transition-colors">
                                                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                        <div className="border-t border-gray-50 bg-gray-50/30 p-8 md:p-12 animate-in slide-in-from-top-2 duration-300">
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                                                {/* Left: Query Content */}
                                                <div className="lg:col-span-2 space-y-8">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-4">Original Message</label>
                                                        <div className="bg-white p-8 rounded-[32px] border border-gray-100 text-gray-700 leading-relaxed font-medium">
                                                            {query.query}
                                                        </div>
                                                    </div>

                                                    {query.attachments?.length > 0 && (
                                                        <div>
                                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-4">Attachments</label>
                                                            <div className="flex flex-wrap gap-4">
                                                                {query.attachments.map((src, i) => (
                                                                    <a
                                                                        key={i}
                                                                        href={src}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="w-24 h-24 rounded-2xl overflow-hidden border border-gray-200 hover:ring-2 hover:ring-[#E09A74] transition-all relative group"
                                                                    >
                                                                        <img src={src} className="w-full h-full object-cover" />
                                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                                                            <ExternalLink className="w-4 h-4" />
                                                                        </div>
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Timeline */}
                                                    <div>
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-4">Activity Timeline</label>
                                                        <div className="space-y-4">
                                                            {query.timeline?.length > 0 ? (
                                                                query.timeline.map((step, i) => (
                                                                    <div key={i} className="flex gap-4">
                                                                        <div className="w-px bg-gray-200 relative mb-1">
                                                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gray-300"></div>
                                                                        </div>
                                                                        <div className="pb-4">
                                                                            <span className="text-[10px] font-black text-gray-300 uppercase block mb-1">
                                                                                {new Date(step.updatedAt).toLocaleString()}
                                                                            </span>
                                                                            <p className="text-sm font-bold text-gray-700">
                                                                                Status set to <span className="text-[#E09A74]">{step.status}</span>
                                                                            </p>
                                                                            {step.comment && <p className="text-xs text-gray-500 mt-1 italic">"{step.comment}"</p>}
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <p className="text-[10px] italic text-gray-300 font-bold uppercase tracking-widest">No activity recorded yet</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right: Actions */}
                                                <div className="space-y-6">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-4">Update Status</label>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                                                <button
                                                                    key={key}
                                                                    onClick={() => handleUpdateStatus(query._id, key, query.subject)}
                                                                    className={clsx(
                                                                        "h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                                                        query.status === key
                                                                            ? "bg-[#2C2D35] text-white border-transparent"
                                                                            : "bg-white text-gray-600 border-gray-100 hover:border-gray-300"
                                                                    )}
                                                                >
                                                                    {cfg.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="pt-6 border-t border-gray-100">
                                                        <button
                                                            onClick={() => {
                                                                if (confirm("Are you sure you want to delete this ticket?")) {
                                                                    deleteMutation.mutate(query._id);
                                                                }
                                                            }}
                                                            className="w-full h-14 rounded-2xl border-2 border-red-50 text-red-500 hover:bg-red-500 hover:text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Delete Ticket
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </Container>
            <StatusUpdateModal
                isOpen={statusModal.isOpen}
                onClose={() => setStatusModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmStatusUpdate}
                status={statusModal.newStatus}
                subject={statusModal.subject}
                isPending={updateMutation.isPending}
            />
        </div>
    );
}
