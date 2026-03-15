import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attributeService } from '../services/attributeService';

export const ATTRIBUTE_KEYS = {
    all: ['attributes'],
    list: () => [...ATTRIBUTE_KEYS.all, 'list'],
};

export const useGetAttributes = () => {
    return useQuery({
        queryKey: ATTRIBUTE_KEYS.list(),
        queryFn: attributeService.getAllAttributes,
    });
};

export const useGetAttributesByCategory = (categoryId) => {
    return useQuery({
        queryKey: [...ATTRIBUTE_KEYS.list(), { categoryId }],
        queryFn: () => attributeService.getAttributesByCategoryId(categoryId),
        enabled: !!categoryId && categoryId !== 'All',
    });
};

export const useCreateAttribute = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: attributeService.createAttribute,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ATTRIBUTE_KEYS.list() });
        },
    });
};

export const useUpdateAttribute = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => attributeService.updateAttribute({ id, data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ATTRIBUTE_KEYS.list() });
        },
    });
};

export const useDeleteAttribute = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: attributeService.deleteAttribute,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ATTRIBUTE_KEYS.list() });
        },
    });
};
