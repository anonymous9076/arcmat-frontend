import React, { useState, useEffect } from 'react';
import { useAuth, useUpdateUser } from '@/hooks/useAuth';
import { useGetVendors } from '@/hooks/useVendor';
import RetailerProfileDetails from '@/components/profile/RetailerProfileDetails';
import RetailerProfileForm from '@/components/profile/RetailerProfileForm';
import { toast } from '@/components/ui/Toast';
import { useLoader } from '@/context/LoaderContext';
import { Loader2 } from 'lucide-react';

const RetailerProfileTab = () => {
    const { user, queryClient } = useAuth();
    const { setLoading } = useLoader();
    const userId = user?._id || user?.id;

    // Fetch all brands for the form
    const { data: vendorsData, isLoading: isBrandsLoading } = useGetVendors();
    const brands = vendorsData?.data || vendorsData || [];

    const { mutate: updateProfile, isPending: isUpdating } = useUpdateUser();

    const [isEditing, setIsEditing] = useState(false);

    const handleUpdate = async (payload) => {
        if (!userId) {
            toast.error("User ID not found", "Error");
            return;
        }

        updateProfile({ id: userId, data: payload }, {
            onSuccess: () => {
                toast.success('Retailer profile updated successfully', 'Success');
                setIsEditing(false);
                // Invalidate user info to refresh the profile view
                queryClient.invalidateQueries({ queryKey: ['user-info'] });
            },
            onError: (error) => {
                const message = error?.response?.data?.message || 'Failed to update profile';
                toast.error(message, 'Error');
            }
        });
    };

    if (isBrandsLoading) {
        return (
            <div className="flex justify-center items-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
                <Loader2 className="w-8 h-8 animate-spin text-[#e09a74]" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
                <h2 className="text-xl font-bold text-gray-800">
                    Retailer Profile
                </h2>
            </div>

            <div className="p-8">
                {isEditing ? (
                    <RetailerProfileForm
                        user={user}
                        brands={brands}
                        onSubmit={handleUpdate}
                        onCancel={() => setIsEditing(false)}
                        isSubmitting={isUpdating}
                    />
                ) : (
                    <RetailerProfileDetails
                        user={user}
                        brands={brands}
                        onEdit={() => setIsEditing(true)}
                    />
                )}
            </div>
        </div>
    );
};

export default RetailerProfileTab;
