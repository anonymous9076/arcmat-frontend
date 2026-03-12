import api from '@/lib/api';

export const discussionService = {
    getComments: async (projectId, spaceId = null, retailerId = null, materialId = null, isInternal = null) => {
        const params = {};
        if (spaceId) params.spaceId = spaceId;
        if (retailerId) params.retailerId = retailerId;
        if (materialId) params.materialId = materialId;
        if (isInternal !== null) params.isInternal = isInternal;
        const response = await api.get(`/discussion/${projectId}`, { params });
        return response.data;
    },

    postComment: async (projectId, data) => {
        const isFormData = data instanceof FormData;
        const response = await api.post(`/discussion/${projectId}`, data, {
            headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
        });
        return response.data;
    },

    deleteComment: async (commentId) => {
        const response = await api.delete(`/discussion/comment/${commentId}`);
        return response.data;
    },
};
