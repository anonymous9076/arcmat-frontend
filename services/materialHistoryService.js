import api from '@/lib/api';

export const materialHistoryService = {
    addVersion: async (projectId, data) => {
        const response = await api.post(`/material-history/${projectId}/versions`, data);
        return response.data;
    },

    getSpaceHistory: async (projectId, spaceId) => {
        const response = await api.get(`/material-history/${projectId}/space/${spaceId}`);
        return response.data;
    },

    getProjectHistory: async (projectId) => {
        const response = await api.get(`/material-history/${projectId}/all`);
        return response.data;
    },

    approveVersion: async (versionId, data) => {
        const response = await api.patch(`/material-history/version/${versionId}/approve`, data);
        return response.data;
    },
};
