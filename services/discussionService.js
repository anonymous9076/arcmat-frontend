import api from '@/lib/api';

export const isValidId = (id) => !!(id && typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id));

export const discussionService = {
    getComments: async (projectId, spaceId = null, retailerId = null, materialId = null, isInternal = null) => {
        if (!isValidId(projectId) && (!retailerId || !materialId)) {
            console.error('Missing required context in getComments:', { projectId, retailerId, materialId });
            return { data: [] };
        }
        const params = {};
        if (spaceId) params.spaceId = spaceId;
        if (retailerId) params.retailerId = retailerId;
        if (materialId) params.materialId = materialId;
        if (isInternal !== null) params.isInternal = isInternal;
        const response = await api.get(`/discussion/${projectId}`, { params });
        return response.data;
    },

    postComment: async (projectId, data) => {
        const targetProjectId = isValidId(projectId) ? projectId : 'null';
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
