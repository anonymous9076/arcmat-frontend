import api from '@/lib/api';

export const discussionService = {
    getComments: async (projectId, spaceId = null) => {
        const params = spaceId ? { spaceId } : {};
        const response = await api.get(`/discussion/${projectId}`, { params });
        return response.data;
    },

    postComment: async (projectId, data) => {
        const response = await api.post(`/discussion/${projectId}`, data);
        return response.data;
    },

    deleteComment: async (commentId) => {
        const response = await api.delete(`/discussion/comment/${commentId}`);
        return response.data;
    },
};
