import { useQuery } from '@tanstack/react-query';
import analyticsService from '@/services/analyticsService';

export const useRetailerSelectionAnalytics = (params = {}) => {
    return useQuery({
        queryKey: ['retailer-selection-analytics', params],
        queryFn: async () => {
            const response = await analyticsService.getRetailerSelectionAnalytics(params);
            return response.data || response;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};
