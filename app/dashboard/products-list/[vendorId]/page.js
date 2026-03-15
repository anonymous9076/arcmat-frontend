'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Upload, Download, Package } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import useAuthStore from '@/store/useAuthStore';
import { useProductStore } from '@/store/useProductStore';
import { useGetProducts } from '@/hooks/useProduct';
import { useUIStore } from '@/store/useUIStore';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { productService } from '@/services/productService';
import { useLoader } from '@/context/LoaderContext';


// Components
import ProductGrid from '@/components/products/ProductGrid';
import ProductFilters from '@/components/products/ProductFilters';
import VendorProductTable from '@/components/vendor/VendorProductTable';
import BulkActionsBar from '@/components/vendor/BulkActionsBar';
import AttributeCompletionBanner from '@/components/vendor/AttributeCompletionBanner';
import Pagination from '@/components/ui/Pagination';

// Modals
import ProductFormModal from '@/components/vendor/ProductFormModal';
import BulkUploadModal from '@/components/vendor/BulkUploadModal';
import RoleGuard from '@/components/auth/RoleGuard';

import ConfirmActivateModal from '@/components/vendor/ConfirmActivateModal';

// Product List Page
export default function ProductsListPage() {
  const { user, loading: authLoading } = useAuth();
  const { activeBrand } = useAuthStore();
  const { vendorId } = useParams();
  const { getPublicProducts } = useProductStore();
  const { openProductFormModal, openBulkUploadModal } = useUIStore();
  const { setLoading: setGlobalLoading } = useLoader();
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orderBy, setOrderBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [isExporting, setIsExporting] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);

  // Use vendorId from URL if available, otherwise fallback to activeBrand ID, then user ID
  const effectiveVendorId = vendorId || activeBrand?._id || user?.brandId || user?._id || user?.id;

  const isViewingByBrand = !!(vendorId || activeBrand?._id || user?.brandId);

  const { data: apiResponse, isLoading: productsLoading } = useGetProducts({
    userId: !isViewingByBrand ? effectiveVendorId : undefined,
    brandId: isViewingByBrand ? effectiveVendorId : undefined,
    page: currentPage,
    limit: pageSize,
    search: searchTerm,
    status: statusFilter,
    orderby: orderBy,
    order: sortOrder,
    enabled: !!effectiveVendorId && !authLoading
  });

  const apiProducts = apiResponse?.data?.data || apiResponse?.data || apiResponse?.products || [];
  const paginationData = apiResponse?.data?.pagination
  const isLoading = authLoading || productsLoading;

  const handleActivateAll = async () => {

    setIsActivating(true);
    try {
      const response = await productService.bulkActivateProducts(effectiveVendorId);

      toast.success(
        `Successfully activated ${response.data.productsActivated} products and ${response.data.variantsActivated} variants!`
      );
      setShowActivateModal(false);
      // Refresh the page to show updated statuses
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to activate products');
    } finally {
      setIsActivating(false);
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
      setGlobalLoading(false);
    }
  };

  const handleExport = async (format = 'xlsx') => {
    if (!effectiveVendorId) return;
    setIsExporting(true);
    try {
      // Fetch ALL products matching current filters for export
      const response = await productService.getAllProducts({
        userid: !isViewingByBrand ? effectiveVendorId : undefined,
        brand: isViewingByBrand ? effectiveVendorId : undefined,
        page: 1,
        limit: 10000, // Fetch up to 10k items for export
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

      // Format data for Export (One row per variant)
      const exportData = [];

      productsToExport.forEach(p => {
        const baseProductInfo = {
          'Product Name': p.product_name || '',
          'Base SKU Code': p.skucode || '',
          'Product URL': p.product_url || '',
          'Category (L1)': p.categoryId?.name || '',
          'Sub Category (L2)': p.subcategoryId?.name || '',
          'Sub-Sub Category (L3)': p.subsubcategoryId?.name || '',
          'Brand': p.brand?.name || p.brand || '',
          'Images': (p.product_images || []).join(', '),
          'Description': p.description || '',
          'Meta Title': p.meta_title || '',
          'Meta Keywords': p.meta_keywords || '',
          'Meta Description': p.meta_description || '',
          'Product Status': p.status === 1 ? 'Active' : 'Inactive',
          'Created At': p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '',
        };

        if (p.variants && p.variants.length > 0) {
          p.variants.forEach(v => {
            // Calculate Attributes string from dynamicAttributes
            const attributesStr = (v.dynamicAttributes || [])
              .map(attr => `${attr.key}: ${attr.value}`)
              .join(', ');

            exportData.push({
              ...baseProductInfo,
              'Variant SKU Code': v.skucode || '',
              'Variant Status': v.status === 1 ? 'Active' : 'Inactive',
              'MRP Price': v.mrp_price || 0,
              'Selling Price': v.selling_price || 0,
              'Stock': v.stock || 0,
              'Weight': v.weight || 0,
              'Weight Type': v.weight_type || '',
              'Attributes': attributesStr,
              'Variant Images': (v.variant_images || []).join(', ')
            });
          });
        } else {
          // Fallback if no variants are found
          exportData.push({
            ...baseProductInfo,
            'Variant SKU Code': 'N/A',
            'Variant Status': 'N/A',
            'MRP Price': 0,
            'Selling Price': 0,
            'Stock': 0,
            'Weight': 0,
            'Weight Type': '',
            'Attributes': '',
            'Variant Images': ''
          });
        }
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, "Products");

      const ext = format === 'csv' ? 'csv' : 'xlsx';
      XLSX.writeFile(wb, `Products_Export_${new Date().toISOString().split('T')[0]}.${ext}`);

      toast.success(`Successfully exported ${productsToExport.length} products as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error("Failed to export products");
    } finally {
      setIsExporting(false);
      setGlobalLoading(false); // Ensure global loader is cleared
    }
  };


  if (authLoading) return <div className="p-6">Loading...</div>;

  const isAdmin = user?.role === 'admin';
  const isBrand = user?.role === 'brand';
  const showManagementUI = isAdmin || isBrand;

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

  return (
    <RoleGuard allowedRoles={['admin', 'brand']}>
      <Container className="py-6 space-y-6">

        {/* Invisible Modals */}
        <ProductFormModal />
        <BulkUploadModal />
        <ConfirmActivateModal
          isOpen={showActivateModal}
          onClose={() => setShowActivateModal(false)}
          onConfirm={handleActivateAll}
          isLoading={isActivating}
        />

        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {isBrand ? 'My Inventory' : 'All Products'}
            </h1>
            <p className="text-gray-500 text-sm">
              {isBrand
                ? 'Manage your prices, stock, and listings.'
                : 'Browse our latest collection.'}
            </p>
          </div>

          {/* ACTIONS - Only show when viewing specific vendor's products */}
          {vendorId && (
            <div className="flex flex-wrap items-center gap-3">
              {isAdmin && (
                <button
                  onClick={() => setShowActivateModal(true)}
                  disabled={isActivating}
                  className="flex items-center px-5 py-2.5 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md transition-all h-[42px]"
                  title="Activate all products and variants"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Activate All
                </button>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Button
                  onClick={handleDataExport}
                  disabled={isExporting}
                  className="rounded-full bg-white text-blue-600 hover:bg-blue-50 min-w-[130px] h-[42px] px-6 border border-blue-600 shadow-sm transition-all duration-300 font-semibold flex items-center"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
                {!isAdmin && (
                  <>
                    <Button
                      onClick={() => openBulkUploadModal()}
                      className="flex items-center rounded-full bg-white text-[#e09a74] hover:bg-orange-50 min-w-[130px] h-[42px] px-6 border border-[#e09a74] shadow-sm transition-all duration-300 font-semibold"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Bulk Import
                    </Button>
                    <button
                      onClick={() => {
                        setGlobalLoading(true);
                        router.push(`/dashboard/products-list/${effectiveVendorId}/add`);
                      }}
                      className="flex items-center rounded-full bg-[#e09a74] text-white min-w-[130px] h-[42px] px-6 border border-[#e09a74] hover:bg-[#d08963] text-nowrap shadow-md transition-all duration-300 font-semibold"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* CONDITIONAL CONTENT */}
        {showManagementUI ? (
          <div className="space-y-6">
            {isBrand && <AttributeCompletionBanner />}

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-5 items-stretch lg:items-center justify-between">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <div className="relative flex-1 md:max-w-md group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#e09a74] w-5 h-5 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search by name, SKU or description..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-[#e09a74] focus:ring-4 focus:ring-orange-50 transition-all text-sm"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Status</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                      className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-[#e09a74] text-sm font-medium transition-all"
                    >
                      <option value="all">All Status</option>
                      <option value="1">Active</option>
                      <option value="0">Inactive</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sort</span>
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                      <select
                        value={orderBy}
                        onChange={(e) => { setOrderBy(e.target.value); setCurrentPage(1); }}
                        className="pl-4 pr-2 py-2.5 bg-transparent outline-none focus:text-[#e09a74] text-sm font-medium transition-all"
                      >
                        <option value="createdAt">Date</option>
                        <option value="product_name">Name</option>
                        <option value="skucode">SKU</option>
                      </select>
                      <div className="w-px h-6 bg-gray-200"></div>
                      <select
                        value={sortOrder}
                        onChange={(e) => { setSortOrder(e.target.value); setCurrentPage(1); }}
                        className="pl-2 pr-4 py-2.5 bg-transparent outline-none focus:text-[#e09a74] text-sm font-medium transition-all"
                      >
                        <option value="DESC">Newest</option>
                        <option value="ASC">Oldest</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center px-4 py-2 bg-orange-50/50 rounded-xl border border-orange-100">
                <span className="text-xs font-semibold text-[#e09a74]">
                  {paginationData?.totalItems || 0} total products found
                </span>
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
    </RoleGuard>
  );
}
