import { useState, useEffect } from 'react';
import { useGetSpaceHistory, useApproveMaterialVersion } from '@/hooks/useMaterialHistory';
import { useMarkNotificationsRead } from '@/hooks/useProject';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, X, CheckCircle2, CircleDashed, ArrowRightLeft } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function MaterialHistoryModal({ isOpen, onClose, projectId, spaceId, materialId, currentMaterialName }) {
    const { user } = useAuth();
    // Professionals can also act as clients in some flows, but 'customer' is the primary role
    const isClient = user?.role === 'customer' || user?.role === 'professional';

    const { data, isLoading } = useGetSpaceHistory(projectId, spaceId);
    const approveMutation = useApproveMaterialVersion(projectId);
    const { mutate: markNotificationsRead } = useMarkNotificationsRead();

    // Mark as read when the modal closes
    useEffect(() => {
        return () => {
            if (isOpen && projectId && spaceId && user) {
                markNotificationsRead({ id: projectId, spaceId, materialId });
            }
        };
    }, [isOpen, projectId, spaceId, materialId, user, markNotificationsRead]);

    const history = data?.data || [];

    // Reconstruct the full history chain for the selected material with safety guards
    let filteredHistory = [];
    if (materialId && history.length > 0) {
        let currentEntry = history.find(h => h.materialId === materialId || h.previousMaterialId === materialId);

        if (currentEntry) {
            // Step 1: Find the absolute head (the newest version) of the chain
            let head = currentEntry;
            const forwardVisited = new Set();
            while (head && head.materialId) {
                if (forwardVisited.has(head._id)) break; // Cycle protection
                forwardVisited.add(head._id);

                const nextEntry = history.find(h => h.previousMaterialId === head.materialId);
                if (nextEntry) {
                    head = nextEntry;
                } else {
                    break;
                }
            }

            // Step 2: Traverse backward from the head to collect the entire chain
            let cursor = head;
            const backwardVisited = new Set();
            while (cursor) {
                if (backwardVisited.has(cursor._id)) break; // Cycle protection
                backwardVisited.add(cursor._id);

                filteredHistory.push(cursor);
                if (cursor.previousMaterialId) {
                    // Look for the version that was the source of this replacement
                    cursor = history.find(h => h.materialId === cursor.previousMaterialId);
                } else {
                    cursor = null;
                }
            }
        }
    } else if (!materialId) {
        filteredHistory = history;
    }

    if (!isOpen) return null;

    const handleApprove = (versionId, status) => {
        approveMutation.mutate({ versionId, data: { status } });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative animate-in zoom-in-95 duration-200 cursor-default"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-[#fef7f2]">
                    <div>
                        <h2 className="text-2xl font-black text-[#2d3142]">Material History</h2>
                        <p className="text-sm font-medium text-gray-500 mt-1">
                            Tracking changes for <span className="text-[#d9a88a] font-bold">{currentMaterialName || 'this space'}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 text-[#d9a88a] animate-spin mb-4" />
                        </div>
                    ) : filteredHistory.length === 0 ? (
                        <div className="text-center py-20">
                            <ArrowRightLeft className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-400">No history yet</h3>
                            <p className="text-sm text-gray-400 mt-2">Changes made here will be tracked automatically.</p>
                        </div>
                    ) : (
                        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                            {filteredHistory.map((entry, index) => (
                                <div key={entry._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-white text-[#d9a88a] shadow-lg ring-1 ring-gray-100 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 font-black text-xs">
                                        V{entry.version}
                                    </div>

                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-4 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all">
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <div className="flex flex-col">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md w-fit mb-1 ${
                                                    entry.status === 'Replaced' ? 'bg-gray-100 text-gray-500' :
                                                    entry.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                    entry.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                    'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {entry.status || (entry.isFinal ? 'Current' : 'Replaced')}
                                                </span>
                                                <span className="text-[11px] font-black text-[#d9a88a] uppercase tracking-tighter">
                                                    {entry.phase || 'Concept Design'}
                                                </span>
                                            </div>
                                            <span className="text-[11px] font-bold text-gray-400">
                                                {new Date(entry.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3 mb-3">
                                            {entry.materialImage && (
                                                <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm border border-gray-100 shrink-0">
                                                    <img src={entry.materialImage} alt="" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-[#2d3142] truncate">{entry.materialName || 'Unknown Material'}</h4>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1 h-1 rounded-full bg-gray-300" />
                                                    <p className="text-[10px] text-gray-400 font-medium tracking-tight">
                                                        By: <span className="font-bold text-gray-500">{entry.changedBy?.name || 'Unknown'}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {entry.previousMaterialName && (
                                            <div className="bg-gray-50/50 rounded-xl p-2.5 mb-3 border border-dashed border-gray-100 flex items-center gap-3">
                                                {entry.previousMaterialImage && (
                                                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-200 opacity-60 grayscale shrink-0">
                                                        <img src={entry.previousMaterialImage} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Replaced</p>
                                                    <p className="text-xs text-gray-500 font-bold truncate line-through decoration-gray-300">{entry.previousMaterialName}</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                {entry.approvalStatus === 'Approved' ? (
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                ) : entry.approvalStatus === 'Rejected' ? (
                                                    <X className="w-4 h-4 text-red-500 bg-red-100 rounded-full p-0.5" />
                                                ) : (
                                                    <CircleDashed className="w-4 h-4 text-yellow-500" />
                                                )}
                                                <span className="text-[11px] font-black uppercase text-gray-500">
                                                    {entry.approvalStatus}
                                                </span>
                                            </div>

                                            {isClient && entry.approvalStatus === 'Pending' && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleApprove(entry._id, 'Approved')}
                                                        className="text-[10px] font-bold bg-green-50 text-green-600 hover:bg-green-100 px-2 py-1 rounded transition-colors"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleApprove(entry._id, 'Rejected')}
                                                        className="text-[10px] font-bold bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1 rounded transition-colors"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
