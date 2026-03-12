// ─── useRetailerRequest.js ────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { retailerRequestService } from '../services/retailerRequestService';
import { toast } from '@/components/ui/Toast';

// BUG FIX 1 & 3: Centralise all retailer request query keys so that
// invalidations in useMarkNotificationsRead actually hit the right caches.
// Previously 'assignedRetailerRequests' and 'retailerRequests/mine' were
// bare strings with no relationship to each other or PROJECT_KEYS.
export const RETAILER_REQ_KEYS = {
    all: ['retailerRequests'],
    project: (projectId) => [...RETAILER_REQ_KEYS.all, projectId],
    mine: () => [...RETAILER_REQ_KEYS.all, 'mine'],
    // FIX 1: Use a structured key so useMarkNotificationsRead can target it
    assigned: () => [...RETAILER_REQ_KEYS.all, 'assigned'],
};

export const useGetMyRetailerRequests = () => {
    return useQuery({
        queryKey: RETAILER_REQ_KEYS.mine(),
        queryFn: () => retailerRequestService.getMyRequests(),
        // BUG FIX 5 (retailer side): Poll so unread counts on the
        // "Chat with Retailer" button badges stay fresh automatically
        refetchInterval: 30000,
    });
};

export const useGetRetailerAssignedRequests = (options = {}) => {
    return useQuery({
        // FIX 1: Changed from bare string 'assignedRetailerRequests' to
        // structured key so invalidateQueries({ queryKey: RETAILER_REQ_KEYS.assigned() })
        // in useMarkNotificationsRead correctly busts this cache
        queryKey: RETAILER_REQ_KEYS.assigned(),
        queryFn: () => retailerRequestService.getAssignedRequests(),
        refetchInterval: 30000, // FIX 5: keep sidebar retailer badge fresh
        ...options,
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

export const useUpdateRetailerRequestStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ requestId, status }) => retailerRequestService.updateStatus(requestId, { status }),
        onSuccess: () => {
            // FIX 1: Use structured key instead of bare string
            queryClient.invalidateQueries({ queryKey: RETAILER_REQ_KEYS.assigned() });
            toast.success('Request status updated');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update request status');
        },
    });
};