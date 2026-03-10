import api from '@/lib/api';

const analyticsService = {
    getRetailerSelectionAnalytics: async (params = {}) => {
        const response = await api.get('/analytics/retailer-selection', { params });
        return response.data;
    }
};

export default analyticsService;
