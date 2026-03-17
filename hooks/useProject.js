// ─── useProject.js ────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../services/projectService';
import { toast } from '@/components/ui/Toast';
import { RETAILER_REQ_KEYS } from './useRetailerRequest'; // ← ADD THIS IMPORT at the top

export const PROJECT_KEYS = {
    all: ['projects'],
    lists: () => [...PROJECT_KEYS.all, 'list'],
    list: (filters) => [...PROJECT_KEYS.lists(), { ...filters }],
    details: () => [...PROJECT_KEYS.all, 'detail'],
    detail: (id) => [...PROJECT_KEYS.details(), id],
};

export const useGetProjects = (filters = {}) => {
    return useQuery({
        queryKey: PROJECT_KEYS.list(filters),
        queryFn: () => projectService.getAllProjects(filters),
        enabled: filters.enabled !== false,
        refetchInterval: 60000, // Reduced from 30s to 60s
    });
};

export const useGetProject = (id, options = {}) => {
    return useQuery({
        queryKey: [...PROJECT_KEYS.detail(id), options],
        queryFn: () => projectService.getProjectById(id, options),
        enabled: !!id,
        ...options
    });
};

export const useCreateProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: projectService.createProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.all });
            toast.success('Project created successfully!');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to create project');
        }
    });
};

export const useUpdateProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => projectService.updateProject(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.all });
            toast.success('Project updated successfully!');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update project');
        }
    });
};

export const useDeleteProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: projectService.deleteProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.all });
            toast.success('Project deleted successfully!');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete project');
        }
    });
};

export const useCompleteProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: projectService.completeProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.all });
            toast.success('Project marked as completed!');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to complete project');
        }
    });
};

export const useMarkNotificationsRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, spaceId, materialId, type }) =>
            projectService.markNotificationsRead(id, spaceId, materialId, type),
        onSuccess: (data, variables) => {
            // ↓ already existed
            queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.all });

            // ↓ ADD THESE TWO — replaces the old bare-string invalidations
            queryClient.invalidateQueries({ queryKey: RETAILER_REQ_KEYS.assigned() }); // FIX 1+2
            queryClient.invalidateQueries({ queryKey: RETAILER_REQ_KEYS.mine() });     // FIX 3

            if (variables.id && variables.spaceId) {
                queryClient.invalidateQueries({
                    queryKey: ['projects', 'detail', variables.id, 'space', variables.spaceId, 'notifications']
                });
            }
        },
        onError: (error) => {
            console.error('Failed to mark notifications read:', error.response?.data || error.message);
        }
    });
};

export const useMarkRetailerChatRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ retailerId, materialId }) =>
            projectService.markRetailerChatRead(retailerId, materialId),
        onSuccess: () => {
            // Invalidate both retailer-side and architect-side request caches
            // so unread badges update immediately across the whole app
            queryClient.invalidateQueries({ queryKey: RETAILER_REQ_KEYS.assigned() });
            queryClient.invalidateQueries({ queryKey: RETAILER_REQ_KEYS.mine() });
        },
        onError: (error) => {
            // Non-fatal: silently log - badge will be cleared on next poll
            console.warn('Failed to mark retailer chat as read:', error.response?.data?.message || error.message);
        }
    });
};

export const useGetProductNotifications = (projectId, spaceId) => {
    return useQuery({
        queryKey: [...PROJECT_KEYS.detail(projectId), 'space', spaceId, 'notifications'],
        queryFn: () => projectService.getProductNotifications(projectId, spaceId),
        enabled: !!projectId && !!spaceId,
        refetchInterval: 60000,
    });
};