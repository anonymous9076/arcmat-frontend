import { useMutation, useQuery } from '@tanstack/react-query';
import { ratingService } from '@/services/ratingService';
import { toast } from '@/components/ui/Toast';

export const useSubmitRating = () => {
    return useMutation({
        mutationFn: ratingService.submitRatings,
        onSuccess: () => {
            toast.success('Rating submitted! Thank you for your feedback.');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to submit rating');
        },
    });
};

export const useGetUserRatings = (userId) => {
    return useQuery({
        queryKey: ['ratings', 'user', userId],
        queryFn: () => ratingService.getUserRatings(userId),
        enabled: !!userId,
    });
};
