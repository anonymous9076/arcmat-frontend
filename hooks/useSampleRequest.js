import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sampleRequestService } from '../services/sampleRequestService';
import { toast } from '@/components/ui/Toast';

export const SAMPLE_KEYS = {
    all: ['sampleRequests'],
    project: (projectId) => [...SAMPLE_KEYS.all, projectId],
    mine: () => [...SAMPLE_KEYS.all, 'mine'],
};

export const useGetProjectSampleRequests = (projectId) => {
    return useQuery({
        queryKey: SAMPLE_KEYS.project(projectId),
        queryFn: () => sampleRequestService.getProjectRequests(projectId),
        enabled: !!projectId,
    });
};

export const useGetMySampleRequests = () => {
    return useQuery({
        queryKey: SAMPLE_KEYS.mine(),
        queryFn: () => sampleRequestService.getMyRequests(),
    });
};

export const useCreateSampleRequest = (projectId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => sampleRequestService.createRequest(projectId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SAMPLE_KEYS.project(projectId) });
            queryClient.invalidateQueries({ queryKey: SAMPLE_KEYS.mine() });
            toast.success('Sample request submitted! Arcmat will dispatch soon.');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to create sample request');
        },
    });
};
