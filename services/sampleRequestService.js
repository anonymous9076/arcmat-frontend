import api from '@/lib/api';

export const sampleRequestService = {
    createRequest: async (projectId, data) => {
        const response = await api.post(`/sample-request/${projectId}`, data);
        return response.data;
    },

    getProjectRequests: async (projectId) => {
        const response = await api.get(`/sample-request/${projectId}`);
        return response.data;
    },

    getMyRequests: async () => {
        const response = await api.get('/sample-request/mine');
        return response.data;
    },

    updateStatus: async (requestId, data) => {
        const response = await api.patch(`/sample-request/${requestId}/status`, data);
        return response.data;
    },

    deleteRequest: async (requestId) => {
        const response = await api.delete(`/sample-request/active/${requestId}`);
        return response.data;
    },

    updateRequest: async (requestId, data) => {
        const response = await api.patch(`/sample-request/active/${requestId}`, data);
        return response.data;
    },
};
