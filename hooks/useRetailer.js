import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { retailerService } from '../services/retailerService';

export const RETAILER_KEYS = {
    all: ['retailer'],
    brands: (retailerId) => [...RETAILER_KEYS.all, 'brands', { retailerId }],
    brandInventory: (brandId, params) => [...RETAILER_KEYS.all, 'brands', brandId, 'inventory', params],
    products: (params) => [...RETAILER_KEYS.all, 'products', params],
    detail: (id) => [...RETAILER_KEYS.all, 'products', 'detail', id],
};

export const useGetRetailerBrands = (retailerId) => {
    return useQuery({
        queryKey: RETAILER_KEYS.brands(retailerId),
        queryFn: () => retailerService.getRetailerBrands(retailerId),
    });
};

export const useUpdateRetailerBrands = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: retailerService.updateRetailerBrands,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: RETAILER_KEYS.all });
        },
    });
};

export const useGetRetailerProducts = (params = {}) => {
    return useQuery({
        queryKey: RETAILER_KEYS.products(params),
        queryFn: () => retailerService.getRetailerProducts(params),
    });
};

export const useGetRetailerProductDetail = (productId) => {
    return useQuery({
        queryKey: RETAILER_KEYS.detail(productId),
        queryFn: () => retailerService.getRetailerProductDetail(productId),
        enabled: !!productId,
    });
};

export const useGetBrandInventory = (brandId, params = {}) => {
    return useQuery({
        queryKey: RETAILER_KEYS.brandInventory(brandId, params),
        queryFn: () => retailerService.getBrandInventory(brandId, params),
        enabled: !!brandId,
    });
};

export const useUpsertProductOverride = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => {
            if (data.id) return retailerService.updateProductOverride(data.id, data);
            return retailerService.upsertProductOverride(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: RETAILER_KEYS.all });
        },
    });
};

export const useDeleteProductOverride = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: retailerService.deleteProductOverride,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: RETAILER_KEYS.all });
        },
    });
};
