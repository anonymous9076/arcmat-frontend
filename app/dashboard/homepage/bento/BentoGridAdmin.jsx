'use client';

import React, { useState } from 'react';
import { useGetBentoItems, useUpdateBentoItem, useCreateBentoItem, useDeleteBentoItem } from '@/hooks/useBento';
import Image from 'next/image';
import { Edit, Trash2, Plus, Image as ImageIcon, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { toast } from '@/components/ui/Toast';

export default function BentoGridAdmin() {
    const { data: bentoItems, isLoading, error } = useGetBentoItems();
    const updateBentoMutation = useUpdateBentoItem();
    const createBentoMutation = useCreateBentoItem();
    const deleteBentoMutation = useDeleteBentoItem();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deleteModalItem, setDeleteModalItem] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        link: '',
        image: null,
        previewImage: null
    });

    if (isLoading) {
        return (
            <div className="py-8 flex justify-center items-center h-40">
                <Loader2 className="animate-spin text-[#d9a88a] w-8 h-8" />
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 py-4">Failed to load Bento Grid.</div>;
    }

    const handleEditClick = (item) => {
        setEditingItem(item);
        setFormData({
            title: item.title || '',
            subtitle: item.subtitle || '',
            link: item.link || '',
            image: null,
            previewImage: item.image?.url || item.image?.secure_url || null
        });
    };

    const handleCreateClick = () => {
        setIsCreateModalOpen(true);
        setFormData({
            title: '',
            subtitle: '',
            link: '',
            image: null,
            previewImage: null
        });
    };

    const handleDeleteClick = (item) => {
        setDeleteModalItem(item);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image file is too large");
                e.target.value = '';
                return;
            }
            setFormData(prev => ({
                ...prev,
                image: file,
                previewImage: URL.createObjectURL(file)
            }));
        }
    };

    const handleSave = async () => {
        if (formData.title && formData.title.length > 50) {
            toast.error("Title is too long. Please keep it under 50 characters.");
            return;
        }
        if (formData.subtitle && formData.subtitle.length > 120) {
            toast.error("Subtitle is too long. Please keep it under 120 characters.");
            return;
        }

        const submitData = new FormData();
        submitData.append('title', formData.title);
        submitData.append('subtitle', formData.subtitle);
        submitData.append('link', formData.link);
        if (formData.image) {
            submitData.append('image', formData.image);
        }

        try {
            if (editingItem) {
                await updateBentoMutation.mutateAsync({ id: editingItem._id, formData: submitData });
                setEditingItem(null);
            } else if (isCreateModalOpen) {
                await createBentoMutation.mutateAsync(submitData);
                setIsCreateModalOpen(false);
            }
        } catch (err) {
        }
    };

    const confirmDelete = async () => {
        if (!deleteModalItem) return;
        try {
            await deleteBentoMutation.mutateAsync(deleteModalItem._id);
        } catch (err) {
        } finally {
            setDeleteModalItem(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end mb-4">
                <Button onClick={handleCreateClick} className="py-1 px-2 flex items-center bg-[#d9a88a] hover:bg-white hover:text-[#d9a88a] border border-[#d9a88a] text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Bento Item
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(bentoItems || []).map((item, index) => (
                    <div key={item._id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm relative group">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-gray-900">Grid Item {index + 1}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleEditClick(item)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit Item"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDeleteClick(item)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete Item"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden mb-4">
                            {(item.image?.url || item.image?.secure_url) ? (
                                <Image src={item.image.url || item.image.secure_url} alt={`Bento ${item.order}`} fill className="object-cover" unoptimized />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <ImageIcon className="w-8 h-8 text-gray-300" />
                                </div>
                            )}
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-gray-800 break-all">{item.title || 'No Title'}</p>
                            <p className="text-xs text-gray-500 break-all">{item.subtitle || 'No Subtitle'}</p>
                            <a href={item.link || '#'} className="text-xs text-[#d9a88a] mt-2 block break-all hover:underline" target="_blank" rel="noreferrer">
                                {item.link || 'No Link'}
                            </a>
                        </div>
                    </div>
                ))}
            </div>

            {(editingItem || isCreateModalOpen) && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingItem
                                    ? `Edit Grid Item ${(bentoItems || []).findIndex(i => i._id === editingItem._id) + 1}`
                                    : 'Add New Grid Item'}
                            </h2>
                            <button onClick={() => { setEditingItem(null); setIsCreateModalOpen(false); }} className="text-gray-400 hover:text-gray-600">
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#d9a88a] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                                <input
                                    type="text"
                                    value={formData.subtitle}
                                    onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#d9a88a] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
                                <input
                                    type="text"
                                    value={formData.link}
                                    onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#d9a88a] focus:outline-none"
                                    placeholder="https://..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-24 h-24 border border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 relative flex items-center justify-center">
                                        {formData.previewImage ? (
                                            <Image src={formData.previewImage} alt="Preview" fill className="object-cover" unoptimized />
                                        ) : (
                                            <ImageIcon className="w-8 h-8 text-gray-300" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <input type="file" accept="image/*" onChange={handleImageChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-[#d9a88a] hover:file:bg-orange-100 cursor-pointer" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 ">
                            <Button variant="outline" className="cursor-pointer hover:text-red-500" onClick={() => { setEditingItem(null); setIsCreateModalOpen(false); }}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                className="bg-[#d9a88a] hover:bg-white hover:text-[#d9a88a] border border-[#d9a88a] p-2 text-white cursor-pointer flex items-center justify-center"
                                disabled={updateBentoMutation.isPending || createBentoMutation.isPending}
                            >
                                {(updateBentoMutation.isPending || createBentoMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin mr-2 flex-shrink-0" /> : null}
                                <span>{editingItem ? 'Save Changes' : 'Create Item'}</span>
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={!!deleteModalItem}
                onClose={() => setDeleteModalItem(null)}
                onConfirm={confirmDelete}
                title="Delete Item?"
                message="Are you sure you want to delete this Bento Item? This action cannot be undone."
                confirmText={deleteBentoMutation.isPending ? "Deleting..." : "Delete"}
            />
        </div>
    );
}
