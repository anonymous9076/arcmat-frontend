'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Container from '@/components/ui/Container';
import { useGetBrandById } from '@/hooks/useBrand';
import { useGetRetailerProducts } from '@/hooks/useProduct';
import { getBrandImageUrl } from '@/lib/productUtils';
import ProductCard from '@/components/cards/ProductCard';
import Link from 'next/link';
import { Loader2, Globe, User, Package, Info, ArrowRight } from 'lucide-react';

const BrandDetailPage = () => {
    const { id } = useParams();

    // Fetch brand details (including creator info via updated backend)
    const { data: brandData, isLoading: brandLoading } = useGetBrandById(id);
    const brand = brandData?.data;

    // Fetch products belonging to this brand
    const { data: productsData, isLoading: productsLoading } = useGetRetailerProducts({
        brand: id,
        limit: 10
    });
    const products = productsData?.data?.data || [];

    if (brandLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-[#E09A74]" />
            </div>
        );
    }

    if (!brand) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Brand Not Found</h1>
                <p className="text-gray-500">We couldn't find the brand details you're looking for.</p>
            </div>
        );
    }

    return (
        <main className="bg-gray-50 min-h-screen pb-20">
            {/* Header / Hero Section */}
            <div className="bg-white border-b border-gray-100">
                <Container className="py-12 sm:py-16">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12 text-center md:text-left">
                        {/* Logo Container */}
                        <div className="relative w-40 h-40 sm:w-48 sm:h-48 bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 flex items-center justify-center p-8 overflow-hidden transform transition-transform hover:scale-[1.02]">
                            <Image
                                src={getBrandImageUrl(brand.logo)}
                                alt={brand.name}
                                fill
                                className="object-contain p-6"
                                unoptimized
                            />
                        </div>

                        {/* Brand Basics */}
                        <div className="flex-1 space-y-4">
                            <div className="inline-flex px-3 py-1 bg-[#E09A74]/10 text-[#E09A74] text-xs font-bold uppercase tracking-widest rounded-full">
                                Premium Brand
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
                                {brand.name}
                            </h1>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                                {brand.website && (
                                    <a
                                        href={brand.website.startsWith('http') ? brand.website : `https://${brand.website}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#E09A74] transition-colors"
                                    >
                                        <Globe className="w-4 h-4" />
                                        Visit Website
                                    </a>
                                )}
                                <span className="w-1 h-1 bg-gray-300 rounded-full hidden sm:block"></span>
                                <span className="text-sm font-semibold text-gray-500">
                                    {brand.country || 'Global Reach'}
                                </span>
                            </div>
                        </div>
                    </div>
                </Container>
            </div>

            <Container className="mt-12 sm:mt-16">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 sm:gap-16">
                    {/* Left Column: About & Creator */}
                    <div className="lg:col-span-1 space-y-12">
                        {/* About Section */}
                        <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-gray-50 rounded-xl">
                                    <Info className="w-5 h-5 text-gray-400" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">About the Brand</h2>
                            </div>
                            <p className="text-gray-600 leading-relaxed font-medium">
                                {brand.description || "No description provided for this brand. They focus on providing high-quality architectural materials to professionals worldwide."}
                            </p>
                        </section>

                        {/* Creator Section */}
                        {brand.userId && (
                            <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm border-t-4 border-t-[#E09A74]">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-[#E09A74]/10 rounded-xl">
                                        <User className="w-5 h-5 text-[#E09A74]" />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900">Created By</h2>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 font-bold text-xl uppercase overflow-hidden">
                                        {brand.userId.profile ? (
                                             <Image src={brand.userId.profile} alt={brand.userId.name} width={56} height={56} className="object-cover" unoptimized />
                                        ) : (
                                            brand.userId.name?.charAt(0) || 'U'
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{brand.userId.name}</h3>
                                        <p className="text-sm text-gray-500 font-medium">{brand.userId.email}</p>
                                    </div>
                                </div>
                                <div className="mt-6 pt-6 border-t border-gray-50">
                                    <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Arcmat Registered Creator</p>
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Right Column: Products Grid */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 rounded-xl">
                                    <Package className="w-5 h-5 text-gray-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Product Collection</h2>
                            </div>
                            <span className="text-sm font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                {products.length} Items
                            </span>
                        </div>

                        {productsLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="bg-white aspect-[3/4] rounded-2xl animate-pulse border border-gray-100"></div>
                                ))}
                            </div>
                        ) : products.length > 0 ? (
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 sm:gap-8">
                                    {products.map((item) => (
                                        <ProductCard key={item._id || item.productId?._id} product={item} />
                                    ))}
                                </div>
                                
                                {productsData?.data?.pagination?.totalItems > 10 && (
                                    <div className="flex justify-center pt-8">
                                        <Link 
                                            href={`/productlist?brand=${id}`}
                                            className="inline-flex items-center gap-2 px-8 py-4 bg-white border-2 border-[#E09A74] text-[#E09A74] font-bold rounded-2xl hover:bg-[#E09A74] hover:text-white transition-all duration-300 group shadow-lg shadow-[#E09A74]/10"
                                        >
                                            Show all products
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
                                <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-gray-400 mb-1">No products listed yet</h3>
                                <p className="text-sm text-gray-400 max-w-xs mx-auto">This brand hasn't added any materials to their collection on our platform.</p>
                            </div>
                        )}
                    </div>
                </div>
            </Container>
        </main>
    );
};

export default BrandDetailPage;
