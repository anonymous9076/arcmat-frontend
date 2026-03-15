import api from '@/lib/api';

export const attributeService = {
    // Get all attributes
    getAllAttributes: async () => {
        const response = await api.get('/attribute');
        return response.data;
    },
    // Create new attribute
    createAttribute: async (attributeData) => {
        const response = await api.post('/attribute', attributeData);
        return response.data;
    },
    // Update existing attribute
    updateAttribute: async ({ id, data }) => {
        const response = await api.patch(`/attribute/${id}`, data);
        return response.data;
    },
    // Delete attribute
    deleteAttribute: async (id) => {
        const response = await api.delete(`/attribute/${id}`);
        return response.data;
    },
    // Get attributes by category ID
    getAttributesByCategoryId: async (categoryId) => {
        const response = await api.get(`/attribute/listbycategoryid/${categoryId}`);
        return response.data;
    },
};
