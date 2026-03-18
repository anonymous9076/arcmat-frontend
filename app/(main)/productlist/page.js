"use client"
import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import ProductFilterBar from "@/components/sections/ProductFilterBar";
import ProductSidebar from "@/components/sections/ProductSidebar";
import ProductCard from "@/components/cards/ProductCard";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import Image from "next/image";
import { useGetVariants, useGetRetailerProducts } from "@/hooks/useProduct";
import { useGetMoodboard } from "@/hooks/useMoodboard";
import { useGetVendors } from "@/hooks/useVendor";
import { useGetAttributes, useGetAttributesByCategory } from "@/hooks/useAttribute";
import { resolvePricing, formatCurrency } from "@/lib/productUtils";
import { Loader2, ArrowLeft, PackageOpen } from "lucide-react";
import CompareBar from "@/components/ui/CompareBar";
import Pagination from "@/components/ui/Pagination";
import { parseFiltersFromURL, buildURLFromFilters } from "@/lib/urlParamsUtils";
import { useAuth } from '@/hooks/useAuth';
import dynamic from 'next/dynamic';
import { useSelectionStore } from "@/store/useSelectionStore";
import useProjectStore from "@/store/useProjectStore";

const SelectionBar = dynamic(() => import("@/components/dashboard/projects/SelectionBar"), { ssr: false });

const CompareModal = dynamic(() => import("@/components/ui/CompareModal"), {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black/20 animate-pulse" />
});
export default function ProductListPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuth();
    const { clearSelection } = useSelectionStore();
    const { activeProjectId, activeMoodboardId } = useProjectStore();

    const [selectedCategory, setSelectedCategory] = useState("All");
    const [isDrawerOpen, setDrawerOpen] = useState(false);
    const [visibleItems, setVisibleItems] = useState(15);
    const [activeFilters, setActiveFilters] = useState({
        brands: [],
        colors: [],
        cities: [],
        availability: [],
        attributes: {}, // Dynamic attributes
        priceRange: [0, 500000],
        toggles: {
            commercial: false,
            residential: false,
            allColorways: false
        }
    });

    const [isInitialized, setIsInitialized] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);

    const { data: apiData, isLoading } = useGetRetailerProducts({
        type: 'storefront',
        page: currentPage,
        limit: pageSize,
        categoryId: selectedCategory !== "All" ? selectedCategory : undefined,
        brand: activeFilters.brands.join(','),
        color: activeFilters.colors.join(','),
        min_price: activeFilters.priceRange[0],
        max_price: activeFilters.priceRange[1],
        // Spread dynamic attributes with attr_ prefix
        ...Object.entries(activeFilters.attributes || {}).reduce((acc, [key, values]) => {
            if (values && values.length > 0) {
                acc[`attr_${key}`] = values.join(',');
            }
            return acc;
        }, {}),
        enabled: isInitialized
    });

    // OPTIMIZATION: Fetch active moodboard at page level to avoid N+1 fetches in ProductCard
    const { data: moodboardData } = useGetMoodboard(activeMoodboardId, { enabled: !!activeMoodboardId });
    const addedProductIdsMap = useMemo(() => {
        const prodIds = moodboardData?.data?.estimatedCostId?.productIds || [];
        return new Set(prodIds.map(p => {
            const id = typeof p === 'object' && p !== null ? (p.productId?._id || p._id) : p;
            return String(id);
        }));
    }, [moodboardData]);

    const { data: brandsData } = useGetVendors({ type: 'frontend' });
    const { data: globalAttributesData } = useGetAttributes();
    const { data: categoryAttributesData } = useGetAttributesByCategory(selectedCategory);

    const brands = Array.isArray(brandsData) ? brandsData : (brandsData?.data || []);

    const products = apiData?.data?.data || apiData?.data || [];
    const paginationData = apiData?.data?.pagination || apiData?.pagination || apiData?.data?.pagination;
    const metadata = apiData?.data?.metadata || apiData?.metadata;

    const { minPrice, maxPrice, priceStep } = useMemo(() => {
        if (metadata) {
            return {
                minPrice: metadata.minPrice,
                maxPrice: metadata.maxPrice,
                priceStep: 100
            };
        }
        if (!products.length) return { minPrice: 0, maxPrice: 100000, priceStep: 1000 };
        const prices = products.map(p => resolvePricing(p).price).filter(p => p > 0);
        const min = Math.floor(Math.min(...prices) / 100) * 100;
        const max = Math.ceil(Math.max(...prices) / 100) * 100;
        return { minPrice: min, maxPrice: max, priceStep: 100 };
    }, [products, metadata]);
    Vinc:

    useEffect(() => {
        const parsed = parseFiltersFromURL(searchParams);
        setSelectedCategory(parsed.category);
        setActiveFilters(parsed.filters);
        setIsInitialized(true);
    }, [searchParams]);

    // Clear selection when project context changes or on unmount
    useEffect(() => {
        return () => clearSelection();
    }, [activeProjectId, activeMoodboardId, clearSelection]);

    useEffect(() => {
        if (products.length && activeFilters.priceRange[1] === 500000 && isInitialized) {
            setActiveFilters(prev => ({ ...prev, priceRange: [minPrice, maxPrice] }));
        }
    }, [products, minPrice, maxPrice, isInitialized]);

    const updateURL = (newCategory, newFilters) => {
        if (!isInitialized) return;

        const params = buildURLFromFilters(newCategory, newFilters);
        const newUrl = params ? `${pathname}?${params}` : pathname;
        router.push(newUrl, { scroll: false });
    };

    const handleCategoryChange = (categoryId) => {
        setSelectedCategory(categoryId);
        setCurrentPage(1);
        updateURL(categoryId, activeFilters);
    };
    const handleFiltersChange = (newFiltersOrCallback) => {
        const newFilters = typeof newFiltersOrCallback === 'function'
            ? newFiltersOrCallback(activeFilters)
            : newFiltersOrCallback;

        setActiveFilters(newFilters);
        setCurrentPage(1);
        updateURL(selectedCategory, newFilters);
    };

    const filteredAndSortedProducts = products;
    const displayedProducts = products;

    const categoryCounts = useMemo(() => {
        if (apiData?.data?.categoryCounts) {
            return apiData.data.categoryCounts;
        }
        if (apiData?.categoryCounts) {
            return apiData.categoryCounts;
        }

        const counts = { All: paginationData?.totalItems || 0 };
        return counts;
    }, [apiData, paginationData]);

    const availableColors = useMemo(() => {
        if (metadata?.availableColors) return metadata.availableColors;
        const colors = new Set();
        products.forEach(variant => {
            if (variant.color) colors.add(variant.color);
        });
        return Array.from(colors).sort();
    }, [products, metadata]);

    const availableAttributes = useMemo(() => {
        const metadataAttrs = metadata?.availableAttributes || [];
        const globalAttrs = (globalAttributesData?.data || []).map(attr => ({
            key: attr.attributeName,
            values: attr.attributeValues || []
        }));
        const categoryAttrs = (categoryAttributesData?.data || []).map(attr => ({
            key: attr.attributeName,
            values: attr.attributeValues || []
        }));

        // Merge logic: Base is global attributes (as requested to "show all values")
        // and optionally refine with category attributes if they are different or specific
        const combinedMap = new Map();

        globalAttrs.forEach(a => combinedMap.set(a.key, new Set(a.values)));
        categoryAttrs.forEach(a => {
            if (combinedMap.has(a.key)) {
                a.values.forEach(v => combinedMap.get(a.key).add(v));
            } else {
                combinedMap.set(a.key, new Set(a.values));
            }
        });
        metadataAttrs.forEach(a => {
            if (combinedMap.has(a.key)) {
                a.values.forEach(v => combinedMap.get(a.key).add(v));
            } else {
                combinedMap.set(a.key, new Set(a.values));
            }
        });

        return Array.from(combinedMap.entries()).map(([key, values]) => ({
            key,
            values: Array.from(values).sort()
        }));
    }, [metadata, globalAttributesData, categoryAttributesData]);

    return (
        <div className="min-h-screen">
            <div className="sticky top-16 z-40">
                <ProductFilterBar
                    selectedCategory={selectedCategory}
                    setSelectedCategory={handleCategoryChange}
                    onOpenFilters={() => setDrawerOpen(true)}
                    categoryCounts={categoryCounts}
                />
            </div>

            <Container className="flex gap-4 lg:gap-8 py-6">
                <div className="hidden lg:block w-72 shrink-0 h-[calc(100vh-200px)] sticky top-48 overflow-y-auto no-scrollbar pb-10">
                    <ProductSidebar
                        activeFilters={activeFilters}
                        setActiveFilters={handleFiltersChange}
                        brands={brands}
                        availableColors={availableColors}
                        availableAttributes={availableAttributes}
                        minPrice={minPrice}
                        maxPrice={maxPrice}
                        priceStep={priceStep}
                    />
                </div>

                <main className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">All Products</h1>
                            <p className="text-sm text-gray-500 font-medium">Browse our latest collection.</p>
                        </div>
                        <div className="flex items-center gap-3">
                        </div>
                    </div>

                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-400 hover:text-[#e09a74] transition-colors mb-6 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-bold uppercase tracking-widest">Back</span>
                    </button>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 text-[#e09a74] animate-spin mb-4" />
                            <p className="text-gray-500 font-medium">Loading products...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4  gap-x-4 gap-y-8">
                            {displayedProducts.map((product, i) => {
                                const productId = String(product?._id || product?.id);
                                return (
                                    <ProductCard 
                                        key={product._id || product.id || i} 
                                        product={product} 
                                        isAlreadyAdded={addedProductIdsMap.has(productId)}
                                    />
                                );
                            })}
                        </div>
                    )}

                    {paginationData?.totalItems > 0 && (
                        <div className="mt-12 mb-8">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={paginationData?.totalPages || 1}
                                pageSize={pageSize}
                                totalItems={paginationData?.totalItems || 0}
                                onPageChange={(page) => {
                                    setCurrentPage(page);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                onPageSizeChange={(size) => {
                                    setPageSize(size);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                    )}

                    {filteredAndSortedProducts.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                            <p className="text-xl font-medium text-gray-500">No Products Found</p>
                        </div>
                    )}
                </main>
            </Container>

            <div
                className={`fixed inset-0 z-100 transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            >
                <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={() => setDrawerOpen(false)}
                />
                <div
                    className={`absolute right-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-2xl transition-transform duration-300 transform ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-bold">Filters</h2>
                            <Button
                                onClick={() => setDrawerOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <Image src="Icons/icons8-close.svg" alt="Close" width="20" height="20" />
                            </Button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-4 py-2">
                            <ProductSidebar
                                activeFilters={activeFilters}
                                setActiveFilters={handleFiltersChange}
                                brands={brands}
                                availableColors={availableColors}
                                availableAttributes={availableAttributes}
                                minPrice={minPrice}
                                maxPrice={maxPrice}
                                priceStep={priceStep}
                            />
                        </div>
                        <div className="p-4 border-t">
                            <Button
                                text="Show Results"
                                onClick={() => setDrawerOpen(false)}
                                className="w-full py-3 bg-[#e09a74] hover:bg-white hover:text-[#e09a74] hover:border-[#e09a74] border text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform"
                            >
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <CompareBar />
            <CompareModal />
            {user?.role === 'architect' && <SelectionBar />}
        </div>
    );
}
