import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notificationService';
import { toast } from 'sonner';

export const useGetNotifications = () => {
    return useQuery({
        queryKey: ['notifications'],
        queryFn: notificationService.getMyNotifications,
    });
};

export const useMarkNotificationRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: notificationService.markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
};

export const useNotificationAction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }) => notificationService.handleAction(id, status),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success(`Action ${data.data.actionStatus} successfully`);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to handle action');
        }
    });
};

export const useCreateNotification = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: notificationService.createNotification,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
};
