import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { useGetVendor, useCreateVendor, useUpdateVendor } from '@/hooks/useVendor';
import ProfileDetails from '@/components/profile/ProfileDetails';
import ProfileForm from '@/components/profile/ProfileForm';
import { toast } from '@/components/ui/Toast';
import { useLoader } from '@/context/LoaderContext';
import { Loader2 } from 'lucide-react';

const BusinessProfileTab = () => {
    const { user } = useAuth();
    const fetchUser = useAuthStore((s) => s.fetchUser);
    const { setLoading } = useLoader();
    const router = useRouter();
    const userId = user?._id || user?.id;

    // Hooks for brand data
    const { data: brandData, isLoading: isBrandLoading } = useGetVendor(userId);
    const { mutate: createVendor, isPending: isCreating } = useCreateVendor();
    const { mutate: updateVendor, isPending: isUpdating } = useUpdateVendor();

    const [isEditing, setIsEditing] = useState(false);
    const [currentBrand, setCurrentBrand] = useState(null);

    // Update loader state
    useEffect(() => {
        setLoading(isBrandLoading);
    }, [isBrandLoading, setLoading]);

    // Process brand data
    useEffect(() => {
        if (brandData) {
            const brand = brandData.data || brandData.vendor || brandData;
            if (brand && typeof brand === 'object' && !Array.isArray(brand)) {
                setCurrentBrand(brand);
            } else {
                setCurrentBrand(null);
            }
        } else {
            setCurrentBrand(null);
        }
    }, [brandData]);

    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleCreateOrUpdate = async (data) => {
        try {
            const payload = {
                name: data.name,
                country: data.country,
                description: data.description,
                website: data.website,
                shippingAddress: data.shippingAddress,
                billingAddress: data.billingAddress,
                isActive: data.isActive
            };

            if (!currentBrand && user) {
                payload.userId = user._id || user.id;
            }

            if (data.logo && data.logo[0]) {
                const base64Logo = await fileToBase64(data.logo[0]);
                payload.logo = base64Logo;
            }

            if (currentBrand) {
                updateVendor({ id: currentBrand._id || currentBrand.id, data: payload }, {
                    onSuccess: () => {
                        toast.success('Profile updated successfully', 'Success');
                        setIsEditing(false);
                        router.push(`/dashboard`);
                    },
                    onError: (error) => {
                        toast.error(error.message || 'Failed to update profile', 'Error');
                    }
                });
            } else {
                createVendor(payload, {
                    onSuccess: async () => {
                        toast.success('Brand profile created successfully', 'Success');
                        setIsEditing(false);
                        // Re-fetch auth session so selectedBrands/activeBrand updates immediately
                        await fetchUser();
                        // Redirect to create product page
                        router.push(`/dashboard`);
                    },
                    onError: (error) => {
                        toast.error(error.message || 'Failed to create profile', 'Error');
                    }
                });
            }
        } catch (error) {
            toast.error("Failed to prepare profile data", "Error");
        }
    };

    if (isBrandLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
                <h2 className="text-xl font-bold text-gray-800">
                    {currentBrand ? 'Brand Profile' : 'Create Brand Profile'}
                </h2>
            </div>

            <div className="p-8">
                {!currentBrand || isEditing ? (
                    <ProfileForm
                        brand={currentBrand}
                        onSubmit={handleCreateOrUpdate}
                        onCancel={currentBrand ? () => setIsEditing(false) : null}
                        isSubmitting={isCreating || isUpdating}
                    />
                ) : (
                    <ProfileDetails
                        brand={currentBrand}
                        onEdit={() => setIsEditing(true)}
                    />
                )}
            </div>
        </div>
    );
};

export default BusinessProfileTab;
