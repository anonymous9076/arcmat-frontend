import React, { useState } from 'react';
import { User, Mail, Shield, Edit } from 'lucide-react';
import { useUpdateUser } from '@/hooks/useAuth';
import BasicInfoForm from './BasicInfoForm';
import { toast } from '@/components/ui/Toast';
import { useQueryClient } from '@tanstack/react-query';

const BasicInfoCard = ({ user }) => {
    const [isEditing, setIsEditing] = useState(false);
    const { mutate: updateProfile, isPending } = useUpdateUser();
    const queryClient = useQueryClient();

    if (!user) return null;

    const handleUpdate = (data) => {
        const userId = user._id || user.id;
        updateProfile({ id: userId, data }, {
            onSuccess: () => {
                toast.success('Basic information updated successfully', 'Success');
                setIsEditing(false);
                queryClient.invalidateQueries({ queryKey: ['user-info'] });
            },
            onError: (error) => {
                const message = error?.response?.data?.message || 'Failed to update information';
                toast.error(message, 'Error');
            }
        });
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="px-8 py-6 border-b border-gray-100 bg-white flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Basic Information</h2>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 text-[#e09a74] hover:text-[#d08963] font-medium transition-colors cursor-pointer"
                    >
                        <Edit size={18} />
                        <span className="text-sm">Edit</span>
                    </button>
                )}
            </div>

            <div className="p-8">
                {isEditing ? (
                    <BasicInfoForm
                        user={user}
                        onSubmit={handleUpdate}
                        onCancel={() => setIsEditing(false)}
                        isSubmitting={isPending}
                    />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                                <User size={20} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Full Name</p>
                                <p className="font-medium text-gray-900">{user.name || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
                                <Mail size={20} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Email Address</p>
                                <p className="font-medium text-gray-900">{user.email || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                                <Shield size={20} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Account Role</p>
                                <p className="font-medium text-gray-900 capitalize">{user.role || 'User'}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                                <Shield size={20} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                                <p className="font-medium text-gray-900">{user.mobile || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BasicInfoCard;
