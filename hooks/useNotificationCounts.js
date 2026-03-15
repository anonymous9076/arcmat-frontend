import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export const NOTIFICATION_KEYS = {
    all: ['notifications'],
    counts: () => [...NOTIFICATION_KEYS.all, 'counts'],
};

export const useNotificationCounts = (options = {}) => {
    return useQuery({
        queryKey: NOTIFICATION_KEYS.counts(),
        queryFn: async () => {
            const response = await api.get('/notification/counts');
            return response.data;
        },
        // Scalable Polling: Check every 60s instead of 30s.
        // Also ensure it doesn't poll when the window is hidden.
        refetchInterval: 60000,
        refetchOnWindowFocus: true,
        staleTime: 30000, // Consider data fresh for 30s
        ...options,
    });
};
