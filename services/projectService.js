import api from '@/lib/api';

export const projectService = {
    getAllProjects: async (params) => {
        const response = await api.get('/project', { params });
        return response.data;
    },

    getProjectById: async (id, params) => {
        const response = await api.get(`/project/${id}`, { params });
        return response.data;
    },

    createProject: async (projectData) => {
        const response = await api.post('/project', projectData);
        return response.data;
    },

    updateProject: async (id, projectData) => {
        const response = await api.patch(`/project/${id}`, projectData);
        return response.data;
    },

    deleteProject: async (id) => {
        const response = await api.delete(`/project/${id}`);
        return response.data;
    },

    completeProject: async (id) => {
        const response = await api.post(`/project/${id}/complete`);
        return response.data;
    },

    getProductNotifications: async (id, spaceId) => {
        const response = await api.get(`/project/${id}/space/${spaceId}/notifications`);
        return response.data;
    },

    markNotificationsRead: async (id, spaceId = null, materialId = null, type = null) => {
        const payload = { spaceId, materialId, type };
        const response = await api.post(`/project/${id}/mark-read`, payload);
        return response.data;
    },

    // Dedicated endpoint for retailer chat messages — no projectId required
    markRetailerChatRead: async (retailerId, materialId) => {
        const response = await api.post('/project/mark-retailer-read', { retailerId, materialId });
        return response.data;
    }
};
