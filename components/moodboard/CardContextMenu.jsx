'use client';

import { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';

const STATUSES = [
    { label: 'Specified', color: 'bg-green-400' },
    { label: 'Considering', color: 'bg-gray-600' },
    { label: 'Excluded', color: 'bg-pink-400' },
];

export default function CardContextMenu({
    x, y, currentStatus = 'Considering',
    onStatusChange, onRemove,
    onClose
}) {
    const ref = useRef(null);

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
            <p className="px-4 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Status</p>
            {STATUSES.map(({ label, color }) => (
                <button
                    key={label}
                    onClick={() => { onStatusChange(label); onClose(); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />
                    {label}
                    {currentStatus === label && <Check className="w-3.5 h-3.5 ml-auto text-gray-500" />}
                </button>
            ))}

            <div className="border-t border-gray-100 my-1" />

            <button
                onClick={() => { onRemove(); onClose(); }}
                className="w-full text-left px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
            >
                Remove from board
            </button>
        </div>
    );
}
