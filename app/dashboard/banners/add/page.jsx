'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X } from 'lucide-react';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { useCreateBanner } from '@/hooks/useBanner';
import Image from 'next/image';
import RoleGuard from '@/components/auth/RoleGuard';

export default function AddBannerPage() {
    const router = useRouter();
    const createBannerMutation = useCreateBanner();

    const [formData, setFormData] = useState({
        banner_name: '',
        banner_alt: '',
        banner_link: '',
        banner_type: 'Hero',
        description: '',
        status: 1,
    });

    const [bannerFile, setBannerFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setBannerFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setBannerFile(null);
        setPreviewUrl(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.banner_name.trim()) {
            toast.error('Banner name is required');
            return;
        }
        if (!formData.banner_alt.trim()) {
            toast.error('Banner alt text is required');
            return;
        }
        if (!formData.banner_link.trim()) {
            toast.error('Banner link is required');
            return;
        }
        if (!formData.description.trim()) {
            toast.error('Description is required');
            return;
        }
        if (!bannerFile) {
            toast.error('Please upload a banner image');
            return;
        }

        setIsSubmitting(true);

        try {
            const data = new FormData();
            data.append('banner_name', formData.banner_name);
            data.append('banner_alt', formData.banner_alt);
            data.append('banner_link', formData.banner_link);
            data.append('banner_type', formData.banner_type);
            data.append('description', formData.description);
            data.append('status', formData.status);
            data.append('banner', bannerFile);

            await createBannerMutation.mutateAsync(data);
            toast.success('Banner created successfully!');
            router.push('/dashboard/banners');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create banner');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <RoleGuard allowedRoles={['admin']}>
            <Container className="py-8 max-w-4xl">
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Banners
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Add New Banner</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Create a new promotional banner for your website.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    {/* Banner Name */}
                    <div className="mb-6">
                        <label htmlFor="banner_name" className="block text-sm font-medium text-gray-700 mb-2">
                            Banner Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="banner_name"
                            name="banner_name"
                            value={formData.banner_name}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d9a88a] text-gray-900"
                            placeholder="Enter banner name"
                        />
                    </div>

                    {/* Banner Alt Text */}
                    <div className="mb-6">
                        <label htmlFor="banner_alt" className="block text-sm font-medium text-gray-700 mb-2">
                            Alt Text <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="banner_alt"
                            name="banner_alt"
                            value={formData.banner_alt}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d9a88a] text-gray-900"
                            placeholder="Enter alt text for accessibility"
                        />
                    </div>

                    {/* Banner Link */}
                    <div className="mb-6">
                        <label htmlFor="banner_link" className="block text-sm font-medium text-gray-700 mb-2">
                            Banner Link <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="url"
                            id="banner_link"
                            name="banner_link"
                            value={formData.banner_link}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d9a88a] text-gray-900"
                            placeholder="https://example.com"
                        />
                    </div>

                    {/* Banner Type */}
                    <div className="mb-6">
                        <label htmlFor="banner_type" className="block text-sm font-medium text-gray-700 mb-2">
                            Banner Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="banner_type"
                            name="banner_type"
                            value={formData.banner_type}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d9a88a] text-gray-900"
                        >
                            <option value="Hero">Hero</option>
                            <option value="Promotional">Promotional</option>
                            <option value="Sidebar">Sidebar</option>
                            <option value="Footer">Footer</option>
                            <option value="Popup">Popup</option>
                        </select>
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={4}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d9a88a] text-gray-900"
                            placeholder="Enter banner description"
                        />
                    </div>

                    {/* Status */}
                    <div className="mb-6">
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                        </label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d9a88a] text-gray-900"
                        >
                            <option value={1}>Active</option>
                            <option value={0}>Inactive</option>
                        </select>
                    </div>

                    {/* Banner Image Upload */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Banner Image <span className="text-red-500">*</span>
                        </label>

                        {!previewUrl ? (
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#d9a88a] transition-colors">
                                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-sm text-gray-600 mb-2">
                                    Click to upload or drag and drop
                                </p>
                                <p className="text-xs text-gray-500">
                                    PNG, JPG, GIF up to 10MB
                                </p>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="banner-upload"
                                />
                                <label
                                    htmlFor="banner-upload"
                                    className="inline-block mt-4 px-6 py-2 bg-[#d9a88a] text-white rounded-lg cursor-pointer hover:bg-[#c89675] transition-colors"
                                >
                                    Choose File
                                </label>
                            </div>
                        ) : (
                            <div className="relative">
                                <div className="relative w-full h-64 rounded-xl overflow-hidden border border-gray-200">
                                    <Image
                                        src={previewUrl}
                                        alt="Banner preview"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Form Actions */}
                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                        <Button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2.5 bg-[#d9a88a] text-white rounded-xl hover:bg-[#c89675] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Creating...' : 'Create Banner'}
                        </Button>
                    </div>
                </form>
            </Container>
        </RoleGuard>
    );
}
