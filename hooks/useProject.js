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
        refetchInterval: 30000,
    });
};

export const useGetProject = (id) => {
    return useQuery({
        queryKey: PROJECT_KEYS.detail(id),
        queryFn: () => projectService.getProjectById(id),
        enabled: !!id,
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

export const useGetProductNotifications = (projectId, spaceId) => {
    return useQuery({
        queryKey: [...PROJECT_KEYS.detail(projectId), 'space', spaceId, 'notifications'],
        queryFn: () => projectService.getProductNotifications(projectId, spaceId),
        enabled: !!projectId && !!spaceId,
        refetchInterval: 30000,
    });
};