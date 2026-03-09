import api from '@/lib/api';

const supportService = {
    createQuery: async (data) => {
        const response = await api.post('/help', data);
        return response.data;
    },

    getQueries: async () => {
        const response = await api.get('/help');
        return response.data;
    },

    updateQueryStatus: async (queryId, data) => {
        const response = await api.patch(`/help/${queryId}/status`, data);
        return response.data;
    },

    deleteQuery: async (queryId) => {
        const response = await api.delete(`/help/${queryId}`);
        return response.data;
    }
};

export default supportService;
