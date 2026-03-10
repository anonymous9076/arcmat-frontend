import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Button from '@/components/ui/Button';
import { Loader2 } from 'lucide-react';

const BasicInfoForm = ({ user, onSubmit, onCancel, isSubmitting }) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm({
        defaultValues: {
            name: user?.name || '',
            mobile: user?.mobile || '',
        }
    });

    useEffect(() => {
        if (user) {
            reset({
                name: user.name || '',
                mobile: user.mobile || '',
            });
        }
    }, [user, reset]);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                        {...register('name', { required: 'Name is required' })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e09a74]/20 focus:border-[#e09a74] outline-none transition-all"
                        placeholder="John Doe"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                        {...register('mobile', { required: 'Phone number is required' })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e09a74]/20 focus:border-[#e09a74] outline-none transition-all"
                        placeholder="+91 9876543210"
                    />
                    {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile.message}</p>}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                    type="button"
                    onClick={onCancel}
                    className="bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 px-3 cursor-pointer"
                    text="Cancel"
                />
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#e09a74] text-white cursor-pointer hover:opacity-90 min-w-[100px] py-1.5 px-4 border border-[#e09a74]"
                    text={isSubmitting ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="animate-spin" size={14} />
                            <span>Saving...</span>
                        </div>
                    ) : 'Save Changes'}
                />
            </div>
        </form>
    );
};

export default BasicInfoForm;
