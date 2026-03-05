'use client';
import { Download, FileOutput } from 'lucide-react';
import { toast } from 'sonner';

export default function DownloadTab({
    boardItems,
    exportAsCSV,
    setActiveTab
}) {
    return (
        <div className="h-full overflow-y-auto p-8">
            <h2 className="text-xl font-black text-[#1a1a2e] mb-2">Download Your Board</h2>
            <p className="text-sm text-gray-400 mb-8">Export the canvas as an image or download a material spec sheet.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl">
                <DownloadCard
                    title="Canvas Image"
                    description="Download the design desk canvas as a high-res JPEG"
                    icon={<svg className="w-7 h-7 text-[#d9a88a]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                    label="Download JPEG"
                    onClick={() => {
                        if (boardItems.length === 0) { toast.error('Canvas is empty. Add items first.'); return; }
                        setActiveTab('designDesk');
                        setTimeout(() => toast.info('Use the Download button in the canvas toolbar'), 500);
                    }}
                    color="orange"
                />
                <DownloadCard
                    title="Material CSV"
                    description="Export all materials as a spreadsheet with specs and pricing"
                    icon={<FileOutput className="w-7 h-7 text-green-500" />}
                    label="Download CSV"
                    onClick={exportAsCSV}
                    color="green"
                />
            </div>
        </div>
    );
}

function DownloadCard({ title, description, icon, label, onClick, color }) {
    const colors = {
        orange: 'border-[#d9a88a]/20 hover:border-[#d9a88a] bg-[#fef7f2]/50 hover:bg-[#fef7f2]',
        green: 'border-green-200 hover:border-green-400 bg-green-50/50 hover:bg-green-50',
    };
    const btnColors = {
        orange: 'bg-[#d9a88a] hover:bg-[#c59678] text-white',
        green: 'bg-green-600 hover:bg-green-700 text-white',
    };
    return (
        <div className={`flex flex-col gap-4 p-6 border-2 rounded-3xl transition-all ${colors[color]}`}>
            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center">{icon}</div>
            <div>
                <h3 className="font-black text-[#1a1a2e] text-base mb-1">{title}</h3>
                <p className="text-xs text-gray-400 font-medium leading-relaxed">{description}</p>
            </div>
            <button
                onClick={onClick}
                className={`mt-auto w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${btnColors[color]}`}
            >
                <Download className="w-4 h-4" /> {label}
            </button>
        </div>
    );
}
