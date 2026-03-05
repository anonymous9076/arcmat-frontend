'use client';
import { useState, useMemo } from 'react';
import { Edit2, Download, MoreHorizontal, ShoppingCart, Search, ChevronDown, Filter, X } from 'lucide-react';
import { getProductThumbnail, getProductName, getProductBrand, getProductCategory, resolvePricing } from '@/lib/productUtils';
import { STATUS_STYLES } from './OverviewTab';

export default function ExportTab({
    products,
    customPhotos,
    boardItems,
    productStatuses,
    projectName,
    exportAsCSV,
    handleAddToCart,
    handlePriceQtyUpdate,
    handlePhotoStatusChange,
    handleProductStatusChange
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [selectedSpecStatuses, setSelectedSpecStatuses] = useState([]);
    const [selectedProjectStatus, setSelectedProjectStatus] = useState(null);
    const [showFiltersModal, setShowFiltersModal] = useState(false);
    const [statusDropdown, setStatusDropdown] = useState(null);

    const project = { projectName: projectName };

    // Get all unique brands and tags for filtering
    const allBrands = useMemo(() => {
        const brands = new Set();
        products.forEach(p => {
            const b = getProductBrand(p);
            if (b) brands.add(b);
        });
        customPhotos.forEach(() => brands.add('Custom Upload'));
        return Array.from(brands);
    }, [products, customPhotos]);

    const allTags = useMemo(() => {
        const tags = new Set();
        products.forEach(p => (productStatuses[p._id]?.tags || []).forEach(t => tags.add(t)));
        customPhotos.forEach(p => (p.tags || []).forEach(t => tags.add(t)));
        return Array.from(tags);
    }, [products, customPhotos, productStatuses]);

    const specStatuses = Object.keys(STATUS_STYLES);

    // Filtered items
    const filteredItems = useMemo(() => {
        let items = [
            ...products.map(p => ({ isPhoto: false, data: p })),
            ...customPhotos.map(p => ({ isPhoto: true, data: p }))
        ];

        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            items = items.filter(({ data }) => {
                const name = (data.title || getProductName(data)).toLowerCase();
                const brand = (data.brand?.name || getProductBrand(data) || '').toLowerCase();
                return name.includes(s) || brand.includes(s);
            });
        }

        if (selectedBrands.length > 0) {
            items = items.filter(({ isPhoto, data }) => {
                const b = isPhoto ? 'Custom Upload' : getProductBrand(data);
                return selectedBrands.includes(b);
            });
        }

        if (selectedTags.length > 0) {
            items = items.filter(({ isPhoto, data }) => {
                const tags = isPhoto ? (data.tags || []) : (productStatuses[data._id]?.tags || []);
                return selectedTags.some(t => tags.includes(t));
            });
        }

        if (selectedSpecStatuses.length > 0) {
            items = items.filter(({ isPhoto, data }) => {
                const id = isPhoto ? data.id : data._id;
                const statusData = isPhoto ? data.status : productStatuses[id];
                const st = (typeof statusData === 'object' ? statusData.status : statusData) || 'Considering';
                return selectedSpecStatuses.includes(st);
            });
        }

        return items;
    }, [products, customPhotos, searchTerm, selectedBrands, selectedTags, selectedSpecStatuses, productStatuses]);

    // Calculate totals
    const { grandTotal, filteredTotal } = useMemo(() => {
        const allItems = [
            ...products.map(p => ({ isPhoto: false, data: p })),
            ...customPhotos.map(p => ({ isPhoto: true, data: p }))
        ];

        const calc = (items) => items.reduce((sum, { isPhoto, data }) => {
            const id = isPhoto ? data.id : data._id;
            let up = 0;
            if (isPhoto) {
                up = Number(data.price) || 0;
            } else {
                const meta = productStatuses[id];
                if (typeof meta === 'object' && meta.price !== undefined) {
                    up = Number(meta.price);
                } else {
                    const { price } = resolvePricing(data);
                    up = price;
                }
            }
            const q = isPhoto ? (Number(data.quantity) || 1) : (Number(productStatuses[id]?.quantity) || 1);
            return sum + (up * q);
        }, 0);

        return {
            grandTotal: calc(allItems),
            filteredTotal: calc(filteredItems)
        };
    }, [products, customPhotos, productStatuses, filteredItems]);

    return (
        <div className="h-full overflow-y-auto p-8">
            {/* Header Summary */}
            <div className="flex items-end justify-between mb-8 pb-6 border-b border-gray-100">
                <div>
                    <h2 className="text-2xl font-black text-[#1a1a2e] mb-1">Export Summary</h2>
                    <p className="text-sm text-gray-500 font-medium">Manage and export your project materials</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Estimation</p>
                    <div className="flex items-baseline gap-2 justify-end">
                        {(searchTerm || selectedBrands.length || selectedTags.length || selectedSpecStatuses.length) > 0 && (
                            <span className="text-sm font-bold text-[#d9a88a]">
                                Filtered: ₹{filteredTotal.toLocaleString('en-IN')} /
                            </span>
                        )}
                        <span className="text-3xl font-black text-[#1a1a2e]">
                            ₹{grandTotal.toLocaleString('en-IN')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex justify-between items-center gap-4 mb-6">
                <div className="flex items-center gap-3 flex-1 max-w-md">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search materials..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-gray-100 transition-all font-medium placeholder:text-gray-400 shadow-sm"
                        />
                    </div>
                    <button
                        onClick={() => setShowFiltersModal(true)}
                        className={`flex items-center gap-2 px-5 py-3 border rounded-2xl text-sm font-bold transition-all shadow-sm ${(selectedBrands.length || selectedTags.length || selectedSpecStatuses.length) ? 'bg-[#1a1a2e] text-white border-[#1a1a2e]' : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                        {(selectedBrands.length + selectedTags.length + selectedSpecStatuses.length) > 0 && (
                            <span className="ml-1 bg-[#d9a88a] text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                {selectedBrands.length + selectedTags.length + selectedSpecStatuses.length}
                            </span>
                        )}
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-5 py-3 border border-gray-100 bg-white rounded-2xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
                        <Edit2 className="w-4 h-4" /> Choose template
                    </button>
                    <button
                        onClick={exportAsCSV}
                        className="flex items-center gap-2 px-6 py-3 bg-[#1a1a2e] text-white rounded-2xl text-sm font-black hover:bg-[#2d2d4a] transition-all shadow-md active:scale-95"
                    >
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button className="p-3 border border-gray-100 bg-white rounded-2xl text-gray-500 hover:bg-gray-50 transition-all shadow-sm">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Filters Modal */}
            {showFiltersModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#1a1a2e]/40 backdrop-blur-sm" onClick={() => setShowFiltersModal(false)} />
                    <div className="relative bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-gray-50">
                            <h3 className="text-xl font-black text-[#1a1a2e] w-full text-center">Filters</h3>
                            <button onClick={() => setShowFiltersModal(false)} className="absolute right-6 p-2 h-10 w-10 flex items-center justify-center hover:bg-gray-50 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="p-8 max-h-[70vh] overflow-y-auto space-y-8">
                            {/* Spec Status */}
                            <div>
                                <p className="text-sm font-black text-[#1a1a2e] mb-4">Spec Status</p>
                                <div className="flex flex-wrap gap-2">
                                    {specStatuses.map(status => (
                                        <button
                                            key={status}
                                            onClick={() => setSelectedSpecStatuses(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status])}
                                            className={`px-5 py-2.5 rounded-full text-sm font-bold border transition-all flex items-center gap-2 ${selectedSpecStatuses.includes(status) ? 'bg-[#1a1a2e] text-white border-[#1a1a2e]' : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'}`}
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[status].dot}`} />
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Brands */}
                            <div>
                                <p className="text-sm font-black text-[#1a1a2e] mb-4">Brands</p>
                                <div className="flex flex-wrap gap-2">
                                    {allBrands.map(brand => (
                                        <button
                                            key={brand}
                                            onClick={() => setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand])}
                                            className={`px-5 py-2.5 rounded-full text-sm font-bold border transition-all ${selectedBrands.includes(brand) ? 'bg-[#1a1a2e] text-white border-[#1a1a2e]' : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'}`}
                                        >
                                            {brand || 'Unbranded'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tags */}
                            <div>
                                <p className="text-sm font-black text-[#1a1a2e] mb-4">Tags</p>
                                {allTags.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {allTags.map(tag => (
                                            <button
                                                key={tag}
                                                onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                                                className={`px-5 py-2.5 rounded-full text-sm font-bold border transition-all ${selectedTags.includes(tag) ? 'bg-[#1a1a2e] text-white border-[#1a1a2e]' : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'}`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 italic">No tags available</p>
                                )}
                            </div>

                            {/* Project Status */}
                            <div>
                                <p className="text-sm font-black text-[#1a1a2e] mb-4">Project Status</p>
                                <div className="flex flex-wrap gap-2">
                                    {['In Progress', 'Completed', 'On Hold'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => setSelectedProjectStatus(selectedProjectStatus === status ? null : status)}
                                            className={`px-5 py-2.5 rounded-full text-sm font-bold border transition-all ${selectedProjectStatus === status ? 'bg-[#1a1a2e] text-white border-[#1a1a2e]' : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'}`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-50 flex items-center justify-between bg-white">
                            <button
                                onClick={() => { setSelectedBrands([]); setSelectedTags([]); setSelectedSpecStatuses([]); setSelectedProjectStatus(null); }}
                                className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                Reset all
                            </button>
                            <button
                                onClick={() => setShowFiltersModal(false)}
                                className="bg-[#1a1a2e] text-white px-8 py-3.5 rounded-2xl text-sm font-black hover:bg-[#2d2d4a] transition-all shadow-lg active:scale-95 shadow-[#1a1a2e]/20"
                            >
                                Show {filteredItems.length} items
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="border border-gray-100 rounded-[28px] overflow-hidden shadow-sm bg-white">
                <table className="w-full text-sm border-collapse">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="text-left px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Name</th>
                            <th className="text-left px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Spec Status</th>
                            <th className="text-left px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Tags</th>
                            <th className="text-left px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Brand</th>
                            <th className="text-left px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">SKU</th>
                            <th className="text-left px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Quantity</th>
                            <th className="text-left px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Unit Price</th>
                            <th className="text-right px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Total (₹)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredItems.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="py-24 text-center text-gray-400 text-sm font-medium">
                                    <div className="flex flex-col items-center gap-2">
                                        <Search className="w-8 h-8 text-gray-200" />
                                        <p>{searchTerm || selectedBrands.length || selectedTags.length ? 'No materials match your search' : 'No materials to export.'}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredItems.map(({ isPhoto, data }, i) => {
                                const id = isPhoto ? data.id : data._id;
                                const thumb = isPhoto ? (data.previewUrl || '/Icons/arcmatlogo.svg') : getProductThumbnail(data);
                                const name = isPhoto ? data.title : getProductName(data);
                                const brand = isPhoto ? 'Custom Upload' : getProductBrand(data);
                                const sku = isPhoto ? '—' : (data?.skucode || (typeof data?.productId === 'object' ? data?.productId?.skucode : '') || '—');

                                const statusData = isPhoto ? data.status : productStatuses[id];
                                const st = (typeof statusData === 'object' ? statusData.status : statusData) || 'Considering';

                                // Pricing logic
                                let unitPrice = 0;
                                if (isPhoto) {
                                    unitPrice = Number(data.price) || 0;
                                } else {
                                    const meta = productStatuses[id];
                                    if (typeof meta === 'object' && meta.price !== undefined) {
                                        unitPrice = Number(meta.price);
                                    } else {
                                        const { price } = resolvePricing(data);
                                        unitPrice = price;
                                    }
                                }

                                const qty = isPhoto ? (Number(data.quantity) || 1) : (Number(productStatuses[id]?.quantity) || 1);
                                const total = qty * unitPrice;

                                return (
                                    <tr key={`${id || 'item'}-${i}`} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100 shadow-sm transition-transform group-hover:scale-105">
                                                    <img src={thumb} alt={name} className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-[#1a1a2e] mb-0.5 leading-tight">{name}</p>
                                                    <p className="text-[10px] text-[#d9a88a] font-bold uppercase tracking-wider">{projectName || 'ArcMat'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 relative">
                                            <button
                                                onClick={() => setStatusDropdown(statusDropdown === id ? null : id)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-black tracking-wider uppercase transition-all border ${st === 'Specified' ? 'bg-green-50 text-green-700 border-green-100 hover:border-green-200 shadow-sm shadow-green-100' :
                                                        st === 'Excluded' ? 'bg-pink-50 text-pink-700 border-pink-100 hover:border-pink-200 shadow-sm shadow-pink-100' :
                                                            'bg-gray-50 text-gray-700 border-gray-100 hover:border-gray-200'
                                                    }`}
                                            >
                                                <div className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[st]?.dot || 'bg-gray-500'}`} />
                                                {st}
                                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${statusDropdown === id ? 'rotate-180' : ''}`} />
                                            </button>

                                            {statusDropdown === id && (
                                                <>
                                                    <div className="fixed inset-0 z-40" onClick={() => setStatusDropdown(null)} />
                                                    <div className="absolute top-full left-6 mt-2 w-44 bg-white border border-gray-50 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                                                        {Object.keys(STATUS_STYLES).map(status => (
                                                            <button
                                                                key={status}
                                                                onClick={() => {
                                                                    if (isPhoto) handlePhotoStatusChange(id, status);
                                                                    else handleProductStatusChange(id, status);
                                                                    setStatusDropdown(null);
                                                                }}
                                                                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-[11px] font-black uppercase tracking-wider text-gray-700 flex items-center gap-3 transition-colors"
                                                            >
                                                                <div className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[status].dot}`} />
                                                                {status}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-wrap gap-1.5 mb-2">
                                                {(isPhoto ? data.tags : (productStatuses[id]?.tags))?.map((tag, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="group/tag px-3 py-1 bg-gray-50 text-[#1a1a2e] border border-gray-100 rounded-xl text-[10px] font-black flex items-center gap-1.5 hover:bg-white hover:border-[#d9a88a] transition-all"
                                                    >
                                                        <span
                                                            className="cursor-pointer"
                                                            onClick={() => {
                                                                const newTagName = prompt('Rename tag:', tag);
                                                                if (newTagName && newTagName.trim() && newTagName !== tag) {
                                                                    const currentTags = (isPhoto ? data.tags : productStatuses[id]?.tags) || [];
                                                                    const updatedTags = currentTags.map(t => t === tag ? newTagName.trim() : t);
                                                                    handlePriceQtyUpdate(id, { tags: updatedTags }, isPhoto);
                                                                }
                                                            }}
                                                        >
                                                            {tag}
                                                        </span>
                                                        <button
                                                            onClick={() => {
                                                                const currentTags = (isPhoto ? data.tags : productStatuses[id]?.tags) || [];
                                                                handlePriceQtyUpdate(id, { tags: currentTags.filter(t => t !== tag) }, isPhoto);
                                                            }}
                                                            className="text-gray-300 hover:text-red-500 transition-colors"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="+ Add label"
                                                className="text-[10px] w-full bg-transparent border-none outline-none text-[#d9a88a] hover:text-[#c48d6d] font-black uppercase tracking-widest placeholder:text-gray-200 transition-colors px-1"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && e.target.value.trim()) {
                                                        const newTag = e.target.value.trim();
                                                        const currentItemTags = (isPhoto ? data.tags : productStatuses[id]?.tags) || [];
                                                        if (!currentItemTags.includes(newTag)) {
                                                            handlePriceQtyUpdate(id, { tags: [...currentItemTags, newTag] }, isPhoto);
                                                        }
                                                        e.target.value = '';
                                                    }
                                                }}
                                            />
                                        </td>
                                        <td className="px-6 py-5 text-[#1a1a2e] font-bold text-sm">{brand || '—'}</td>
                                        <td className="px-6 py-5 text-gray-400 font-mono text-[10px] tracking-tight">{sku}</td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-1.5 bg-gray-50/50 border border-gray-100 rounded-xl px-2 py-2 focus-within:border-[#d9a88a] focus-within:bg-white transition-all w-24 group-hover:bg-white">
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={qty || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === '' || /^\d+$/.test(val)) {
                                                            handlePriceQtyUpdate(id, { quantity: val }, isPhoto);
                                                        }
                                                    }}
                                                    onBlur={(e) => {
                                                        if (e.target.value === '' || Number(e.target.value) < 1) {
                                                            handlePriceQtyUpdate(id, { quantity: 1 }, isPhoto);
                                                        }
                                                    }}
                                                    className="w-full text-sm font-black bg-transparent outline-none text-center text-[#1a1a2e]"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-gray-700 font-medium">
                                            {isPhoto ? (
                                                <div className="flex items-center gap-1.5 bg-gray-50/50 border border-gray-100 rounded-xl px-3 py-2 focus-within:border-[#d9a88a] focus-within:bg-white transition-all group-hover:bg-white">
                                                    <span className="text-[11px] text-[#d9a88a] font-black">₹</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={unitPrice}
                                                        onChange={(e) => handlePriceQtyUpdate(id, { price: e.target.value }, isPhoto)}
                                                        className="w-32 text-sm font-black bg-transparent outline-none text-[#1a1a2e]"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="font-black text-[#1a1a2e] text-sm">
                                                    <span className="text-[#d9a88a] mr-1">₹</span>
                                                    {unitPrice.toLocaleString('en-IN')}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="text-lg font-black text-[#1a1a2e]">
                                                <span className="text-[#d9a88a] mr-1.5 text-xs">₹</span>
                                                {total.toLocaleString('en-IN')}
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
