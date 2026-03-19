import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistService } from '../services/wishlistService';
import { toast } from '@/components/ui/Toast';

export const WISHLIST_KEYS = {
    all: ['wishlist'],
};

export const useGetWishlist = (enabled = true) => {
    return useQuery({
        queryKey: WISHLIST_KEYS.all,
        queryFn: wishlistService.getWishlist,
        enabled: enabled,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
};

export const useAddToWishlist = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            console.log("Add to Wishlist is disabled");
            return null;
        },
        onSuccess: () => {
            // queryClient.invalidateQueries({ queryKey: WISHLIST_KEYS.all });
            // toast.success("Added to wishlist");
        },
        onError: (error) => {
            // const message = error.response?.data?.message || "Failed to add to wishlist";
            // if (message === "Item already in wishlist") {
            //     toast.info("Item is already in your wishlist");
            // } else {
            //     toast.error(message);
            // }
        }
    });
};

export const useRemoveFromWishlist = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: wishlistService.removeFromWishlist,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: WISHLIST_KEYS.all });
            toast.success("Removed from wishlist");
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to remove from wishlist");
        }
    });
};
