import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import cartService from '@/services/cartService';
import { toast } from '@/components/ui/Toast';

export const useGetCart = (enabled = true) => {
    return useQuery({
        queryKey: ['cart'],
        queryFn: cartService.getCart,
        enabled,
    });
};

export const useGetCartCount = (enabled = true) => {
    return useQuery({
        queryKey: ['cartCount'],
        queryFn: cartService.getCartCount,
        enabled,
    });
};

export const useAddToCart = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            console.log("Add to Cart is disabled");
            return null;
        },
        onSuccess: (response) => {
            // queryClient.invalidateQueries(['cart']);
            // queryClient.invalidateQueries(['cartCount']);
            // toast.success("Item added to cart");
        },
        onError: (error) => {
            // toast.error("Failed to add item to cart");
        }
    });
};

export const useUpdateCartQuantity = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ cart_id, product_qty }) => cartService.updateQuantity(cart_id, product_qty),
        onSuccess: () => {
            queryClient.invalidateQueries(['cart']);
            queryClient.invalidateQueries(['cartCount']);
        },
        onError: (error) => {
            toast.error("Failed to update quantity");
        }
    });
};

export const useRemoveFromCart = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: cartService.removeFromCart,
        onSuccess: () => {
            queryClient.invalidateQueries(['cart']);
            queryClient.invalidateQueries(['cartCount']);
            toast.success("Item removed from cart");
        },
        onError: (error) => {
            toast.error("Failed to remove item");
        }
    });
};
