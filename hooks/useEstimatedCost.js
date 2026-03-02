import { useMutation, useQueryClient } from '@tanstack/react-query';
import { estimatedCostService } from '../services/estimatedCostService';
import { MOODBOARD_KEYS } from './useMoodboard';
import { toast } from '@/components/ui/Toast';

export const useCreateEstimatedCost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: estimatedCostService.createEstimatedCost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MOODBOARD_KEYS.all });
            toast.success('Added to moodboard');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to add estimation');
        }
    });
};

export const useUpdateEstimatedCost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => estimatedCostService.updateEstimatedCost(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MOODBOARD_KEYS.all });
            toast.success('Estimation updated!');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update estimation');
        }
    });
};

export const useDeleteEstimatedCost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: estimatedCostService.deleteEstimatedCost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MOODBOARD_KEYS.all });
            toast.success('Estimation removed!');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to remove estimation');
        }
    });
};
