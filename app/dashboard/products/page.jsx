'use client';

import { useState, useEffect } from 'react';
import { Search, Package, Plus, Loader2, Layout, IndianRupee, Info, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useGetRetailerProducts } from '@/hooks/useProduct';
import useProjectStore from '@/store/useProjectStore';
import Button from '@/components/ui/Button';
import AddToMoodboardModal from '@/components/dashboard/projects/AddToMoodboardModal';
import Link from 'next/link';
import Image from 'next/image';

export default function ArchitectProductsPage() {
    const { activeProjectId, activeProjectName, activeMoodboardId, activeMoodboardName } = useProjectStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const { data: productsData, isLoading } = useGetRetailerProducts({
        page: currentPage,
        limit: 12,
        search: searchTerm,
    });

    const products = productsData?.data?.data || productsData?.data || [];
    const pagination = productsData?.pagination || productsData?.data?.pagination;

    const handleAddToMoodboard = (product) => {
        setSelectedProduct(product);
        setIsAddModalOpen(true);
    };

    const activeContextText = activeMoodboardName
        ? `Add to ${activeMoodboardName}`
        : activeProjectName
            ? "Add to Moodboard"
            : "Select Project First";

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-[#2d3142] mb-2 tracking-tight">
                        Product Library
                    </h1>
                    <p className="text-gray-400 font-medium">
                        Browse and add curated materials to your project moodboards.
                    </p>
                </div>

                {activeProjectId ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="bg-[#fef7f2] border border-[#d9a88a]/20 px-6 py-3 rounded-2xl flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#d9a88a] text-white rounded-xl flex items-center justify-center">
                                <Package className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] text-[#d9a88a] font-black uppercase tracking-widest leading-none mb-1">Active Project</p>
                                <p className="text-[#2d3142] font-bold leading-none">{activeProjectName}</p>
                            </div>
                            <Link href="/dashboard/projects" className="text-xs text-gray-400 hover:text-[#d9a88a] font-bold ml-2 underline underline-offset-4">Change</Link>
                        </div>

                        {activeMoodboardId && (
                            <Link
                                href={`/dashboard/projects/${activeProjectId}/moodboards/${activeMoodboardId}`}
                                className="group flex items-center gap-3 px-6 py-3 bg-[#2d3142] text-white rounded-2xl font-black text-sm hover:bg-[#d9a88a] hover:shadow-xl hover:shadow-orange-100 transition-all duration-300 transform active:scale-95"
                            >
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                Return to {activeMoodboardName}
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="bg-orange-50 border border-orange-100 px-6 py-3 rounded-2xl flex items-center gap-4">
                        <Info className="w-5 h-5 text-orange-500" />
                        <p className="text-sm text-orange-600 font-bold">Please select a project first to add products.</p>
                        <Link href="/dashboard/projects" className="px-4 py-2 bg-orange-500 text-white text-xs font-black rounded-xl hover:bg-orange-600 transition-all">Go to Projects</Link>
                    </div>
                )}
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm mb-8">
                <div className="relative w-full">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                    <input
                        type="text"
                        placeholder="Search materials, furniture, brands..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-[#f3f4f6] border-transparent focus:bg-white focus:border-[#d9a88a] focus:ring-0 rounded-2xl transition-all text-gray-600 font-medium"
                    />
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                    <Loader2 className="w-12 h-12 text-[#d9a88a] animate-spin mb-4" />
                    <p className="text-gray-400 font-bold text-lg">Curating the library...</p>
                </div>
            ) : products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products.map(product => (
                        <div key={product._id} className="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm hover:shadow-xl transition-all duration-500 group">
                            <div className="aspect-square bg-gray-50 rounded-2xl relative overflow-hidden mb-4 border border-gray-50">
                                {product.variant_images?.[0]?.secure_url || product.productId?.product_images?.[0]?.secure_url || product.secure_url ? (
                                    <Image
                                        src={product.variant_images?.[0]?.secure_url || product.productId?.product_images?.[0]?.secure_url || product.secure_url}
                                        alt={product.product_name || product.productId?.product_name}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-200">
                                        <ShoppingBag className="w-10 h-10" />
                                    </div>
                                )}
                                <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-black text-[#d9a88a] uppercase tracking-widest shadow-sm">
                                    {product.productId?.brand?.name || product.brand_name || 'Brand'}
                                </div>

                                {product.selling_price && (
                                    <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-[#2d3142] rounded-xl text-white font-black text-sm flex items-center shadow-lg">
                                        <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                                        {product.selling_price.toLocaleString('en-IN')}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1 mb-4 h-[64px]">
                                <h3 className="text-lg font-bold text-[#2d3142] line-clamp-2 leading-tight">
                                    {product.product_name || product.productId?.product_name}
                                </h3>
                                <p className="text-xs text-gray-400 font-medium truncate">
                                    {product.sort_description || product.productId?.sort_description || 'Material Specification'}
                                </p>
                            </div>

                            <Button
                                disabled={!activeProjectId}
                                onClick={() => handleAddToMoodboard(product)}
                                className={`w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${activeProjectId
                                    ? 'bg-[#2d3142] text-white hover:bg-[#d9a88a] shadow-lg shadow-gray-100'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                    }`}
                            >
                                <Plus className="w-4 h-4" />
                                {activeContextText}
                            </Button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[40px] border border-dashed border-gray-200 text-center">
                    <div className="w-24 h-24 bg-[#fef7f2] rounded-3xl flex items-center justify-center mb-8">
                        <ShoppingBag className="w-12 h-12 text-[#d9a88a]" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#2d3142] mb-3">No products found</h3>
                    <p className="text-gray-400 font-medium max-w-sm mx-auto">
                        Try adjusted your search or filters to find what you're looking for.
                    </p>
                </div>
            )}

            {/* Modals */}
            <AddToMoodboardModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                product={selectedProduct}
            />
        </div>
    );
}
