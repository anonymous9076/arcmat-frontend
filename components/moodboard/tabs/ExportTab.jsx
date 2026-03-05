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
    const [showFilters, setShowFilters] = useState(false);
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

        return items;
    }, [products, customPhotos, searchTerm, selectedBrands, selectedTags, productStatuses]);

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
                        {(searchTerm || selectedBrands.length || selectedTags.length) > 0 && (
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
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 max-w-md">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or brand..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1a1a2e]/5 transition-all"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-semibold transition-all ${showFilters ? 'bg-[#1a1a2e] text-white border-[#1a1a2e]' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Filter className="w-4 h-4" />
                            Filters
                            {(selectedBrands.length + selectedTags.length) > 0 && (
                                <span className="ml-1 bg-[#d9a88a] text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                    {selectedBrands.length + selectedTags.length}
                                </span>
                            )}
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

                {showFilters && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl animate-in slide-in-from-top-1 duration-200">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Brands</p>
                                <div className="flex flex-wrap gap-2">
                                    {allBrands.map(brand => (
                                        <button
                                            key={brand}
                                            onClick={() => setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand])}
                                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${selectedBrands.includes(brand) ? 'bg-[#1a1a2e] text-white border-[#1a1a2e]' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                                        >
                                            {brand}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Tags</p>
                                <div className="flex flex-wrap gap-2">
                                    {allTags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${selectedTags.includes(tag) ? 'bg-[#1a1a2e] text-white border-[#1a1a2e]' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {(selectedBrands.length > 0 || selectedTags.length > 0) && (
                            <button
                                onClick={() => { setSelectedBrands([]); setSelectedTags([]); }}
                                className="mt-4 text-xs font-bold text-[#d9a88a] hover:underline"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="text-left px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="text-left px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Spec Status</th>
                            <th className="text-left px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Tags</th>
                            <th className="text-left px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Brand</th>
                            <th className="text-left px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">SKU</th>
                            <th className="text-left px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Quantity</th>
                            <th className="text-left px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Unit Price</th>
                            <th className="text-right px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total (₹)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {filteredItems.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="py-16 text-center text-gray-400 text-sm font-medium">
                                    {searchTerm || selectedBrands.length || selectedTags.length ? 'No items match your search' : 'No materials to export.'}
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
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100 shadow-sm">
                                                    <img src={thumb} alt={name} className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-[#1a1a2e] mb-0.5">{name}</p>
                                                    <p className="text-[10px] text-gray-400 font-medium">{project?.projectName || 'ArcMat'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 relative">
                                            <button
                                                onClick={() => setStatusDropdown(statusDropdown === id ? null : id)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${st === 'Specified' ? 'bg-green-50 text-green-700 border-green-100 hover:border-green-200' :
                                                    st === 'Excluded' ? 'bg-pink-50 text-pink-700 border-pink-100 hover:border-pink-200' :
                                                        'bg-gray-50 text-gray-700 border-gray-100 hover:border-gray-200'
                                                    }`}
                                            >
                                                <div className={`w-2 h-2 rounded-full ${STATUS_STYLES[st]?.dot || 'bg-gray-500'}`} />
                                                {st}
                                                <ChevronDown className={`w-3 h-3 transition-transform ${statusDropdown === id ? 'rotate-180' : ''}`} />
                                            </button>

                                            {statusDropdown === id && (
                                                <>
                                                    <div className="fixed inset-0 z-40" onClick={() => setStatusDropdown(null)} />
                                                    <div className="absolute top-full left-4 mt-1 w-36 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                                                        {Object.keys(STATUS_STYLES).map(status => (
                                                            <button
                                                                key={status}
                                                                onClick={() => {
                                                                    if (isPhoto) handlePhotoStatusChange(id, status);
                                                                    else handleProductStatusChange(id, status);
                                                                    setStatusDropdown(null);
                                                                }}
                                                                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs font-bold text-gray-700 flex items-center gap-2"
                                                            >
                                                                <div className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[status].dot}`} />
                                                                {status}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-wrap gap-1 mb-1.5">
                                                {(isPhoto ? data.tags : (productStatuses[id]?.tags))?.map((tag, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="group/tag px-2 py-0.5 bg-gray-50 text-[#1a1a2e] border border-gray-100 rounded-md text-[10px] font-bold flex items-center gap-1 hover:border-gray-200"
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
                                                            className="text-gray-300 hover:text-red-500"
                                                        >
                                                            <X className="w-2.5 h-2.5" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="+ Tag"
                                                className="text-[10px] w-full bg-transparent border-none outline-none text-gray-400 hover:text-[#d9a88a] font-bold placeholder:text-gray-300 transition-colors px-1"
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
                                        <td className="px-4 py-4 text-gray-700 font-semibold">{brand || '—'}</td>
                                        <td className="px-4 py-4 text-gray-400 font-mono text-[10px] tracking-tighter">{sku}</td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 focus-within:border-[#d9a88a] transition-all w-20">
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
                                                    className="w-full text-sm font-bold bg-transparent outline-none text-center"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-gray-700 font-medium">
                                            {isPhoto ? (
                                                <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 focus-within:border-[#d9a88a] transition-all">
                                                    <span className="text-[10px] text-gray-400 font-bold">₹</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={unitPrice}
                                                        onChange={(e) => handlePriceQtyUpdate(id, { price: e.target.value }, isPhoto)}
                                                        className="w-20 text-sm font-bold bg-transparent outline-none"
                                                    />
                                                </div>
                                            ) : (
                                                <span className="font-bold">₹{unitPrice.toLocaleString('en-IN')}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <span className="text-sm font-black text-[#1a1a2e]">
                                                ₹{total.toLocaleString('en-IN')}
                                            </span>
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
