import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export const useBrandRetailerAnalytics = (params = {}) => {
    return useQuery({
        queryKey: ['brand-retailer-analytics', params],
        queryFn: async () => {
            const response = await api.get('/analytics/brand/retailer-selection', { params });
            return response.data?.data || response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const useBrandProductAnalytics = (params = {}) => {
    return useQuery({
        queryKey: ['brand-product-analytics', params],
        queryFn: async () => {
            const response = await api.get('/analytics/brand/product-analytics', { params });
            return response.data?.data || response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const useBrandProfessionalInsights = (params = {}) => {
    return useQuery({
        queryKey: ['brand-professional-insights', params],
        queryFn: async () => {
            const response = await api.get('/analytics/brand/professional-insights', { params });
            return response.data?.data || response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};
