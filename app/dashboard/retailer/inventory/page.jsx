'use client';
import { useState } from 'react';
import { Search, Package, Store, Plus, X, Edit2, AlertCircle, Trash2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useGetRetailerProducts, useUpsertProductOverride, useDeleteProductOverride } from '@/hooks/useRetailer';
import { getProductImageUrl } from '@/lib/productUtils';
import Pagination from '@/components/ui/Pagination';
import Link from 'next/link';
import { toast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import clsx from 'clsx';

export default function RetailerProductsPage() {
    const searchParams = useSearchParams();
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [deletingItem, setDeletingItem] = useState(null);

    const { data: apiResponse, isLoading, refetch } = useGetRetailerProducts({
        page: currentPage,
        limit: 12,
        search: searchTerm || undefined,
    });

    const retailerProducts = apiResponse?.data?.data || apiResponse?.data || [];
    const pagination = apiResponse?.data?.pagination;

    const upsertOverride = useUpsertProductOverride();
    const deleteOverride = useDeleteProductOverride();

    const handleDelete = async () => {
        if (!deletingItem) return;

        try {
            await deleteOverride.mutateAsync(deletingItem._id);
            toast.success('Product removed from inventory');
            setDeletingItem(null);
            refetch();
        } catch (error) {
            toast.error(error.message || 'Removal failed');
        }
    };

    const handleUpdateOverride = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            productId: editingItem.product?._id,
            variantId: editingItem.variant?._id,
            mrp_price: Number(formData.get('mrp_price')),
            selling_price: Number(formData.get('selling_price')),
            stock: Number(formData.get('stock')),
            isActive: formData.get('isActive') === 'on'
        };

        try {
            await upsertOverride.mutateAsync(data);
            toast.success('Inventory updated successfully');
            setEditingItem(null);
            refetch();
        } catch (error) {
            toast.error(error.message || 'Update failed');
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Inventory</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Manage your custom pricing and stock for reselling products.
                    </p>
                </div>
                <Link
                    href="/dashboard/retailer/brands"
                    className="px-4 py-2 bg-[#e09a74] text-white rounded-xl text-sm font-semibold hover:bg-[#d08a64] transition-all shadow-sm flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add More Products
                </Link>
            </div>

            {/* Search bar */}
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search your inventory..."
                        value={searchTerm}
                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#e09a74] text-sm"
                    />
                </div>
                <span className="text-sm text-gray-400 whitespace-nowrap">
                    {pagination?.totalItems || 0} items
                </span>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-16 w-full bg-gray-50 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : retailerProducts.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-gray-200">
                    <Package className="w-12 h-12 text-gray-100 mx-auto mb-3" />
                    <h3 className="text-gray-500 font-medium">Your inventory is empty</h3>
                    <p className="text-gray-400 text-sm mt-1">Visit your partnered brands to add items.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-[10px] text-gray-400 uppercase tracking-widest font-black">
                                <th className="px-6 py-4 font-bold">Product</th>
                                <th className="px-6 py-4 font-bold">Variant</th>
                                <th className="px-6 py-4 font-bold">Price</th>
                                <th className="px-6 py-4 font-bold">Stock</th>
                                <th className="px-6 py-4 font-bold">Added On</th>
                                <th className="px-6 py-4 font-bold">Status</th>
                                <th className="px-6 py-4 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {retailerProducts.map(item => {
                                const product = item.product || {};
                                const variant = item.variant || {};
                                const imageUrl = getProductImageUrl(product.product_images?.[0]);

                                return (
                                    <tr key={item._id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4 align-middle">
                                            <div className="flex gap-4 items-center min-w-[250px]">
                                                <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                                                    {imageUrl ? (
                                                        <img src={imageUrl} alt={product.product_name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Package className="w-5 h-5 text-gray-200" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#e09a74] transition-colors truncate">{product.product_name}</h3>
                                                    <p className="text-xs text-gray-400 font-medium mt-0.5 truncate max-w-[200px]">{product.description ? product.description.replace(/<[^>]*>?/gm, '').substring(0, 50) + '...' : 'No description available'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-middle">
                                            <span className="inline-flex items-center px-2 py-1 bg-gray-50 border border-gray-100 text-gray-600 rounded-lg text-[10px] font-bold tracking-wider uppercase">
                                                {variant.variant_name || 'Standard'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 align-middle">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-sm font-black text-gray-900">₹{item.selling_price?.toLocaleString() || '0'}</span>
                                                <span className="text-[10px] font-bold text-gray-400 tracking-wider">MRP: <span className="line-through">₹{item.mrp_price?.toLocaleString() || '0'}</span></span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-middle">
                                            <span className={clsx(
                                                "text-sm font-black",
                                                item.stock <= 5 ? "text-red-500" : "text-gray-900"
                                            )}>
                                                {item.stock} <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">in stock</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 align-middle">
                                            <span className="text-sm font-bold text-gray-600">
                                                {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                }) : '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 align-middle">
                                            <span className={clsx(
                                                "inline-flex items-center px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border",
                                                item.isActive ? "bg-green-50 text-green-600 border-green-100" : "bg-gray-100 text-gray-400 border-gray-200"
                                            )}>
                                                {item.isActive ? 'Live' : 'Hidden'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 align-middle">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setEditingItem(item)}
                                                    className="p-2 text-gray-400 hover:text-gray-900 hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-200 shadow-sm hover:shadow"
                                                    title="Manage Inventory"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeletingItem(item)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-xl transition-all border border-transparent hover:border-red-100 shadow-sm hover:shadow"
                                                    title="Remove from inventory"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {pagination?.totalPages > 1 && (
                <div className="py-8 border-t border-gray-50">
                    <Pagination
                        currentPage={pagination.currentPage || 1}
                        totalPages={pagination.totalPages}
                        pageSize={pagination.limit}
                        totalItems={pagination.totalRecords}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            {/* Edit Modal */}
            {editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingItem(null)} />
                    <div className="bg-white rounded-3xl w-full max-w-md relative shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">Manage Inventory</h2>
                            <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateOverride} className="p-6 space-y-6">
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                                <div className="w-16 h-16 rounded-xl bg-white border border-gray-100 overflow-hidden shrink-0 p-1">
                                    <img
                                        src={getProductImageUrl(editingItem.product?.product_images?.[0])}
                                        alt=""
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-gray-900 truncate">{editingItem.product?.product_name}</p>
                                    <p className="text-xs text-gray-500 uppercase tracking-tight">{editingItem.variant?.variant_name || 'Standard'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">MRP Price (₹)</label>
                                    <input
                                        type="number"
                                        name="mrp_price"
                                        defaultValue={editingItem.mrp_price}
                                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#e09a74] text-sm font-bold"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Your Selling Price (₹)</label>
                                    <input
                                        type="number"
                                        name="selling_price"
                                        defaultValue={editingItem.selling_price}
                                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#e09a74] text-sm font-bold"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Available Stock</label>
                                <input
                                    type="number"
                                    name="stock"
                                    defaultValue={editingItem.stock}
                                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#e09a74] text-sm font-bold"
                                    required
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                <div>
                                    <p className="text-sm font-bold text-gray-900">Make product live</p>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-tighter">Visibility on your storefront</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" name="isActive" defaultChecked={editingItem.isActive} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e09a74]"></div>
                                </label>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditingItem(null)}
                                    className="flex-1 py-4 text-sm font-black text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                                <Button
                                    type="submit"
                                    loading={upsertOverride.isPending}
                                    className="flex-1 py-4! bg-[#e09a74] text-white rounded-2xl text-sm font-black hover:bg-[#d08a64] uppercase tracking-widest shadow-lg shadow-[#e09a74]/20"
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={!!deletingItem}
                onClose={() => setDeletingItem(null)}
                onConfirm={handleDelete}
                title="Remove Product"
                message={`Are you sure you want to remove ${deletingItem?.product?.product_name} from your inventory? This action cannot be undone.`}
                confirmText="Remove"
                cancelText="Cancel"
                type="danger"
            />
        </div>
    );
}
