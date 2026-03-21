import { useState, useMemo, useEffect } from 'react';
import { useGetRetailerProducts } from '@/hooks/useProduct';
import { useMarkNotificationsRead } from '@/hooks/useProject';
import { getProductThumbnail, getProductName, getProductBrand, formatCurrency, resolvePricing } from '@/lib/productUtils';
import { Search, X, Loader2, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function ReplaceMaterialModal({
    isOpen,
    onClose,
    projectId,
    spaceId,
    oldMaterialId,
    oldMaterialName,
    onReplace,
    isReplacing
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [reason, setReason] = useState('');

    const { data: productsData, isLoading } = useGetRetailerProducts({ limit: 100 }); // Getting a list for quick search
    const allProducts = productsData?.data?.data || [];
    const { mutate: markNotificationsRead } = useMarkNotificationsRead();

    // Mark as read when the modal opens
    useEffect(() => {
        if (isOpen && projectId && spaceId && oldMaterialId) {
            markNotificationsRead({ id: projectId, spaceId, materialId: oldMaterialId });
        }
    }, [isOpen, projectId, spaceId, oldMaterialId, markNotificationsRead]);

    const searchResults = useMemo(() => {
        if (!searchTerm.trim()) return [];
        const term = searchTerm.toLowerCase();
        return allProducts.filter(p => {
            if (p._id === oldMaterialId) return false; // Exclude current material
            return getProductName(p).toLowerCase().includes(term) ||
                getProductBrand(p).toLowerCase().includes(term) ||
                (p.product_unique_id || '').toLowerCase().includes(term);
        }).slice(0, 5); // Limit to top 5 results
    }, [searchTerm, allProducts, oldMaterialId]);


    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedProduct || !reason.trim()) return;
        onReplace(oldMaterialId, oldMaterialName, selectedProduct, reason.trim());
    };

    const handleClose = () => {
        setSearchTerm('');
        setSelectedProduct(null);
        setReason('');
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={handleClose}
        >
            <div
                className="bg-white rounded-3xl w-full max-w-xl shadow-2xl relative animate-in zoom-in-95 duration-200 cursor-default"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-[#fef7f2] rounded-t-3xl">
                    <div>
                        <h2 className="text-xl font-black text-[#2d3142]">Replace Material</h2>
                        <p className="text-sm font-medium text-gray-500 mt-1">
                            Replacing <span className="text-pink-500 line-through font-bold">{oldMaterialName}</span>
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Search Field */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Search New Material</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setSelectedProduct(null); // Reset selection if search changes
                                    }}
                                    placeholder="Search by name, brand, or SKU..."
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#d9a88a] focus:border-[#d9a88a] outline-none transition-all"
                                />
                                {isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d9a88a] animate-spin" />}
                            </div>

                            {/* Search Dropdown */}
                            {searchTerm.trim() && !selectedProduct && searchResults.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                                    {searchResults.map(prod => (
                                        <button
                                            key={prod._id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedProduct(prod);
                                                setSearchTerm(getProductName(prod));
                                            }}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 text-left"
                                        >
                                            <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                                <img src={getProductThumbnail(prod)} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-[#1a1a2e] truncate">{getProductName(prod)}</p>
                                                <p className="text-xs text-gray-500 truncate">{getProductBrand(prod)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-[#d9a88a]">{formatCurrency(resolvePricing(prod).price)}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {searchTerm.trim() && !selectedProduct && searchResults.length === 0 && !isLoading && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 text-center">
                                    <p className="text-sm text-gray-500">No products found matching "{searchTerm}"</p>
                                </div>
                            )}
                        </div>

                        {/* Selected Product Preview */}
                        {selectedProduct && (
                            <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-4">
                                <div className="w-16 h-16 bg-white rounded-xl overflow-hidden shrink-0 border border-green-200">
                                    <img src={getProductThumbnail(selectedProduct)} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                                        <CheckCircleIcon className="w-3.5 h-3.5" /> Selected
                                    </p>
                                    <p className="text-base font-bold text-[#1a1a2e]">{getProductName(selectedProduct)}</p>
                                    <p className="text-sm text-gray-600">{getProductBrand(selectedProduct)} &bull; {formatCurrency(resolvePricing(selectedProduct).price)}</p>
                                </div>
                            </div>
                        )}

                        {/* Reason Textarea */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Reason for Replacement</label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="E.g., Client requested a darker finish, out of stock, cost saving..."
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#d9a88a] focus:border-[#d9a88a] outline-none transition-all resize-none h-28"
                                required
                            />
                        </div>

                        <div className="pt-2">
                            <Button
                                type="submit"
                                disabled={!selectedProduct || !reason.trim() || isReplacing}
                                className="w-full h-12 bg-[#1a1a2e] hover:bg-[#2d2d4a] text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            >
                                {isReplacing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" /> Replacing...
                                    </>
                                ) : (
                                    <>
                                        Confirm Replacement <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

function CheckCircleIcon(props) {
    return (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}
