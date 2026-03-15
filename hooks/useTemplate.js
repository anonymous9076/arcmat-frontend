import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectTemplateService } from '../services/projectTemplateService';
import { toast } from '@/components/ui/Toast';
import { PROJECT_KEYS } from './useProject';

export const TEMPLATE_KEYS = {
    all: ['project-templates'],
    lists: () => [...TEMPLATE_KEYS.all, 'list'],
    details: () => [...TEMPLATE_KEYS.all, 'detail'],
    detail: (id) => [...TEMPLATE_KEYS.details(), id],
    spaces: (templateId) => [...TEMPLATE_KEYS.detail(templateId), 'spaces'],
    space: (id) => [...TEMPLATE_KEYS.all, 'space', id],
};

export const useGetTemplates = (options = {}) => {
    return useQuery({
        queryKey: TEMPLATE_KEYS.lists(),
        queryFn: projectTemplateService.getTemplates,
        enabled: options.enabled !== false,
    });
};

export const useUpdateTemplate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ templateId, data }) => projectTemplateService.updateTemplate(templateId, data),
        onSuccess: (_, { templateId }) => {
            queryClient.invalidateQueries({ queryKey: TEMPLATE_KEYS.lists() });
            queryClient.invalidateQueries({ queryKey: TEMPLATE_KEYS.detail(templateId) });
            toast.success('Template updated successfully!');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update template');
        }
    });
};

export const useGetMoodboardTemplates = (templateId, options = {}) => {
    return useQuery({
        queryKey: TEMPLATE_KEYS.spaces(templateId),
        queryFn: () => projectTemplateService.getMoodboardTemplates(templateId),
        enabled: !!templateId && options.enabled !== false,
    });
};

export const useGetMoodboardTemplateById = (spaceId, options = {}) => {
    return useQuery({
        queryKey: TEMPLATE_KEYS.space(spaceId),
        queryFn: () => projectTemplateService.getMoodboardTemplateById(spaceId),
        enabled: !!spaceId && options.enabled !== false,
    });
};

export const useUpdateMoodboardTemplate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ spaceId, data }) => projectTemplateService.updateMoodboardTemplate(spaceId, data),
        onSuccess: (response, { spaceId }) => {
            const templateId = response?.data?.templateId;
            queryClient.invalidateQueries({ queryKey: TEMPLATE_KEYS.space(spaceId) });
            if (templateId) {
                queryClient.invalidateQueries({ queryKey: TEMPLATE_KEYS.spaces(templateId) });
            }
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update space template');
        }
    });
};

export const useCreateEstimatedCostTemplate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => projectTemplateService.createEstimatedCostTemplate(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TEMPLATE_KEYS.all });
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to create estimation template');
        }
    });
};

export const useUpdateEstimatedCostTemplate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ costId, data }) => projectTemplateService.updateEstimatedCostTemplate(costId, data),
        onSuccess: () => {
            // We usually invalidate the moodboard that uses this cost
            queryClient.invalidateQueries({ queryKey: TEMPLATE_KEYS.all });
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update estimation template');
        }
    });
};

export const useCreateTemplateFromProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: projectTemplateService.createTemplateFromProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TEMPLATE_KEYS.all });
            toast.success('Project saved as template!');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to create template');
        }
    });
};

export const useUseTemplate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ templateId, data }) => projectTemplateService.useTemplate(templateId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.all });
            toast.success('Project created from template successfully!');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to use template');
        }
    });
};

export const useDeleteTemplate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: projectTemplateService.deleteTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TEMPLATE_KEYS.all });
            toast.success('Template deleted successfully!');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete template');
        }
    });
};
