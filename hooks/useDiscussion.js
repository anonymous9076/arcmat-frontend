import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { discussionService } from '../services/discussionService';
import { toast } from '@/components/ui/Toast';

export const DISCUSSION_KEYS = {
    all: ['discussion'],
    project: (projectId) => [...DISCUSSION_KEYS.all, projectId],
};

export const useGetComments = (projectId) => {
    return useQuery({
        queryKey: DISCUSSION_KEYS.project(projectId),
        queryFn: () => discussionService.getComments(projectId),
        enabled: !!projectId,
    });
};

export const usePostComment = (projectId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => discussionService.postComment(projectId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DISCUSSION_KEYS.project(projectId) });
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
            queryClient.invalidateQueries({ queryKey: DISCUSSION_KEYS.project(projectId) });
            toast.success('Comment deleted');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete comment');
        },
    });
};
