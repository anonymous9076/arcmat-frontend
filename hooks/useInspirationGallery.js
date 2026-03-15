import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/components/ui/Toast';

export const INSPIRATION_GALLERY_KEYS = {
    all: ['inspiration-gallery'],
    featured: () => [...INSPIRATION_GALLERY_KEYS.all, 'featured'],
    architects: () => [...INSPIRATION_GALLERY_KEYS.all, 'architects'],
    architectRenders: (id) => [...INSPIRATION_GALLERY_KEYS.all, 'architect', id, 'renders'],
};

export const useGetFeaturedGallery = () => {
    return useQuery({
        queryKey: INSPIRATION_GALLERY_KEYS.featured(),
        queryFn: async () => {
            const { data } = await api.get('/inspiration-gallery');
            return data.data;
        },
        staleTime: 5 * 60 * 1000,
    });
};

export const useGetArchitectsWithRenders = () => {
    return useQuery({
        queryKey: INSPIRATION_GALLERY_KEYS.architects(),
        queryFn: async () => {
            const { data } = await api.get('/inspiration-gallery/architects');
            return data.data;
        },
        staleTime: 5 * 60 * 1000,
    });
};

export const useGetArchitectRenders = (architectId) => {
    return useQuery({
        queryKey: INSPIRATION_GALLERY_KEYS.architectRenders(architectId),
        queryFn: async () => {
            const { data } = await api.get(`/inspiration-gallery/architects/${architectId}/renders`);
            return data.data;
        },
        enabled: !!architectId,
        staleTime: 60 * 1000,
    });
};

export const useAddToFeaturedGallery = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (renderData) => {
            const { data } = await api.post('/inspiration-gallery', renderData);
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: INSPIRATION_GALLERY_KEYS.all });
            toast.success('Render added to inspiration gallery!');
        },
        onError: (error) => {
            console.error('Failed to add to featured gallery:', error);
            toast.error(error.response?.data?.message || 'Failed to add to gallery');
        }
    });
};

export const useRemoveFromFeaturedGallery = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id) => {
            const { data } = await api.delete(`/inspiration-gallery/${id}`);
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: INSPIRATION_GALLERY_KEYS.all });
            toast.success('Render removed from inspiration gallery');
        },
        onError: (error) => {
            console.error('Failed to remove from featured gallery:', error);
            toast.error(error.response?.data?.message || 'Failed to remove from gallery');
        }
    });
};
