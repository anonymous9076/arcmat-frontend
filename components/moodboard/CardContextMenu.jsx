'use client';

import { useEffect, useRef } from 'react';
import { Check, CheckCircle, XCircle } from 'lucide-react';

const STATUSES = [
    { label: 'Specified', color: 'bg-green-400' },
    { label: 'Considering', color: 'bg-gray-600' },
    { label: 'Excluded', color: 'bg-pink-400' },
];

export default function CardContextMenu({
    x, y, currentStatus = 'Considering', isPhoto = false,
    onStatusChange, onRemove,
    onClose,
    isClient = false,
    onOpenHistory,
    onOpenSampleReq,
    onOpenRetailerReq,
    onOpenDiscussion,
    onOpenReplace,
    productNotifications = null,
    itemId
}) {
    const ref = useRef(null);
    const unreadMessages = productNotifications?.[itemId]?.unreadMessages > 0 ? productNotifications[itemId].unreadMessages : 0;
    const pendingApprovals = productNotifications?.[itemId]?.pendingApprovals > 0 ? productNotifications[itemId].pendingApprovals : 0;

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) onClose();
        };
        document.addEventListener('mousedown', handler);
        document.addEventListener('contextmenu', onClose);
        return () => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('contextmenu', onClose);
        };
    }, [onClose]);

    // Keep menu inside viewport
    const style = { position: 'fixed', top: y, left: x, zIndex: 9999 };

    return (
        <div
            ref={ref}
            style={style}
            className="w-52 bg-white border border-gray-100 rounded-2xl shadow-2xl py-2 select-none overflow-hidden"
        >
            {/* Status */}
            <p className="px-4 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                {isClient ? 'Action' : 'Status'}
            </p>
            {isClient ? (
                <>
                    <button
                        onClick={() => {
                            // If already Approved (Specified), toggle back to Considering
                            onStatusChange(currentStatus === 'Specified' ? 'Considering' : 'Specified');
                            onClose();
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors ${currentStatus === 'Specified'
                                ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <CheckCircle className={`w-4 h-4 ${currentStatus === 'Specified' ? 'text-green-600' : 'text-gray-400'}`} />
                        Approve
                        {currentStatus === 'Specified' && <Check className="w-3.5 h-3.5 ml-auto text-green-600" />}
                    </button>
                    <button
                        onClick={() => {
                            // If already Rejected (Excluded), toggle back to Considering
                            onStatusChange(currentStatus === 'Excluded' ? 'Considering' : 'Excluded');
                            onClose();
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors ${currentStatus === 'Excluded'
                                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <XCircle className={`w-4 h-4 ${currentStatus === 'Excluded' ? 'text-red-600' : 'text-gray-400'}`} />
                        Reject
                        {currentStatus === 'Excluded' && <Check className="w-3.5 h-3.5 ml-auto text-red-600" />}
                    </button>
                </>
            ) : (
                STATUSES.map(({ label, color }) => (
                    <button
                        key={label}
                        onClick={() => { onStatusChange(label); onClose(); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />
                        {label}
                        {currentStatus === label && <Check className="w-3.5 h-3.5 ml-auto text-gray-500" />}
                    </button>
                ))
            )}

            <div className="border-t border-gray-100 my-1" />

            <button
                onClick={() => { onOpenDiscussion?.(); onClose(); }}
                className="w-full text-left px-4 py-2 text-sm font-semibold text-[#1a1a2e] flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
                <span>Discuss Material</span>
                {unreadMessages > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                        {unreadMessages}
                    </span>
                )}
            </button>

            {!isPhoto && (
                <>
                    {!isClient && (
                        <button
                            onClick={() => { onOpenReplace?.(); onClose(); }}
                            className="w-full text-left px-4 py-2 text-sm font-semibold text-[#d9a88a] flex items-center justify-between hover:bg-[#fef7f2] transition-colors"
                        >
                            <span>Replace Material</span>
                            {pendingApprovals > 0 && (
                                <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                                    {pendingApprovals}
                                </span>
                            )}
                        </button>
                    )}
                    <button
                        onClick={() => { onOpenHistory?.(); onClose(); }}
                        className="w-full text-left px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Material History
                    </button>
                    {!isClient && (
                        <>
                            <button
                                onClick={() => { onOpenSampleReq?.(); onClose(); }}
                                className="w-full text-left px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Request Sample
                            </button>
                            <button
                                onClick={() => { onOpenRetailerReq?.(); onClose(); }}
                                className="w-full text-left px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Request Retailer
                            </button>
                        </>
                    )}
                    <div className="border-t border-gray-100 my-1" />
                </>
            )}

            {!isClient && (
                <button
                    onClick={() => { onRemove(); onClose(); }}
                    className="w-full text-left px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
                >
                    Remove from board
                </button>
            )}
        </div>
    );
}
