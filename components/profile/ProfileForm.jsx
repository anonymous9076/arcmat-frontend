import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Button from '@/components/ui/Button';
import { Loader2 } from 'lucide-react';
import { getBrandImageUrl } from '@/lib/productUtils';


const ProfileForm = ({ brand, onSubmit, onCancel, isSubmitting }) => {
    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors }
    } = useForm({
        defaultValues: {
            name: '',
            country: 'India',
            description: '',
            website: '',
            shippingAddress: '',
            billingAddress: '',
            isActive: true
        }
    });

    useEffect(() => {
        if (brand) {
            reset({
                name: brand.name || '',
                country: brand.country || 'India',
                description: brand.description || '',
                website: brand.website || '',
                shippingAddress: brand.shippingAddress || '',
                billingAddress: brand.billingAddress || '',
                isActive: brand.isActive ?? true,
            });
        } else {
            reset({
                name: '',
                country: 'India',
                isActive: true,
                description: '',
                website: '',
                shippingAddress: '',
                billingAddress: ''
            });
        }
    }, [brand, reset]);

    const logoFile = watch('logo');
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        if (logoFile && logoFile[0]) {
            const objectUrl = URL.createObjectURL(logoFile[0]);
            setPreview(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        } else {
            setPreview(brand?.logo ? getBrandImageUrl(brand.logo) : null);
        }
    }, [logoFile, brand]);


    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
                        <input
                            {...register('name', { required: 'Name is required' })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e09a74]/20 focus:border-[#e09a74] outline-none transition-all"
                            placeholder="e.g. Kajaria"
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                        <input
                            {...register('country')}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e09a74]/20 focus:border-[#e09a74] outline-none transition-all"
                            placeholder="e.g. India"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                        <input
                            {...register('website')}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e09a74]/20 focus:border-[#e09a74] outline-none transition-all"
                            placeholder="https://..."
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                        <div className="flex items-center gap-4">
                            <div className="relative w-24 h-24 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center overflow-hidden">
                                {preview ? (
                                    <img
                                        src={preview}
                                        alt="Logo Preview"
                                        className="w-full h-full object-contain p-2"
                                    />
                                ) : (
                                    <span className="text-gray-400 text-xs">No Logo</span>
                                )}
                            </div>
                            <div className="flex-1">
                                <input
                                    type="file"
                                    accept="image/*"
                                    {...register('logo', {
                                        validate: {
                                            fileSize: (files) => {
                                                if (!files?.[0]) return true;
                                                return files[0].size <= 70 * 1024 || 'File size must be less than 70KB';
                                            }
                                        }
                                    })}
                                    className="block w-full text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-full file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-[#e09a74]/10 file:text-[#e09a74]
                                        hover:file:bg-[#e09a74]/20
                                    "
                                />
                                <p className="mt-1 text-xs text-gray-500">PNG, JPG up to 70KB</p>
                                {errors.logo && <p className="text-red-500 text-xs mt-1">{errors.logo.message}</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Addresses</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1"> Full Shipping Address</label>
                        <textarea
                            {...register('shippingAddress')}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e09a74]/20 focus:border-[#e09a74] outline-none transition-all resize-none"
                            placeholder="Delhi India"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Billing Address</label>
                        <textarea
                            {...register('billingAddress')}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e09a74]/20 focus:border-[#e09a74] outline-none transition-all resize-none"
                            placeholder="Delhi India"
                        />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                    {...register('description')}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#e09a74]/20 focus:border-[#e09a74] outline-none transition-all"
                    placeholder="Premium furniture brand..."
                />
            </div>

            <div className="flex justify-end gap-3 pt-4">
                {onCancel && (
                    <Button
                        type="button"
                        onClick={onCancel}
                        className="bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-[#e09a74] hover:text-[#e09a74] px-3 cursor-pointer"
                        text="Cancel"
                    />
                )}
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#e09a74] text-white cursor-pointer hover:bg-white min-w-[120px] py-2 px-4 hover:border-[#e09a74] border hover:text-[#e09a74]"
                    text={isSubmitting ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="animate-spin" size={16} />
                            <span>Saving...</span>
                        </div>
                    ) : 'Save Profile'}
                />
            </div>
        </form>
    );
};

export default ProfileForm;
