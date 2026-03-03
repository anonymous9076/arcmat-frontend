import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export const useGetArchitectProducts = () => {
    return useQuery({
        queryKey: ['architect_moodboard_products'],
        queryFn: async () => {
            const res = await api.get('/project');
            const projects = res.data?.data || [];

            const allProducts = [];
            const seenIds = new Set();

            projects.forEach(project => {
                if (project.moodboards) {
                    project.moodboards.forEach(mb => {
                        if (mb.estimatedCostId && mb.estimatedCostId.productIds) {
                            mb.estimatedCostId.productIds.forEach(prod => {
                                const p = prod.productId || prod;
                                if (p && p._id && !seenIds.has(p._id)) {
                                    allProducts.push(p);
                                    seenIds.add(p._id);
                                }
                            });
                        }
                    });
                }
            });

            return allProducts;
        },
    });
};
