import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../services/productService';
import { toast } from '@/components/ui/Toast';

// Keys for cache management
export const PRODUCT_KEYS = {
    all: ['products'],
    lists: () => [...PRODUCT_KEYS.all, 'list'],
    list: (filters) => [...PRODUCT_KEYS.lists(), { ...filters }],
    details: () => [...PRODUCT_KEYS.all, 'detail'],
    detail: (id) => [...PRODUCT_KEYS.details(), id],
    retailer: () => [...PRODUCT_KEYS.all, 'retailer'],
    retailerList: (filters) => [...PRODUCT_KEYS.retailer(), { ...filters }],
};

export const VARIANT_KEYS = {
    all: ['variants'],
    lists: () => [...VARIANT_KEYS.all, 'list'],
    list: (filters) => [...VARIANT_KEYS.lists(), { ...filters }],
};

// Hook to fetch products
export const useGetProducts = ({ userId, brandId, page = 1, limit = 10, enabled = true, onlyRetailerProducts = 'false', ...otherFilters } = {}) => {
    return useQuery({
        queryKey: PRODUCT_KEYS.list({ userId, brandId, page, limit, onlyRetailerProducts, ...otherFilters }),
        queryFn: () => productService.getAllProducts({
            userid: userId,
            user_id: userId,
            brand: brandId, // Map brandId to brand
            page,
            limit,
            offset: (Number(page) - 1) * Number(limit),
            onlyRetailerProducts,
            q: otherFilters.search,
            search: otherFilters.search,
            keyword: otherFilters.search,
            query: otherFilters.search,
            search_term: otherFilters.search,
            ...otherFilters
        }),
        enabled: enabled,
    });
};

// Hook to fetch retailer products
export const useGetRetailerProducts = ({ page = 1, limit = 10, enabled = true, ...otherFilters } = {}) => {
    return useQuery({
        queryKey: PRODUCT_KEYS.retailerList({ page, limit, ...otherFilters }),
        queryFn: () => productService.getRetailerProducts({
            page,
            limit,
            type: 'storefront', // Use storefront type for flattened variant structure
            ...otherFilters
        }),
        enabled: enabled,
    });
};

// Hook to fetch variants (variant-centric)
export const useGetVariants = (filters = {}) => {
    return useQuery({
        queryKey: VARIANT_KEYS.list(filters),
        queryFn: () => productService.getAllVariants({
            onlyRetailerProducts: 'false', // Default to false for common hooks, override in storefront
            ...filters
        }),
        enabled: filters.enabled !== false,
    });
};

// Hook to fetch single product
export const useGetProduct = (id) => {
    return useQuery({
        queryKey: PRODUCT_KEYS.detail(id),
        queryFn: () => productService.getProductById(id),
        enabled: !!id,
        onSuccess(data) {
            return data
        }
    });
};

// Hook to create product
export const useCreateProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: productService.createProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
        },
    });
};

// Hook to update product
export const useUpdateProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => productService.updateProduct(id, data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
            queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.detail(variables.id) });
        },
    });
};

// Hook to delete product
export const useDeleteProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: productService.deleteProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
        },
    });
};

// Hook to bulk import products/variants
export const useBulkImportProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ file, type, productId }) => productService.bulkImport(file, type, productId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
        },
    });
};
