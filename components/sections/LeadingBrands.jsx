"use client";

import React from "react";
import Image from "next/image";
import Link from 'next/link';
import Container from "../ui/Container";
import { useGetBrands } from "@/hooks/useBrand";
import { getBrandImageUrl } from "@/lib/productUtils";

const LeadingBrands = () => {
    const { data: brandsData, isLoading } = useGetBrands({ 
        showOnHomepage: 1, 
        limit: 16,
        type: 'frontend' 
    });

    const brands = brandsData?.data || [];

    return (
        <section className="bg-white py-24 sm:py-32">
            <Container>
                <div className="max-w-4xl mx-auto text-center mb-20">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
                        Leading brands collected in <br className="hidden sm:block" /> a single place.
                    </h2>
                    <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto">
                        Explore hundreds of premium brands and thousands of architectural materials, curated for your next project.
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E09A74]"></div>
                    </div>
                ) : brands.length > 0 ? (
                    <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                        {brands.map((brand, index) => (
                            <Link
                                key={brand._id || index}
                                href={`/brand/${brand._id}`}
                                className="group relative bg-white w-[calc(50%-1rem)] xs:w-40 sm:w-48 aspect-square flex items-center justify-center p-6 rounded-2xl border border-gray-100 hover:border-[#E09A74]/30 hover:shadow-xl hover:shadow-[#E09A74]/5 transition-all duration-500 cursor-pointer overflow-hidden transform hover:-translate-y-1"
                            >
                                {/* Subtle Background Pattern */}
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                
                                {/* Image Container */}
                                <div className="relative w-full h-full">
                                    <Image
                                        src={getBrandImageUrl(brand.logo)}
                                        alt={brand.name}
                                        fill
                                        className="object-contain filter  transition-all duration-700 opacity-80 group-hover:opacity-100 scale-90 group-hover:scale-100"
                                        unoptimized
                                    />
                                </div>

                                {/* Hover Border Indicator */}
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-[#E09A74] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                        <p className="text-gray-400 font-medium italic">Our curated list of premium brands is coming soon.</p>
                        <div className="mt-6 flex justify-center gap-4 opacity-20 filter blur-[1px]">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="w-16 h-16 bg-gray-200 rounded-xl"></div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-20 flex flex-col items-center">
                    <div className="h-px w-24 bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-8"></div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">
                        Empowering architects worldwide
                    </p>
                </div>
            </Container>
        </section>
    );
};

export default LeadingBrands;
