import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { discussionService } from '../services/discussionService';
import { toast } from '@/components/ui/Toast';

export const DISCUSSION_KEYS = {
    all: ['discussion'],
    project: (projectId, spaceId = null) => [...DISCUSSION_KEYS.all, projectId, spaceId ? `space-${spaceId}` : 'general'],
};

export const useGetComments = (projectId, spaceId = null) => {
    return useQuery({
        queryKey: DISCUSSION_KEYS.project(projectId, spaceId),
        queryFn: () => discussionService.getComments(projectId, spaceId),
        enabled: !!projectId,
        refetchInterval: 5000, // Poll every 5 seconds for new messages
    });
};

export const usePostComment = (projectId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => discussionService.postComment(projectId, data),
        onSuccess: () => {
            // Invalidate all queries starting with the project ID to catch space-specific discussions
            queryClient.invalidateQueries({ queryKey: [...DISCUSSION_KEYS.all, projectId] });
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to post comment');
        },
    });
};

export const useDeleteComment = (projectId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (commentId) => discussionService.deleteComment(commentId),
        onSuccess: () => {
            // Invalidate all queries starting with the project ID to catch space-specific discussions
            queryClient.invalidateQueries({ queryKey: [...DISCUSSION_KEYS.all, projectId] });
            toast.success('Comment deleted');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete comment');
        },
    });
};
