'use client';

import React, { useState, useMemo } from 'react';
import { Search, Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { toast } from '@/components/ui/Toast';
import { useGetBanners, useDeleteBanner } from '@/hooks/useBanner';
import Image from 'next/image';
import { getBannerImageUrl } from '@/lib/productUtils';
import RoleGuard from '@/components/auth/RoleGuard';

export default function BannersPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [bannerToDelete, setBannerToDelete] = useState(null);

    const { data: apiResponse, isLoading, error } = useGetBanners();
    const banners = Array.isArray(apiResponse) ? apiResponse : (apiResponse?.data || []);

    const deleteBannerMutation = useDeleteBanner();

    const filteredBanners = useMemo(() => {
        if (!searchQuery) return banners;
        const query = searchQuery.toLowerCase();
        return banners.filter((banner) =>
            banner.banner_name?.toLowerCase().includes(query) ||
            banner.banner_type?.toLowerCase().includes(query) ||
            banner.description?.toLowerCase().includes(query)
        );
    }, [banners, searchQuery]);

    const handleDeleteClick = (banner) => {
        setBannerToDelete(banner);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!bannerToDelete) return;
        try {
            await deleteBannerMutation.mutateAsync(bannerToDelete._id);
            toast.success(`Banner "${bannerToDelete.banner_name}" deleted successfully`);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete banner");
        } finally {
            setIsDeleteModalOpen(false);
            setBannerToDelete(null);
        }
    };

    // Local function replaced by import from lib/productUtils

    if (isLoading) {
        return (
            <Container className="py-8 flex justify-center items-center h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d9a88a]"></div>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="py-8 text-center text-red-500">
                Failed to load banners. Please try again later.
            </Container>
        );
    }

    return (
        <RoleGuard allowedRoles={['admin']}>
            <Container className="py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Banner Management</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Manage promotional banners and hero images for your website.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search banners..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2.5 border bg-white border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d9a88a] w-full text-black transition-all"
                            />
                        </div>

                        <Button
                            onClick={() => router.push('/dashboard/banners/add')}
                            className="flex items-center bg-[#d9a88a] text-white cursor-pointer hover:bg-white hover:text-[#d9a88a] border border-[#d9a88a] font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Add Banner
                        </Button>
                    </div>
                </div>

                {/* Banners Table */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    {filteredBanners.length === 0 ? (
                        <div className="text-center py-12">
                            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No banners found.</p>
                            {!searchQuery && (
                                <Button
                                    onClick={() => router.push('/dashboard/banners/add')}
                                    className="mt-4 bg-[#d9a88a] text-white hover:bg-[#c89675]"
                                >
                                    Create Your First Banner
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Preview
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Link
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Created
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredBanners.map((banner) => {
                                        const imageUrl = getBannerImageUrl(banner.banner);
                                        return (
                                            <tr key={banner._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="relative w-20 h-12 rounded-lg overflow-hidden bg-gray-100">
                                                        {imageUrl ? (
                                                            <Image
                                                                src={imageUrl}
                                                                alt={banner.banner_alt || banner.banner_name}
                                                                fill
                                                                className="object-cover"
                                                                unoptimized
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <ImageIcon className="w-6 h-6 text-gray-300" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {banner.banner_name}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                                                        {banner.description}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {banner.banner_type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <a
                                                        href={banner.banner_link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-[#d9a88a] hover:underline max-w-xs truncate block"
                                                    >
                                                        {banner.banner_link}
                                                    </a>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${banner.status === 1 || banner.status === '1'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {banner.status === 1 || banner.status === '1' ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {new Date(banner.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => router.push(`/dashboard/banners/edit/${banner._id}`)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Edit banner"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(banner)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete banner"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <ConfirmationModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={confirmDelete}
                    title="Delete Banner"
                    message={`Are you sure you want to delete the banner "${bannerToDelete?.banner_name}"? This action cannot be undone.`}
                    confirmText="Delete Banner"
                    type="danger"
                />
            </Container>
        </RoleGuard>
    );
}
