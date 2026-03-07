import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { retailerRequestService } from '../services/retailerRequestService';
import { toast } from '@/components/ui/Toast';

export const RETAILER_REQ_KEYS = {
    all: ['retailerRequests'],
    project: (projectId) => [...RETAILER_REQ_KEYS.all, projectId],
    mine: () => [...RETAILER_REQ_KEYS.all, 'mine'],
};

export const useGetMyRetailerRequests = () => {
    return useQuery({
        queryKey: RETAILER_REQ_KEYS.mine(),
        queryFn: () => retailerRequestService.getMyRequests(),
    });
};

export const useGetProjectRetailerRequests = (projectId) => {
    return useQuery({
        queryKey: RETAILER_REQ_KEYS.project(projectId),
        queryFn: () => retailerRequestService.getProjectRequests(projectId),
        enabled: !!projectId,
    });
};

export const useCreateRetailerRequest = (projectId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => retailerRequestService.createRequest(projectId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: RETAILER_REQ_KEYS.project(projectId) });
            queryClient.invalidateQueries({ queryKey: RETAILER_REQ_KEYS.mine() });
            toast.success('Retailer contact request submitted! Arcmat will connect you shortly.');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to submit retailer request');
        },
    });
};
