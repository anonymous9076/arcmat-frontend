'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Upload, Download, Package, Activity, TrendingUp, Clock, ArrowUpRight } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useProductStore } from '@/store/useProductStore';
import { useGetProducts } from '@/hooks/useProduct';
import { useGetBrands } from '@/hooks/useBrand';
import { useUIStore } from '@/store/useUIStore';
import { useLoader } from '@/context/LoaderContext';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { productService } from '@/services/productService';
import { getProductImageUrl } from '@/lib/productUtils';

import ProductGrid from '@/components/products/ProductGrid';
import ProductFilters from '@/components/products/ProductFilters';
import VendorProductTable from '@/components/vendor/VendorProductTable';
import BulkActionsBar from '@/components/vendor/BulkActionsBar';
import AttributeCompletionBanner from '@/components/vendor/AttributeCompletionBanner';
import Pagination from '@/components/ui/Pagination';

import ProductFormModal from '@/components/vendor/ProductFormModal';
import BulkUploadModal from '@/components/vendor/BulkUploadModal';

export default function ProductsListPage() {
    const { user, loading: authLoading } = useAuth();
    const params = useParams();
    const vendorIdFromRoute = params?.vendorId;
    const { getPublicProducts } = useProductStore();
    const { openProductFormModal, openBulkUploadModal } = useUIStore();
    const { setLoading } = useLoader();

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [orderBy, setOrderBy] = useState('updatedAt');
    const [sortOrder, setSortOrder] = useState('DESC');
    const [isExporting, setIsExporting] = useState(false);

    const isAdmin = user?.role === 'admin';
    const isBrand = user?.role === 'brand';

    const effectiveBrandId = vendorIdFromRoute || (isBrand ? (user?._id || user?.id) : undefined);

    const { data: apiResponse, isLoading: productsLoading } = useGetProducts({
        userId: isBrand ? effectiveBrandId : undefined,
        brandId: isAdmin && vendorIdFromRoute ? vendorIdFromRoute : undefined,
        page: currentPage,
        limit: pageSize,
        search: searchTerm,
        status: statusFilter,
        orderby: orderBy,
        order: sortOrder,
        enabled: !authLoading && !!effectiveBrandId
    });

    const { data: brandsResponse, isLoading: brandsLoading } = useGetBrands({
        enabled: !authLoading && isAdmin && !vendorIdFromRoute
    });

    const brands = brandsResponse?.data?.data || brandsResponse?.data || [];
    const brandsPagination = brandsResponse?.data?.pagination;

    const apiProducts = apiResponse?.data?.data || apiResponse?.data || apiResponse?.products || [];
    const paginationData = apiResponse?.data?.pagination

    const isLoading = authLoading || productsLoading;

    const handleExport = async (format = 'xlsx') => {
        setIsExporting(true);
        try {
            const response = await productService.getAllProducts({
                userid: effectiveBrandId,
                page: 1,
                limit: 10000,
                search: searchTerm,
                status: statusFilter,
                orderby: orderBy,
                order: sortOrder,
            });

            const productsToExport = response?.data?.data || response?.data || response?.products || [];

            if (productsToExport.length === 0) {
                toast.error("No products to export");
                return;
            }

            const exportData = productsToExport.map(p => {
                const minPrice = p.minPrice || (p.variants?.length ? Math.min(...p.variants.map(v => v.selling_price || 0)) : 0);
                const maxPrice = p.maxPrice || (p.variants?.length ? Math.max(...p.variants.map(v => v.selling_price || 0)) : 0);
                const totalStock = p.totalStock || (p.variants?.length ? p.variants.reduce((sum, v) => sum + (v.stock || 0), 0) : 0);

                return {
                    'Product Name': p.product_name,
                    'SKU Code': p.skucode || '',
                    'Brand': p.userid?.name || 'N/A',
                    'Price Range': minPrice === maxPrice ? minPrice : `${minPrice} - ${maxPrice}`,
                    'Total Stock': totalStock,
                    'Status': p.status === 1 ? 'Active' : 'Inactive',
                    'Created At': p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '',
                };
            });

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);
            XLSX.utils.book_append_sheet(wb, ws, "Products");

            const ext = format === 'csv' ? 'csv' : 'xlsx';
            XLSX.writeFile(wb, `Products_Export_${new Date().toISOString().split('T')[0]}.${ext}`);

            toast.success(`Successfully exported ${productsToExport.length} products`);
        } catch (error) {
            toast.error("Failed to export products");
        } finally {
            setIsExporting(false);
        }
    };

    const handleDataExport = async () => {
        setIsExporting(true);
        try {
            const blob = await productService.exportProductData(effectiveVendorId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `product_data_export_${new Date().toISOString().split('T')[0]}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success("Product data exported successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to export product data");
        } finally {
            setIsExporting(false);
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePageSizeChange = (size) => {
        setPageSize(size);
        setCurrentPage(1);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const showManagementUI = isBrand || isAdmin;
    const router = require('next/navigation').useRouter();

    require('react').useEffect(() => {
        if (!authLoading && isBrand && user?._id && !vendorIdFromRoute) {
            router.replace(`/dashboard/products-list/${user._id}`);
        }
    }, [authLoading, isBrand, user, vendorIdFromRoute, router]);

    if (isBrand && !vendorIdFromRoute) {
        return null;
    }

    const showBrandList = isAdmin && !vendorIdFromRoute;

    // Analytics for Header
    const globalStats = brands.reduce((acc, b) => ({
        totalProducts: acc.totalProducts + (b.productCount || 0),
        newProducts: acc.newProducts + (b.newCount || 0),
        updatedProducts: acc.updatedProducts + (b.updatedCount || 0)
    }), { totalProducts: 0, newProducts: 0, updatedProducts: 0 });

    return (
        <Container className="py-6 space-y-8">
            <ProductFormModal />
            <BulkUploadModal />

            <div className="flex flex-col gap-8">
                {/* HEADER & GLOBAL STATS */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-1 border-l-4 border-[#e09a74] pl-6 py-2">
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            {showBrandList ? 'Product Ecosystem' : (isAdmin ? 'Brand Inventory' : isBrand ? 'My Inventory' : 'All Products')}
                        </h1>
                        <p className="text-gray-500 text-sm mt-2 max-w-md leading-relaxed">
                            {showBrandList
                                ? 'A panoramic view of all registered brands and their real-time inventory dynamics.'
                                : isAdmin
                                    ? 'Detailed management interface for the selected brand lifecycle.'
                                    : isBrand
                                        ? 'Your central command for pricing, stock, and digital assets.'
                                        : 'Architectural collection of premium materials.'}
                        </p>
                    </div>

                    {showBrandList && (
                        <div className="xl:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="bg-white/50 backdrop-blur-sm border border-gray-100 p-5 rounded-2xl shadow-sm flex items-center gap-4 group hover:border-[#e09a74]/30 transition-all">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                                    <Package className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Global Assets</p>
                                    <p className="text-2xl font-black text-gray-900">{globalStats.totalProducts}</p>
                                </div>
                            </div>
                            <div className="bg-white/50 backdrop-blur-sm border border-gray-100 p-5 rounded-2xl shadow-sm flex items-center gap-4 group hover:border-green-300 transition-all">
                                <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:scale-110 transition-transform">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">New Items</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-2xl font-black text-gray-900">{globalStats.newProducts}</p>
                                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">7d</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/50 backdrop-blur-sm border border-orange-100 p-5 rounded-2xl shadow-sm flex items-center gap-4 group hover:border-orange-300 transition-all col-span-2 md:col-span-1">
                                <div className="p-3 bg-orange-50 text-[#e09a74] rounded-xl group-hover:scale-110 transition-transform">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Activity</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-2xl font-black text-gray-900">{globalStats.updatedProducts}</p>
                                        <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-bold">7d</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {!showBrandList && showManagementUI && (
                    <div className="flex justify-end gap-3">
                        {isBrand && (
                            <>
                                <Button
                                    onClick={handleDataExport}
                                    disabled={isExporting}
                                    className="flex items-center rounded-full bg-white text-blue-600 cursor-pointer hover:bg-gray-50 min-w-[120px] py-2 px-4 border border-blue-600 duration-300 ml-2"
                                >
                                    <Package className="w-4 h-4 mr-2" />
                                    Export Data
                                </Button>
                                <Button
                                    onClick={() => openBulkUploadModal()}
                                    className="flex items-center rounded-full bg-white text-[#e09a74] cursor-pointer hover:bg-gray-50 min-w-[120px] py-2 px-4 border border-[#e09a74] duration-300"
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Bulk Import
                                </Button>
                                <button
                                    onClick={() => {
                                        setLoading(true);
                                        router.push(`/dashboard/products-list/${effectiveVendorId}/add`);
                                    }}
                                    className="flex items-center rounded-full bg-[#e09a74] text-white cursor-pointer min-w-[120px] py-2 px-4 border border-[#e09a74] hover:bg-white hover:text-[#e09a74] duration-300"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Product
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {showBrandList ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {brandsLoading ? (
                        [...Array(8)].map((_, i) => (
                            <div key={i} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm animate-pulse h-64"></div>
                        ))
                    ) : brands.length > 0 ? (
                        brands.map((brand) => (
                            <button
                                key={brand._id || brand.id}
                                onClick={() => {
                                    setLoading(true);
                                    router.push(`/dashboard/products-list/${brand._id || brand.id}`);
                                }}
                                className="group bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm hover:shadow-2xl hover:border-[#e09a74]/40 transition-all duration-500 relative overflow-hidden flex flex-col items-center text-center"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-[#e09a74]/5 to-transparent rounded-bl-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>

                                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                                    <div className="bg-[#e09a74] text-white p-2 rounded-full shadow-lg">
                                        <ArrowUpRight className="w-4 h-4" />
                                    </div>
                                </div>

                                <div className="w-28 h-28 rounded-3xl bg-gray-50 border border-gray-100 p-4 mb-6 flex items-center justify-center group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-500 shadow-inner overflow-hidden relative">
                                    {brand.logo ? (
                                        <img
                                            src={typeof brand.logo === 'string' ? brand.logo : (brand.logo.url || brand.logo.secure_url)}
                                            alt={brand.name}
                                            className="w-full h-full object-contain"
                                            onError={(e) => { e.target.src = '/Images/placeholder-logo.png'; }}
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-[#e09a74]/10 flex items-center justify-center text-[#e09a74] font-black text-3xl">
                                            {brand.name?.charAt(0)}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4 w-full">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#e09a74] transition-colors line-clamp-1">{brand.name}</h3>
                                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 mt-1">Certified Provider</p>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-center gap-2 py-2 px-4 bg-gray-50 rounded-2xl border border-gray-100 group-hover:bg-[#e09a74]/5 group-hover:border-[#e09a74]/10 transition-colors">
                                            <Package className="w-4 h-4 text-[#e09a74]" />
                                            <span className="text-sm font-bold text-gray-700">{brand.productCount || 0}</span>
                                            <span className="text-[10px] text-gray-400 font-medium">Collections</span>
                                        </div>

                                        <div className="flex items-center gap-2 justify-center">
                                            {brand.newCount > 0 && (
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-full border border-green-100">
                                                    <Plus className="w-3 h-3" />
                                                    {brand.newCount} New
                                                </div>
                                            )}
                                            {brand.updatedCount > 0 && (
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-orange-700 text-[10px] font-bold rounded-full border border-orange-100">
                                                    <Clock className="w-3 h-3" />
                                                    {brand.updatedCount} Repriced
                                                </div>
                                            )}
                                            {!(brand.newCount > 0 || brand.updatedCount > 0) && (
                                                <div className="px-2.5 py-1 text-gray-400 text-[10px] font-semibold italic">
                                                    No recent updates
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="col-span-full py-24 text-center bg-white/50 backdrop-blur-sm rounded-[3rem] border border-dashed border-gray-200">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                <Package className="w-10 h-10 text-gray-300" />
                            </div>
                            <p className="text-gray-500 font-medium">Orchestrate your first brand alliance</p>
                            <p className="text-gray-400 text-sm mt-1">Data-driven insights for administrators</p>
                        </div>
                    )}
                </div>
            ) : showManagementUI ? (
                <div className="space-y-4">
                    {isBrand && <AttributeCompletionBanner />}

                    {isAdmin && (
                        <Link
                            href="/dashboard/products-list"
                            className="inline-flex items-center text-sm text-[#e09a74] hover:underline mb-2 group"
                        >
                            <span className="mr-1 group-hover:-translate-x-1 transition-transform">←</span>
                            Back to Brand List
                        </Link>
                    )}

                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex flex-col w-full lg:flex-row gap-4 items-center flex-1">
                            <div className="relative w-full lg:max-w-xs">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search by name or SKU..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#e09a74] transition-colors"
                                />
                            </div>

                            <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 w-full'>

                                <select
                                    value={statusFilter}
                                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                                    className="px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#e09a74] bg-white text-sm"
                                >
                                    <option value="all">All Status</option>
                                    <option value="1">Active Only</option>
                                    <option value="0">Inactive Only</option>
                                </select>

                                <select
                                    value={orderBy}
                                    onChange={(e) => { setOrderBy(e.target.value); setCurrentPage(1); }}
                                    className="px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#e09a74] bg-white text-sm"
                                >
                                    <option value="updatedAt">Latest Updated</option>
                                    <option value="createdAt">Date Created</option>
                                    <option value="product_name">Product Name</option>
                                </select>

                                <select
                                    value={sortOrder}
                                    onChange={(e) => { setSortOrder(e.target.value); setCurrentPage(1); }}
                                    className="px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#e09a74] bg-white text-sm"
                                >
                                    <option value="DESC">Descending</option>
                                    <option value="ASC">Ascending</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Total: {paginationData?.totalItems || 0} products</span>
                        </div>
                    </div>

                    {isBrand && <BulkActionsBar products={apiProducts} />}

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <VendorProductTable products={apiProducts} />

                        {(paginationData?.totalItems) > 0 && (
                            <Pagination
                                currentPage={paginationData?.currentPage || 1}
                                totalPages={paginationData?.totalPages || 1}
                                pageSize={paginationData?.pageSize || 10}
                                totalItems={paginationData?.totalItems || 0}
                                onPageChange={handlePageChange}
                                onPageSizeChange={handlePageSizeChange}
                            />
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <ProductFilters />
                    <ProductGrid products={getPublicProducts()} />
                </div>
            )}
        </Container>
    );
}
