'use client';

import React, { useState } from 'react';
import { Search, Info, LayoutGrid, List } from 'lucide-react';
import { useGetBrands, useUpdateBrand } from '@/hooks/useBrand';
import { toast } from '@/components/ui/Toast';
import Image from 'next/image';
import { getBrandImageUrl } from '@/lib/productUtils';
import Pagination from '@/components/ui/Pagination';

const BrandsAdmin = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const limit = 12;

    const { data: brandsData, isLoading } = useGetBrands({
        page,
        limit,
        search: searchQuery
    });

    const updateBrandMutation = useUpdateBrand();

    const brands = brandsData?.data?.data || [];
    const pagination = brandsData?.data?.pagination || { total: 0, totalPages: 1 };

    const handleToggleHomepage = async (brand) => {
        const newValue = brand.showOnHomepage === 1 ? 0 : 1;
        try {
            await updateBrandMutation.mutateAsync({
                id: brand._id,
                data: { showOnHomepage: newValue }
            });
            toast.success(`${brand.name} ${newValue === 1 ? 'added to' : 'removed from'} homepage`);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update brand");
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#d9a88a]"></div>
            </div>
        );
    }

    const featuredCount = brands.filter(b => b.showOnHomepage === 1).length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                <div className="relative flex-1 max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search all brands..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setPage(1);
                        }}
                        className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d9a88a]/20 focus:bg-white w-full transition-all"
                    />
                </div>
                
                <div className="flex items-center gap-2 px-4 py-2 bg-[#d9a88a]/10 rounded-xl border border-[#d9a88a]/20">
                    <Info className="w-4 h-4 text-[#d9a88a]" />
                    <span className="text-sm font-medium text-[#d9a88a]">
                        Selected Brands: <span className="font-bold underline">{featuredCount}</span> (on current page)
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {brands.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                        <p className="text-gray-500">No brands found matching your search.</p>
                    </div>
                ) : (
                    brands.map((brand) => (
                        <div 
                            key={brand._id}
                            className={`group relative bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
                                brand.showOnHomepage === 1 
                                ? 'border-[#d9a88a] ring-1 ring-[#d9a88a]' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div className="p-4 flex flex-col items-center gap-4">
                                <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-50 border border-gray-50 p-2">
                                    <Image
                                        src={getBrandImageUrl(brand.logo)}
                                        alt={brand.name}
                                        fill
                                        className="object-contain group-hover:scale-110 transition-transform duration-500"
                                        unoptimized
                                    />
                                </div>
                                
                                <div className="text-center w-full">
                                    <h3 className="font-bold text-gray-900 truncate px-2" title={brand.name}>
                                        {brand.name}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-semibold">
                                        {brand.isActive === 1 ? 'Active' : 'Inactive'}
                                    </p>
                                </div>

                                <button
                                    onClick={() => handleToggleHomepage(brand)}
                                    disabled={updateBrandMutation.isPending}
                                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                        brand.showOnHomepage === 1
                                        ? 'bg-[#d9a88a] text-white shadow-lg shadow-[#d9a88a]/20'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {brand.showOnHomepage === 1 ? (
                                        <><span>Featured on Home</span></>
                                    ) : (
                                        <><span>Add to Home</span></>
                                    )}
                                </button>
                            </div>

                            {brand.showOnHomepage === 1 && (
                                <div className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 bg-[#d9a88a] rounded-full shadow-sm">
                                    <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {pagination.totalPages > 1 && (
                <div className="mt-8 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                    <Pagination
                        currentPage={page}
                        totalPages={pagination.totalPages}
                        pageSize={limit}
                        totalItems={pagination.total}
                        onPageChange={(p) => setPage(p)}
                    />
                </div>
            )}
        </div>
    );
};

export default BrandsAdmin;
