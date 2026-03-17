import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moodboardService } from '../services/moodboardService';
import { toast } from '@/components/ui/Toast';

export const MOODBOARD_KEYS = {
    all: ['moodboards'],
    lists: () => [...MOODBOARD_KEYS.all, 'list'],
    list: (projectId) => [...MOODBOARD_KEYS.lists(), projectId],
    dropdowns: () => [...MOODBOARD_KEYS.all, 'dropdown'],
    dropdown: (projectId) => [...MOODBOARD_KEYS.dropdowns(), projectId],
    details: () => [...MOODBOARD_KEYS.all, 'detail'],
    detail: (id) => [...MOODBOARD_KEYS.details(), id],
};

export const useGetMoodboardsByProject = (projectId) => {
    return useQuery({
        queryKey: MOODBOARD_KEYS.list(projectId),
        queryFn: () => moodboardService.getMoodboardsByProject(projectId),
        enabled: !!projectId,
    });
};

export const useGetAllMoodboards = () => {
    return useQuery({
        queryKey: [...MOODBOARD_KEYS.all, 'list_all'],
        queryFn: () => moodboardService.getAllMoodboards(),
    });
};

export const useGetMoodboardDropdown = (projectId) => {
    return useQuery({
        queryKey: MOODBOARD_KEYS.dropdown(projectId),
        queryFn: () => moodboardService.getMoodboardList(projectId),
        enabled: !!projectId,
    });
};

export const useGetMoodboard = (id, options = {}) => {
    return useQuery({
        queryKey: [...MOODBOARD_KEYS.detail(id), options],
        queryFn: () => moodboardService.getMoodboardById(id, options),
        enabled: !!id,
        ...options
    });
};

export const useCreateMoodboard = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: moodboardService.createMoodboard,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: MOODBOARD_KEYS.all });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            toast.success('Moodboard created successfully!');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to create moodboard');
        }
    });
};

export const useUpdateMoodboard = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => moodboardService.updateMoodboard(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MOODBOARD_KEYS.all });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            // Silence auto-save toasts to avoid spamming the user
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update moodboard');
        }
    });
};

export const useDeleteMoodboard = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: moodboardService.deleteMoodboard,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MOODBOARD_KEYS.all });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            toast.success('Moodboard deleted successfully!');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete moodboard');
        }
    });
};

export const useDuplicateMoodboard = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: moodboardService.duplicateMoodboard,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MOODBOARD_KEYS.all });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            toast.success('Space Template duplicated! (Canvas cleared)');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to duplicate space');
        }
    });
};
