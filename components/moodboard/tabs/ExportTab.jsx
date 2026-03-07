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
    handleProductStatusChange,
    handleAddCustomRow
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [selectedSpecStatuses, setSelectedSpecStatuses] = useState([]);
    const [selectedProjectStatus, setSelectedProjectStatus] = useState(null);
    const [showFiltersModal, setShowFiltersModal] = useState(false);
    const [statusDropdown, setStatusDropdown] = useState(null);
    const [showMoreMenu, setShowMoreMenu] = useState(false);

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
        <div className="h-full flex flex-col p-4 md:p-8 min-h-0 overflow-hidden">
            {/* Header Summary */}
            <div className="shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-gray-100">
                <div>
                    <h2 className="text-2xl font-black text-[#1a1a2e] mb-1">Export Summary</h2>
                    <p className="text-sm text-gray-500 font-medium">Manage and export your project materials</p>
                </div>
                <div className="text-left md:text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Estimation</p>
                    <div className="flex items-baseline gap-2 justify-start md:justify-end">
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
            <div className="shrink-0 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto flex-1 max-w-full lg:max-w-md">
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
                        className={`flex items-center justify-center gap-2 px-5 py-3 border rounded-2xl text-sm font-bold transition-all shadow-sm ${(selectedBrands.length || selectedTags.length || selectedSpecStatuses.length) > 0 ? 'bg-[#1a1a2e] text-white border-[#1a1a2e]' : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'}`}
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

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <button className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-5 py-3 border border-gray-100 bg-white rounded-2xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
                        <Edit2 className="w-4 h-4" /> <span className="hidden sm:inline">Choose template</span><span className="sm:hidden">Template</span>
                    </button>
                    <button
                        onClick={exportAsCSV}
                        className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-6 py-3 bg-[#1a1a2e] text-white rounded-2xl text-sm font-black hover:bg-[#2d2d4a] transition-all shadow-md active:scale-95"
                    >
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setShowMoreMenu(!showMoreMenu)}
                            className="p-3 border border-gray-100 bg-white rounded-2xl text-gray-500 hover:bg-gray-50 transition-all shadow-sm shrink-0 h-[46px] w-[46px] flex items-center justify-center" // Ensure button size matches others
                        >
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                        {showMoreMenu && (
                            <>
                                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowMoreMenu(false)} />
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] py-2 z-50 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        onClick={() => {
                                            handleAddCustomRow?.();
                                            setShowMoreMenu(false);
                                        }}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm font-bold text-gray-700 transition-colors"
                                    >
                                        Add custom row
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Filters Modal */}
            {showFiltersModal && (
                <div className="fixed inset-0 z-300 flex items-center justify-center p-4">
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
            <div className={`flex-1 border border-gray-100 rounded-[28px] overflow-auto shadow-sm bg-white transition-all duration-300 relative ${statusDropdown ? 'pb-[180px]' : ''}`}>
                <table className="w-full text-sm border-separate border-spacing-0 min-w-[1000px]">
                    <thead className="bg-gray-50/95 sticky top-0 z-20 backdrop-blur-sm shadow-[0_1px_0_0_#f3f4f6]">
                        <tr>
                            <th className="text-left px-3 py-4 text-xs font-black text-gray-400 uppercase tracking-widest min-w-[200px] md:sticky md:left-0 md:z-30 bg-gray-50/95 shadow-[1px_0_0_0_#f3f4f6]">Name</th>
                            <th className="text-left px-3 py-4 text-xs font-black text-gray-400 uppercase tracking-widest min-w-[140px]">Spec Status</th>
                            <th className="text-left px-3 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Tags</th>
                            <th className="text-left px-3 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Brand</th>
                            <th className="text-left px-3 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">SKU</th>
                            <th className="text-left px-3 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Quantity</th>
                            <th className="text-left px-3 py-4 text-xs font-black text-gray-400 uppercase tracking-widest min-w-[110px]">Unit Price</th>
                            <th className="text-right px-3 py-4 text-xs font-black text-gray-400 uppercase tracking-widest min-w-[110px]">Total (₹)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 bg-white">
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
                                    unitPrice = data.price !== undefined ? data.price : 0;
                                } else {
                                    const meta = productStatuses[id];
                                    if (typeof meta === 'object' && meta.price !== undefined) {
                                        unitPrice = meta.price;
                                    } else {
                                        const { price } = resolvePricing(data);
                                        unitPrice = price;
                                    }
                                }

                                let qty = isPhoto ? data.quantity : productStatuses[id]?.quantity;
                                if (qty === undefined || qty === null) qty = 1;

                                const total = (Number(qty) || 0) * (Number(unitPrice) || 0);

                                return (
                                    <tr key={`${id || 'item'}-${i}`} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-3 py-3 md:sticky md:left-0 md:z-10 bg-white group-hover:bg-gray-50/80 transition-colors md:shadow-[1px_0_0_0_#f3f4f6]">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100 shadow-sm transition-transform group-hover:scale-105">
                                                    <img src={thumb} alt={name} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="min-w-0 pr-2">
                                                    {isPhoto ? (
                                                        <input
                                                            type="text"
                                                            value={name}
                                                            onChange={(e) => handlePriceQtyUpdate(id, { title: e.target.value }, true)}
                                                            className="font-black text-[#1a1a2e] mb-0.5 leading-tight truncate w-[140px] xl:w-[220px] bg-transparent border-none outline-none focus:ring-1 focus:ring-gray-200 rounded px-1 -mx-1 transition-all"
                                                        />
                                                    ) : (
                                                        <p className="font-black text-[#1a1a2e] mb-0.5 leading-tight truncate w-[140px] xl:w-[220px] whitespace-nowrap overflow-hidden text-ellipsis">{name}</p>
                                                    )}
                                                    <p className="text-[9px] text-[#d9a88a] font-bold uppercase tracking-wider truncate overflow-hidden text-ellipsis">{projectName || 'ArcMat'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="relative">
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
                                                        <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setStatusDropdown(null)} />
                                                        <div
                                                            className={`absolute ${i >= filteredItems.length - 2 && filteredItems.length > 2 ? 'bottom-full mb-2 slide-in-from-bottom-2' : 'top-full mt-2 slide-in-from-top-2'} left-0 w-44 bg-white border border-gray-100 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] py-2 z-50 animate-in fade-in duration-200`}
                                                            onClick={e => e.stopPropagation()}
                                                        >
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
                                            </div>
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex flex-wrap gap-1 mb-1.5">
                                                {(isPhoto ? data.tags : (productStatuses[id]?.tags))?.map((tag, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="group/tag px-2 py-0.5 bg-gray-50 text-[#1a1a2e] border border-gray-100 rounded-lg text-[9px] font-black flex items-center gap-1 hover:bg-white hover:border-[#d9a88a] transition-all"
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
                                                            <X className="w-2.5 h-2.5" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="+ Add label"
                                                className="text-[9px] w-full bg-transparent border-none outline-none text-[#d9a88a] hover:text-[#c48d6d] font-black uppercase tracking-widest placeholder:text-gray-200 transition-colors px-1"
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
                                        <td className="px-3 py-3 text-[#1a1a2e] font-bold text-xs truncate max-w-[100px]">{brand || '—'}</td>
                                        <td className="px-3 py-3 text-gray-400 font-mono text-[9px] tracking-tight truncate max-w-[100px]">{sku}</td>
                                        <td className="px-3 py-3">
                                            <div className="flex items-center gap-1.5 bg-gray-50/50 border border-gray-100 rounded-lg px-2 py-1.5 focus-within:border-[#d9a88a] focus-within:bg-white transition-all w-20 group-hover:bg-white">
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={qty || ''}
                                                    onFocus={(e) => e.target.select()}
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
                                        <td className="px-3 py-3 text-gray-700 font-medium">
                                            {isPhoto ? (
                                                <div className="flex items-center gap-1 bg-gray-50/50 border border-gray-100 rounded-lg px-2 py-1.5 focus-within:border-[#d9a88a] focus-within:bg-white transition-all group-hover:bg-white">
                                                    <span className="text-[10px] text-[#d9a88a] font-black">₹</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={unitPrice}
                                                        onFocus={(e) => e.target.select()}
                                                        onChange={(e) => handlePriceQtyUpdate(id, { price: e.target.value }, isPhoto)}
                                                        className="w-20 text-xs font-black bg-transparent outline-none text-[#1a1a2e]"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="font-black text-[#1a1a2e] text-xs">
                                                    <span className="text-[#d9a88a] mr-1">₹</span>
                                                    {unitPrice.toLocaleString('en-IN')}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            <div className="text-sm font-black text-[#1a1a2e]">
                                                <span className="text-[#d9a88a] mr-1 text-[10px]">₹</span>
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

            <div className="mt-6 shrink-0">
                <p className="text-[10px] text-gray-400 italic">
                    * Prices shown are indicative and subject to final quotation by the vendor.
                </p>
            </div>
        </div>
    );
}
