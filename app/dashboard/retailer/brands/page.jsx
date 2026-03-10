'use client';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Store, Package, ExternalLink, Search, Check, Plus, ArrowRight, MapPin } from 'lucide-react';
import useAuthStore from '@/store/useAuthStore';
import { useGetBrands } from '@/hooks/useBrand';
import { useGetRetailerBrands, useUpdateRetailerBrands } from '@/hooks/useRetailer';
import { useGetAddresses } from '@/hooks/useAddress';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import clsx from 'clsx';
import { getBrandImageUrl } from '@/lib/productUtils';


export default function RetailerBrandsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const retailerId = searchParams.get('retailerId');
    const [view, setView] = useState(retailerId ? 'my-brands' : 'explore'); // Admin viewing retailer -> partnered, Retailer self -> explore
    const [searchTerm, setSearchTerm] = useState('');

    const { user } = useAuthStore();
    const effectiveRetailerId = retailerId || user?._id || user?.id;

    const { data: allBrandsData, isLoading: allLoading } = useGetBrands();
    const { data: myBrandsData, isLoading: myLoading } = useGetRetailerBrands(effectiveRetailerId);
    const { data: addressesData, isLoading: addressLoading } = useGetAddresses(effectiveRetailerId);
    const updateBrands = useUpdateRetailerBrands();

    const addresses = addressesData?.data || [];
    const hasAddress = addresses.length > 0;
    const isRetailer = user?.role === 'retailer';

    const allBrands = Array.isArray(allBrandsData?.data)
        ? allBrandsData.data
        : Array.isArray(allBrandsData?.data?.data)
            ? allBrandsData.data.data
            : [];

    const myBrands = Array.isArray(myBrandsData?.data)
        ? myBrandsData.data
        : Array.isArray(myBrandsData?.data?.data)
            ? myBrandsData.data.data
            : [];

    const myBrandIds = myBrands.map(b => b._id || b.id);

    const handleJoinBrand = async (brandId) => {
        if (!hasAddress) {
            toast.error('Please register at least one address before adding brand partnerships');
            return;
        }
        try {
            await updateBrands.mutateAsync({ brandId, action: 'add', retailerId });
            toast.success('Brand added to reselling list');
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to add brand';
            toast.error(message);
        }
    };

    const handleLeaveBrand = async (brandId) => {
        try {
            await updateBrands.mutateAsync({ brandId, action: 'remove', retailerId });
            toast.success('Brand removed from reselling list');
        } catch (error) {
            toast.error('Failed to remove brand');
        }
    };

    const filteredBrands = (view === 'my-brands' ? myBrands : allBrands).filter(b =>
        b.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isLoading = view === 'my-brands' ? myLoading : allLoading;

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                        {retailerId ? 'Manage Retailer Partnerships' : 'Brand Partnerships'}
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {retailerId ? `Managing brands for Retailer ID: ${retailerId}` : 'Manage your relationships with suppliers and discover new brands.'}
                    </p>
                </div>

                <div className="flex bg-gray-100 p-1.5 rounded-2xl w-fit shadow-inner">
                    <button
                        onClick={() => { setView('my-brands'); setSearchTerm(''); }}
                        className={clsx(
                            "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                            view === 'my-brands' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <Check className={clsx("w-4 h-4", view === 'my-brands' ? "text-green-500" : "hidden")} />
                        Partnered Brands
                        <span className="ml-1 px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded-md text-[10px]">{myBrands.length}</span>
                    </button>
                    <button
                        onClick={() => { setView('explore'); setSearchTerm(''); }}
                        className={clsx(
                            "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                            view === 'explore' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Explore
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="relative group max-w-md flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#e09a74] w-5 h-5 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search brands by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-[#e09a74]/10 shadow-sm text-sm transition-all"
                    />
                </div>
            </div>

            {!hasAddress && !addressLoading && !retailerId && isRetailer && (
                <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-amber-500">
                            <MapPin className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-amber-900 leading-tight">Address Required</h4>
                            <p className="text-xs text-amber-700 mt-1 font-medium italic opacity-70">
                                You must register at least one address before you can partner with brands.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push('/profile')}
                        className="px-6 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-black hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                    >
                        Go to Profile
                    </button>
                </div>
            )}

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-3xl border border-gray-100 p-6 animate-pulse space-y-4">
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl" />
                            <div className="h-4 bg-gray-50 rounded w-3/4" />
                            <div className="h-3 bg-gray-50 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : filteredBrands.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
                    <Store className="w-20 h-20 text-gray-100 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900">No brands found</h3>
                    <p className="text-gray-500 text-center max-w-xs mt-2">
                        {view === 'my-brands'
                            ? "No partnered brands found."
                            : "No brands match your search criteria."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredBrands.map(brand => {
                        const isJoined = myBrandIds.includes(brand._id || brand.id);
                        return (
                            <div
                                key={brand._id || brand.id}
                                className="bg-white rounded-3xl border border-gray-50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all p-8 flex flex-col group relative overflow-hidden"
                            >
                                {/* Decorative circle */}
                                <div className="absolute -top-12 -right-12 w-32 h-32 bg-gray-50 rounded-full group-hover:bg-[#e09a74]/5 transition-colors" />

                                <div className="flex items-start justify-between relative">
                                    <div className="w-20 h-20 rounded-2xl bg-white border border-gray-100 shadow-inner flex items-center justify-center overflow-hidden p-2">
                                        {brand.logo ? (
                                            <img src={getBrandImageUrl(brand.logo)} alt={brand.name} className="w-full h-full object-contain" />
                                        ) : (

                                            <Store className="w-8 h-8 text-gray-200" />
                                        )}
                                    </div>
                                    <span className={clsx(
                                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                        brand.isActive == 1 ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
                                    )}>
                                        {'Active '}
                                    </span>
                                </div>

                                <div className="mt-8">
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none">{brand.name}</h2>
                                    <p className="text-sm text-gray-500 mt-4 line-clamp-2 leading-relaxed h-fit italic">
                                        {brand.description || "Leading supplier of premium architectural materials and decorative elements."}
                                    </p>

                                    {/* <div className="mt-6 flex items-center gap-6">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest font-mono">Products</span>
                                            <span className="text-lg font-black text-gray-900">{brand.productsCount || 0}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest font-mono">Category</span>
                                            <span className="text-sm font-bold text-gray-600 truncate max-w-[120px]">{brand.category?.name || 'General'}</span>
                                        </div>
                                    </div> */}
                                </div>

                                <div className="mt-10 flex gap-3 pt-6 border-t border-gray-50">
                                    {isJoined ? (
                                        <>
                                            <Link
                                                href={`/dashboard/retailer/brands/${brand._id || brand.id}/inventory${retailerId ? `?retailerId=${retailerId}` : ''}`}
                                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#1a202c] text-white rounded-2xl text-xs font-bold hover:bg-black transition-all shadow-lg"
                                            >
                                                <Package className="w-4 h-4" />
                                                Inventory
                                            </Link>
                                            {!retailerId && (
                                                <button
                                                    onClick={() => handleLeaveBrand(brand._id || brand.id)}
                                                    className="px-4 py-3 border border-red-50 text-red-400 rounded-2xl hover:bg-red-50 transition-colors"
                                                    title="Leave Brand"
                                                >
                                                    <XIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        !retailerId && (
                                            <button
                                                onClick={() => handleJoinBrand(brand._id || brand.id)}
                                                className="flex-1 flex items-center justify-center gap-3 py-4 bg-[#e09a74] text-white rounded-2xl text-sm font-black hover:bg-[#d08a64] transition-all shadow-lg shadow-[#e09a74]/20"
                                            >
                                                <Plus className="w-5 h-5" />
                                                Partner with Brand
                                                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function XIcon({ className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
    );
}
