'use client';

import React, { useState, useEffect } from 'react';
import { X, Upload, Check, Loader2, Image as ImageIcon } from 'lucide-react';
import Button from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import clsx from 'clsx';
import { generateSlug, getCategoryImageUrl } from '@/lib/productUtils';
import { useUpdateCategory } from '@/hooks/useCategory';

export default function EditCategoryModal({ isOpen, onClose, category, categories = [] }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const updateCategoryMutation = useUpdateCategory();

    const [categoryData, setCategoryData] = useState({
        category_name: '',
        category_url: '',
        editor: '',
        meta_title: '',
        meta_description: '',
        meta_keywords: '',
        status: 'Active',
        parent_category: '',
        showcase: []
    });
    const [previewImage, setPreviewImage] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen && category) {
            setCategoryData({
                category_name: category.name || '',
                category_url: category.slug || '',
                editor: category.description || '',
                meta_title: category.metatitle || '',
                meta_description: category.metadesc || '',
                meta_keywords: category.meta_keywords || '',
                status: category.isActive === 1 || category.status === 'Active' ? 'Active' : 'Inactive',
                parent_category: category.parentId || '',
                showcase: category.showcase || []
            });

            if (category.image && category.image.secure_url) {
                setPreviewImage(category.image.secure_url);
            } else {
                setPreviewImage(null);
            }
            setSelectedFile(null);
            setErrors({});
        }
    }, [isOpen, category]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!categoryData.category_name.trim()) newErrors.category_name = 'Category name is required';
        if (!categoryData.category_url.trim()) newErrors.category_url = 'Category URL is required';
        if (!categoryData.editor.trim()) newErrors.editor = 'Description is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!validate()) return;
        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('category_name', categoryData.category_name);
            formData.append('category_url', categoryData.category_url);
            formData.append('editor', categoryData.editor);
            formData.append('meta_title', categoryData.meta_title);
            formData.append('meta_description', categoryData.meta_description);
            formData.append('meta_keywords', categoryData.meta_keywords);
            formData.append('status', categoryData.status);

            if (category.level === 1) {
                if (categoryData.showcase?.length > 0) {
                    categoryData.showcase.forEach(val => formData.append('showcase[]', val));
                } else {
                    formData.append('showcase[]', ''); // Ensure backend clears it if empty
                }
            }
            formData.append('parent_category', categoryData.parent_category);

            if (selectedFile) {
                formData.append('category_image', selectedFile);
            }

            await updateCategoryMutation.mutateAsync({ id: category.categoryId, data: formData });
            toast.success("Category updated successfully!");
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update category");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !category) return null;

    // Filter categories for valid parents
    const potentialParents = categories.filter(c => c.categoryId !== category.categoryId && c.level < 3);

    return (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Edit Category</h2>
                        <p className="text-sm text-gray-500 mt-0.5 font-medium">Update category details and classification.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 cursor-pointer">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8">
                    <form id="edit-category-form" onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <h3 className="text-xs font-bold text-[#e09a74] uppercase tracking-widest mb-4">Basic Information</h3>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Category Name *</label>
                                <input
                                    type="text"
                                    value={categoryData.category_name}
                                    onChange={(e) => setCategoryData(prev => ({
                                        ...prev,
                                        category_name: e.target.value,
                                        category_url: generateSlug(e.target.value)
                                    }))}
                                    className={clsx(
                                        "w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-100 text-gray-900 font-medium",
                                        errors.category_name ? "border-red-500" : "border-gray-200"
                                    )}
                                />
                                {errors.category_name && <p className="mt-1 text-xs text-red-500">{errors.category_name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Category URL (Slug) *</label>
                                <input
                                    type="text"
                                    value={categoryData.category_url}
                                    onChange={(e) => setCategoryData(prev => ({ ...prev, category_url: e.target.value }))}
                                    className={clsx(
                                        "w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-100 text-gray-900 font-medium bg-gray-50",
                                        errors.category_url ? "border-red-500" : "border-gray-200"
                                    )}
                                />
                                {errors.category_url && <p className="mt-1 text-xs text-red-500">{errors.category_url}</p>}
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Description *</label>
                                <textarea
                                    value={categoryData.editor}
                                    onChange={(e) => setCategoryData(prev => ({ ...prev, editor: e.target.value }))}
                                    className={clsx(
                                        "w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-100 text-gray-900 font-medium min-h-[120px]",
                                        errors.editor ? "border-red-500" : "border-gray-200"
                                    )}
                                />
                                {errors.editor && <p className="mt-1 text-xs text-red-500">{errors.editor}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
                            <div className="md:col-span-2">
                                <h3 className="text-xs font-bold text-[#e09a74] uppercase tracking-widest mb-4">Classification & Status</h3>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Parent Category</label>
                                <select
                                    value={categoryData.parent_category}
                                    onChange={(e) => setCategoryData(prev => ({ ...prev, parent_category: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-100 text-gray-900 font-medium"
                                >
                                    <option value="">Root Category (None)</option>
                                    {potentialParents.map(p => (
                                        <option key={p.categoryId} value={p.categoryId}>
                                            {p.path}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                                <select
                                    value={categoryData.status}
                                    onChange={(e) => setCategoryData(prev => ({ ...prev, status: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-100 text-gray-900 font-medium"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-50">
                            <h3 className="text-xs font-bold text-[#e09a74] uppercase tracking-widest mb-4">Media</h3>
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                <div className="w-full md:w-1/3">
                                    <div
                                        className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer overflow-hidden relative group"
                                        onClick={() => document.getElementById('category-image-input').click()}
                                    >
                                        <input
                                            id="category-image-input"
                                            type="file"
                                            onChange={handleImageChange}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                        {previewImage ? (
                                            <>
                                                <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity- group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <span className="text-white font-bold text-sm">Change Image</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                <ImageIcon className="w-8 h-8 text-gray-300" />
                                                <span className="text-xs text-gray-400 font-bold uppercase">Click to upload</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <p className="text-sm text-gray-500 font-medium">
                                        Upload a high-quality category image.
                                        Recommended size: 800x800px.
                                    </p>
                                    {selectedFile && (
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-bold animate-in fade-in slide-in-from-left-2">
                                            <Check className="w-3.5 h-3.5" />
                                            {selectedFile.name}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-50">
                            <h3 className="text-xs font-bold text-[#e09a74] uppercase tracking-widest mb-4">SEO Metadata</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Meta Title</label>
                                    <input
                                        type="text"
                                        value={categoryData.meta_title}
                                        onChange={(e) => setCategoryData(prev => ({ ...prev, meta_title: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-100 text-gray-900 font-medium"
                                        placeholder="SEO optimized title"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Meta Keywords</label>
                                    <input
                                        type="text"
                                        value={categoryData.meta_keywords}
                                        onChange={(e) => setCategoryData(prev => ({ ...prev, meta_keywords: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-100 text-gray-900 font-medium"
                                        placeholder="e.g. furniture, design, luxury"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Meta Description</label>
                                    <textarea
                                        value={categoryData.meta_description}
                                        onChange={(e) => setCategoryData(prev => ({ ...prev, meta_description: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-100 text-gray-900 font-medium min-h-[100px]"
                                        placeholder="Strategic summary for search results..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Showcase Settings - ONLY for Level 1 */}
                        {category.level === 1 && (
                            <div className="pt-4 border-t border-gray-50">
                                <h3 className="text-xs font-bold text-[#e09a74] uppercase tracking-widest mb-4">Showcase Optimization</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {['Header', 'Gallery', 'Carousel'].map((loc) => (
                                        <label
                                            key={loc}
                                            className={clsx(
                                                "flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer group",
                                                categoryData.showcase.includes(loc)
                                                    ? "border-[#e09a74] bg-orange-50/30"
                                                    : "border-gray-50 hover:border-gray-100"
                                            )}
                                        >
                                            <div className={clsx(
                                                "w-5 h-5 rounded flex items-center justify-center border-2 transition-colors",
                                                categoryData.showcase.includes(loc)
                                                    ? "bg-[#e09a74] border-[#e09a74]"
                                                    : "border-gray-200 group-hover:border-gray-300"
                                            )}>
                                                {categoryData.showcase.includes(loc) && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={categoryData.showcase.includes(loc)}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    setCategoryData(prev => ({
                                                        ...prev,
                                                        showcase: checked
                                                            ? [...prev.showcase, loc]
                                                            : prev.showcase.filter(s => s !== loc)
                                                    }));
                                                }}
                                            />
                                            <span className={clsx(
                                                "text-sm font-bold uppercase tracking-wider",
                                                categoryData.showcase.includes(loc) ? "text-[#e09a74]" : "text-gray-500"
                                            )}>{loc}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="px-6 rounded-xl border-gray-200 text-gray-600 font-bold"
                    >
                        Discard Changes
                    </Button>
                    <Button
                        form="edit-category-form"
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-black text-white hover:bg-zinc-800 px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-all min-w-[160px] justify-center"
                    >
                        {isSubmitting ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</>
                        ) : (
                            'Update Category'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
