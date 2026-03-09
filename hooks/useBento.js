import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/components/ui/Toast';

export const useGetBentoItems = () => {
    return useQuery({
        queryKey: ['bento-items'],
        queryFn: async () => {
            const { data } = await api.get('/bento');
            return data.data;
        },
        staleTime: 5 * 60 * 1000
    });
};

export const useUpdateBentoItem = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, formData }) => {
            const { data } = await api.put(`/bento/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bento-items'] });
            toast.success('Bento Grid updated successfully');
        },
        onError: (error) => {
            console.error('Failed to update bento item', error);
            toast.error(error.response?.data?.message || 'Failed to update Bento Grid. Please try again.');
        }
    });
};

export const useCreateBentoItem = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (formData) => {
            const { data } = await api.post('/bento', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bento-items'] });
            toast.success('Bento Item created successfully');
        },
        onError: (error) => {
            console.error('Failed to create bento item', error);
            toast.error(error.response?.data?.message || 'Failed to create Bento Item. Please try again.');
        }
    });
};

export const useDeleteBentoItem = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id) => {
            const { data } = await api.delete(`/bento/${id}`);
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bento-items'] });
            toast.success('Bento Item deleted successfully');
        },
        onError: (error) => {
            console.error('Failed to delete bento item', error);
            toast.error(error.response?.data?.message || 'Failed to delete Bento Item. Please try again.');
        }
    });
};
