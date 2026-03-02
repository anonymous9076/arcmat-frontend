import api from '@/lib/api';

export const estimatedCostService = {
    createEstimatedCost: async (data) => {
        const response = await api.post('/estimated-cost', data);
        return response.data;
    },

    updateEstimatedCost: async (id, data) => {
        const response = await api.patch(`/estimated-cost/${id}`, data);
        return response.data;
    },

    deleteEstimatedCost: async (id) => {
        const response = await api.delete(`/estimated-cost/${id}`);
        return response.data;
    }
};
