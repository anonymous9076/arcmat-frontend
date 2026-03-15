import api from '@/lib/api';

export const projectTemplateService = {
    createTemplateFromProject: async (projectId) => {
        const response = await api.post(`/project-templates/create-from-project/${projectId}`);
        return response.data;
    },

    getTemplates: async () => {
        const response = await api.get('/project-templates');
        return response.data;
    },

    useTemplate: async (templateId, data) => {
        const response = await api.post(`/project-templates/use/${templateId}`, data);
        return response.data;
    },

    deleteTemplate: async (templateId) => {
        const response = await api.delete(`/project-templates/${templateId}`);
        return response.data;
    },

    updateTemplate: async (templateId, data) => {
        const response = await api.patch(`/project-templates/${templateId}`, data);
        return response.data;
    },

    getMoodboardTemplates: async (templateId) => {
        const response = await api.get(`/project-templates/${templateId}/spaces`);
        return response.data;
    },

    getMoodboardTemplateById: async (spaceId) => {
        const response = await api.get(`/project-templates/spaces/${spaceId}`);
        return response.data;
    },

    updateMoodboardTemplate: async (spaceId, data) => {
        const response = await api.patch(`/project-templates/spaces/${spaceId}`, data);
        return response.data;
    },
    createEstimatedCostTemplate: async (data) => {
        const response = await api.post('/project-templates/costs', data);
        return response.data;
    },

    updateEstimatedCostTemplate: async (costId, data) => {
        const response = await api.patch(`/project-templates/costs/${costId}`, data);
        return response.data;
    }
};
