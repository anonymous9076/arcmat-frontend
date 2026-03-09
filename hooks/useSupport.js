import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import supportService from '@/services/supportService';
import { toast } from '@/components/ui/Toast';

export const useSupportQueries = (isAdmin = false) => {
    return useQuery({
        queryKey: ['support-queries', isAdmin],
        queryFn: async () => {
            const response = await supportService.getQueries();
            return response.data || response;
        }
    });
};

export const useCreateSupportQuery = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => supportService.createQuery(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['support-queries'] });
            toast.success("Support ticket created successfully", "Submitted");
        },
        onError: (error) => {
            const message = error?.response?.data?.message || "Failed to submit support ticket";
            toast.error(message, "Error");
        }
    });
};

export const useUpdateSupportStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ queryId, data }) => supportService.updateQueryStatus(queryId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['support-queries'] });
            toast.success("Status updated successfully", "Success");
        }
    });
};

export const useDeleteSupportQuery = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => supportService.deleteQuery(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['support-queries'] });
            toast.success("Support ticket deleted", "Deleted");
        }
    });
};
