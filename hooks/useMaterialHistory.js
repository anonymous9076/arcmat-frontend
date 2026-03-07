import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { materialHistoryService } from '../services/materialHistoryService';
import { toast } from '@/components/ui/Toast';

export const HISTORY_KEYS = {
    all: ['materialHistory'],
    project: (projectId) => [...HISTORY_KEYS.all, projectId],
    space: (projectId, spaceId) => [...HISTORY_KEYS.all, projectId, spaceId],
};

export const useGetSpaceHistory = (projectId, spaceId) => {
    return useQuery({
        queryKey: HISTORY_KEYS.space(projectId, spaceId),
        queryFn: () => materialHistoryService.getSpaceHistory(projectId, spaceId),
        enabled: !!projectId && !!spaceId,
    });
};

export const useGetProjectHistory = (projectId) => {
    return useQuery({
        queryKey: HISTORY_KEYS.project(projectId),
        queryFn: () => materialHistoryService.getProjectHistory(projectId),
        enabled: !!projectId,
    });
};

export const useAddMaterialVersion = (projectId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => materialHistoryService.addVersion(projectId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: HISTORY_KEYS.project(projectId) });
            toast.success('Material version recorded');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to record material version');
        },
    });
};

export const useApproveMaterialVersion = (projectId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ versionId, data }) => materialHistoryService.approveVersion(versionId, data),
        onSuccess: (_, { data }) => {
            queryClient.invalidateQueries({ queryKey: HISTORY_KEYS.project(projectId) });
            toast.success(`Material ${data.status === 'Approved' ? 'approved' : 'rejected'} successfully`);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update approval');
        },
    });
};
