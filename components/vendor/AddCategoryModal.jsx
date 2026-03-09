'use client';

import React, { useState, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import clsx from 'clsx';
import { generateSlug } from '@/lib/productUtils';

export default function AddCategoryModal({ isOpen, onClose, onAdd, existingCategories = [] }) {
    const [step, setStep] = useState(1); // 1: Root, 2: Level 2, 3: Level 3
    const [parentIds, setParentIds] = useState({ level1: null, level2: null });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [selectedExistingId, setSelectedExistingId] = useState('');
    const [useExisting, setUseExisting] = useState(false);

    const [categoryData, setCategoryData] = useState({
        category_name: '',
        category_url: '',
        editor: '',
        meta_title: '',
        meta_description: '',
        meta_keywords: '',
        status: 'Active',
        category_image: null,
        showcase: []
    });
    const [previewImage, setPreviewImage] = useState(null);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setParentIds({ level1: null, level2: null });
            resetForm();
            setUseExisting(false);
            setSelectedExistingId('');
        }
    }, [isOpen]);

    useEffect(() => {
        setUseExisting(false);
        setSelectedExistingId('');
        resetForm();
    }, [step]);

    useEffect(() => {
        if (categoryData.category_name) {
            setCategoryData(prev => ({ ...prev, category_url: generateSlug(categoryData.category_name) }));
        }
    }, [categoryData.category_name]);

    const resetForm = () => {
        setCategoryData({
            category_name: '',
            category_url: '',
            editor: '',
            meta_title: '',
            meta_description: '',
            meta_keywords: '',
            status: 'Active',
            category_image: null,
            showcase: []
        });
        setPreviewImage(null);
        setErrors({});
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCategoryData(prev => ({ ...prev, category_image: file }));
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!categoryData.category_name.trim()) newErrors.category_name = 'Category name is required';
        if (!categoryData.category_url.trim()) newErrors.category_url = 'Category URL is required';
        if (!categoryData.editor.trim()) newErrors.editor = 'Description is required';
        if (!categoryData.status) newErrors.status = 'Status is required';

        if (Object.keys(newErrors).length > 0) {
            toast.error("Please fill in all required fields marked with *");
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e, keepOpen = false) => {
        if (e) e.preventDefault();

        // If reusing existing category
        if (useExisting && selectedExistingId) {
            if (step === 1) {
                toast.info("Selected existing root category");
                setParentIds(prev => ({ ...prev, level1: selectedExistingId }));
                setStep(2);
                return;
            } else if (step === 2) {
                toast.info("Selected existing sub-category");
                setParentIds(prev => ({ ...prev, level2: selectedExistingId }));
                setStep(3);
                return;
            }
        }

        if (!validate()) return;
        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('category_name', categoryData.category_name);
            formData.append('category_url', categoryData.category_url);
            formData.append('editor', categoryData.editor);

            // Optional fields
            if (categoryData.meta_title) formData.append('meta_title', categoryData.meta_title);
            if (categoryData.meta_description) formData.append('meta_description', categoryData.meta_description);
            if (categoryData.meta_keywords) formData.append('meta_keywords', categoryData.meta_keywords);

            formData.append('status', categoryData.status);

            if (step === 1 && categoryData.showcase?.length > 0) {
                categoryData.showcase.forEach(val => formData.append('showcase[]', val));
            }

            // Determine parent based on step
            let currentParentId = '';
            if (step === 2) currentParentId = parentIds.level1;
            if (step === 3) currentParentId = parentIds.level2;

            if (currentParentId) {
                formData.append('parent_category', currentParentId);
            }

            if (categoryData.category_image) {
                formData.append('category_image', categoryData.category_image);
            }

            // Call API and get new ID
            const newId = await onAdd(formData);

            if (step === 1) {
                toast.success(`Root category "${categoryData.category_name}" created!`);
                setParentIds(prev => ({ ...prev, level1: newId }));
                setStep(2);
                resetForm();
            } else if (step === 2) {
                if (keepOpen) {
                    toast.success(`Sub-category "${categoryData.category_name}" added!`);
                    resetForm();
                    // Stay on Step 2, keep level1 parent
                } else {
                    toast.success(`Sub-category "${categoryData.category_name}" created!`);
                    setParentIds(prev => ({ ...prev, level2: newId }));
                    setStep(3);
                    resetForm();
                }
            } else {
                // Step 3
                if (keepOpen) {
                    toast.success(`Leaf category "${categoryData.category_name}" added!`);
                    resetForm();
                    // Stay on step 3, parentIds remain invalid
                } else {
                    toast.success("Categorization complete!");
                    onClose();
                }
            }
        } catch (error) {
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const getStepTitle = () => {
        switch (step) {
            case 1: return "Step 1: Create or Select Root Category (Level 1)";
            case 2: return "Step 2: Create or Select Sub-Category (Level 2)";
            case 3: return "Step 3: Create Sub-Sub-Category (Level 3)";
            default: return "";
        }
    };

    const getButtonText = () => {
        if (isSubmitting) return "Saving...";
        if (useExisting) return "Next Step";
        switch (step) {
            case 1: return "Create & Proceed to Level 2";
            case 2: return "Create & Proceed to Level 3";
            case 3: return "Finish & Close";
            default: return "Save";
        }
    };

    // Filter available existing categories for selection
    const availableCategories = existingCategories.filter(cat => {
        if (step === 1) return cat.level === 1;
        if (step === 2) return cat.level === 2 && cat.parentId === parentIds.level1; // Ensure it belongs to selected parent
        return false;
    });

    return (
        <div className="fixed inset-0 z-101 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{getStepTitle()}</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {step === 1 && "Start by creating or selecting the main parent category."}
                            {step === 2 && "Now create or select the child category under the root."}
                            {step === 3 && "Finally, create the sub-child category."}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-100 h-1.5">
                    <div
                        className="bg-[#d9a88a] h-1.5 transition-all duration-300 ease-in-out"
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Select Existing Option (Only for Step 1 & 2) */}
                    {step < 3 && availableCategories.length > 0 && (
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <input
                                    type="checkbox"
                                    id="useExisting"
                                    checked={useExisting}
                                    onChange={(e) => setUseExisting(e.target.checked)}
                                    className="w-4 h-4 text-[#d9a88a] rounded border-gray-300 focus:ring-[#d9a88a]"
                                />
                                <label htmlFor="useExisting" className="text-sm font-medium text-gray-900 cursor-pointer">
                                    Select an existing category instead of creating new
                                </label>
                            </div>

                            {useExisting && (
                                <select
                                    value={selectedExistingId}
                                    onChange={(e) => setSelectedExistingId(e.target.value)}
                                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d9a88a]"
                                >
                                    <option value="">-- Select Category --</option>
                                    {availableCategories.map(cat => (
                                        <option key={cat.categoryId} value={cat.categoryId}>{cat.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}

                    {/* Creation Form (Disabled if selecting existing) */}
                    <div className={clsx("space-y-8 transition-opacity", useExisting ? "opacity-40 pointer-events-none filter blur-sm" : "opacity-100")}>
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Basic Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-800 mb-2">Category Name *</label>
                                    <input
                                        type="text"
                                        value={categoryData.category_name}
                                        onChange={(e) => setCategoryData(prev => ({ ...prev, category_name: e.target.value }))}
                                        className={clsx(
                                            "w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d9a88a] text-gray-900",
                                            errors.category_name ? "border-red-500" : "border-gray-300"
                                        )}
                                        placeholder="e.g. Luxury Furniture"
                                    />
                                    {errors.category_name && <p className="mt-1 text-xs text-red-500">{errors.category_name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-800 mb-2">Category URL *</label>
                                    <input
                                        type="text"
                                        value={categoryData.category_url}
                                        onChange={(e) => setCategoryData(prev => ({ ...prev, category_url: e.target.value }))}
                                        className={clsx(
                                            "w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d9a88a] text-gray-900 bg-gray-50",
                                            errors.category_url ? "border-red-500" : "border-gray-300"
                                        )}
                                        placeholder="e.g. luxury-furniture"
                                    />
                                    {errors.category_url && <p className="mt-1 text-xs text-red-500">{errors.category_url}</p>}
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-800 mb-2">Description *</label>
                                    <textarea
                                        value={categoryData.editor}
                                        onChange={(e) => setCategoryData(prev => ({ ...prev, editor: e.target.value }))}
                                        className={clsx(
                                            "w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d9a88a] text-gray-900 min-h-[100px]",
                                            errors.editor ? "border-red-500" : "border-gray-300"
                                        )}
                                        placeholder="Enter category description..."
                                    />
                                    {errors.editor && <p className="mt-1 text-xs text-red-500">{errors.editor}</p>}
                                </div>
                            </div>
                        </div>

                        {/* SEO Information - OPTIONAL */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">SEO Settings (Optional)</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-800 mb-2">Meta Title</label>
                                    <input
                                        type="text"
                                        value={categoryData.meta_title}
                                        onChange={(e) => setCategoryData(prev => ({ ...prev, meta_title: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d9a88a] text-gray-900"
                                        placeholder="SEO Title"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-800 mb-2">Meta Keywords</label>
                                    <input
                                        type="text"
                                        value={categoryData.meta_keywords}
                                        onChange={(e) => setCategoryData(prev => ({ ...prev, meta_keywords: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d9a88a] text-gray-900"
                                        placeholder="keyword1, keyword2, keyword3"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-800 mb-2">Meta Description</label>
                                    <textarea
                                        value={categoryData.meta_description}
                                        onChange={(e) => setCategoryData(prev => ({ ...prev, meta_description: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d9a88a] text-gray-900 min-h-[80px]"
                                        placeholder="SEO Description"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Image & Status */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Media & Status</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-800 mb-2">Status *</label>
                                    <select
                                        value={categoryData.status}
                                        onChange={(e) => setCategoryData(prev => ({ ...prev, status: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d9a88a] text-gray-900"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-800 mb-2">Category Image (Optional)</label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors relative">
                                        <input
                                            type="file"
                                            onChange={handleImageChange}
                                            accept="image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        {previewImage ? (
                                            <div className="relative h-32 w-full">
                                                <img
                                                    src={previewImage}
                                                    alt="Preview"
                                                    className="h-full w-full object-contain mx-auto"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity text-white font-medium">
                                                    Change Image
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-4">
                                                <div className="bg-gray-100 p-3 rounded-full mb-2">
                                                    <ImageIcon className="w-6 h-6 text-gray-500" />
                                                </div>
                                                <span className="text-sm text-gray-500">Click to upload image</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Showcase Settings - ONLY for Level 1 */}
                        {step === 1 && (
                            <div className="space-y-4 pt-4 border-t border-gray-50">
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Showcase Optimization</h3>
                                <p className="text-xs text-gray-500 font-medium">Select where this category should be highlighted on the platform.</p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {['Header', 'Gallery', 'Carousel'].map((loc) => (
                                        <label
                                            key={loc}
                                            className={clsx(
                                                "flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer group",
                                                categoryData.showcase.includes(loc)
                                                    ? "border-[#d9a88a] bg-orange-50/30"
                                                    : "border-gray-100 hover:border-gray-200"
                                            )}
                                        >
                                            <div className={clsx(
                                                "w-5 h-5 rounded flex items-center justify-center border-2 transition-colors",
                                                categoryData.showcase.includes(loc)
                                                    ? "bg-[#d9a88a] border-[#d9a88a]"
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
                                                categoryData.showcase.includes(loc) ? "text-[#d9a88a]" : "text-gray-500"
                                            )}>{loc}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
                    <Button variant="outline" onClick={onClose} className="px-6 rounded-lg">Cancel</Button>

                    {/* Add Another Button - Step 2 & 3 */}
                    {(step === 2 || step === 3) && (
                        <Button
                            variant="outline"
                            onClick={(e) => handleSubmit(e, true)}
                            disabled={isSubmitting}
                            className="px-6 rounded-lg text-[#d9a88a] border-[#d9a88a] hover:bg-[#d9a88a]/10"
                        >
                            Save & Add Another
                        </Button>
                    )}

                    <Button
                        onClick={(e) => handleSubmit(e, false)}
                        disabled={isSubmitting || (useExisting && !selectedExistingId)}
                        text={getButtonText()}
                        className="bg-black text-white hover:bg-zinc-800 px-8 rounded-3xl py-2 flex items-center gap-2"
                    >

                        {!isSubmitting && step < 3 && <span className="text-xs opacity-70">→</span>}
                    </Button>
                </div>
            </div>
        </div>
    );
}
