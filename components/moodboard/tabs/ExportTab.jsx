'use client';
import { Edit2, Download, MoreHorizontal, ShoppingCart } from 'lucide-react';
import { getProductThumbnail, getProductName, getProductBrand, getProductCategory } from '@/lib/productUtils';
import { STATUS_STYLES } from './OverviewTab';

export default function ExportTab({
    products,
    customPhotos,
    boardItems,
    productStatuses,
    projectName,
    exportAsCSV,
    handleAddToCart
}) {
    const project = { projectName: projectName };
    return (
        <div className="h-full overflow-y-auto p-8">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" /></svg>
                        Filter
                    </button>
                    <button className="p-2 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                        <Edit2 className="w-4 h-4" /> Choose template
                    </button>
                    <button
                        onClick={exportAsCSV}
                        className="flex items-center gap-2 px-5 py-2 bg-[#1a1a2e] text-white rounded-xl text-sm font-bold hover:bg-[#2d2d4a] transition-colors"
                    >
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button className="p-2 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Spec Status</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Project Name</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Tags</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Brand</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Manufacturer SKU</th>
                            <th className="px-4 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {(products.length === 0 && customPhotos.length === 0) ? (
                            <tr>
                                <td colSpan={7} className="py-16 text-center text-gray-400 text-sm font-medium">
                                    No materials to export. Add products or images first.
                                </td>
                            </tr>
                        ) : (
                            [
                                ...products.map(p => ({ isPhoto: false, data: p })),
                                ...customPhotos.map(p => ({ isPhoto: true, data: p }))
                            ].map(({ isPhoto, data }, i) => {
                                const id = isPhoto ? data.id : data._id;
                                const thumb = isPhoto ? (data.previewUrl || '/Icons/arcmatlogo.svg') : getProductThumbnail(data);
                                const name = isPhoto ? data.title : getProductName(data);
                                const brand = isPhoto ? 'Custom Upload' : getProductBrand(data);
                                const sku = isPhoto ? '—' : (data?.skucode || (typeof data?.productId === 'object' ? data?.productId?.skucode : '') || '—');
                                const st = isPhoto ? (data.status || 'Considering') : (productStatuses[id] || 'Considering');

                                return (
                                    <tr key={`${id || 'item'}-${i}`} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                                                    <img src={thumb} alt={name} className="w-full h-full object-cover" />
                                                </div>
                                                <span className="font-semibold text-[#1a1a2e] truncate max-w-[180px]">{name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            {(() => {
                                                const sty = STATUS_STYLES[st] || STATUS_STYLES['Considering'];
                                                return (
                                                    <span className={`flex items-center gap-1.5 text-xs font-semibold ${sty.label}`}>
                                                        <span className={`w-2 h-2 rounded-full shrink-0 ${sty.dot}`} />{st}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-4 py-3.5 text-gray-600 font-medium">{project?.projectName || 'ArcMat'}</td>
                                        <td className="px-4 py-3.5">
                                            <button className="text-xs text-gray-400 hover:text-[#d9a88a] font-medium transition-colors">Add tag</button>
                                        </td>
                                        <td className="px-4 py-3.5 text-gray-700 font-medium">{brand || '—'}</td>
                                        <td className="px-4 py-3.5 text-gray-500 font-mono text-xs">{sku}</td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400" title="Email"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></button>
                                                {!isPhoto && (
                                                    <button
                                                        onClick={() => handleAddToCart(data)}
                                                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"
                                                        title="Add to Cart"
                                                    >
                                                        <ShoppingCart className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400" title="More"><MoreHorizontal className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
