import api from '@/lib/api';

export const ratingService = {
    submitRatings: async (data) => {
        const response = await api.post('/rating/submit', data);
        return response.data;
    },
    getUserRatings: async (userId) => {
        const response = await api.get(`/rating/user/${userId}`);
        return response.data;
    },
};
