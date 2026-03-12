import api from '@/lib/api';

export const retailerRequestService = {
    createRequest: async (projectId, data) => {
        const response = await api.post(`/retailer-request/${projectId}`, data);
        return response.data;
    },

    getMyRequests: async () => {
        const response = await api.get('/retailer-request/mine');
        return response.data;
    },

    getProjectRequests: async (projectId) => {
        const response = await api.get(`/retailer-request/${projectId}`);
        return response.data;
    },

    getAllRequests: async () => {
        const response = await api.get('/retailer-request/all');
        return response.data;
    },

    updateRequest: async (requestId, data) => {
        const response = await api.patch(`/retailer-request/${requestId}`, data);
        return response.data;
    },
    
    getAssignedRequests: async () => {
        const response = await api.get('/retailer-request/assigned');
        return response.data;
    },

    updateStatus: async (requestId, data) => {
        const response = await api.patch(`/retailer-request/${requestId}/status`, data);
        return response.data;
    },
};
