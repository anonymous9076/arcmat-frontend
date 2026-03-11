import api from '@/lib/api';

export const notificationService = {
    getMyNotifications: async () => {
        const response = await api.get('/notification');
        return response.data;
    },
    markAsRead: async (id) => {
        const response = await api.patch(`/notification/${id}/read`);
        return response.data;
    },
    handleAction: async (id, status) => {
        const response = await api.patch(`/notification/${id}/action`, { status });
        return response.data;
    },
    createNotification: async (data) => {
        const response = await api.post('/notification', data);
        return response.data;
    }
};
