import api from '@/lib/api';

export const moodboardService = {
    getMoodboardsByProject: async (projectId) => {
        const response = await api.get(`/moodboard/project/${projectId}`);
        return response.data;
    },

    getAllMoodboards: async () => {
        const response = await api.get('/moodboard/list/all');
        return response.data;
    },

    getMoodboardList: async (projectId) => {
        const response = await api.get(`/moodboard/list/${projectId}`);
        return response.data;
    },

    getMoodboardById: async (id) => {
        const response = await api.get(`/moodboard/id/${id}`);
        return response.data;
    },

    createMoodboard: async (moodboardData) => {
        const response = await api.post('/moodboard', moodboardData);
        return response.data;
    },

    updateMoodboard: async (id, moodboardData) => {
        const response = await api.patch(`/moodboard/${id}`, moodboardData);
        return response.data;
    },

    deleteMoodboard: async (id) => {
        const response = await api.delete(`/moodboard/${id}`);
        return response.data;
    }
};
