'use client';

import { useState, useEffect } from 'react';
import { useCreateVariant, useUpdateVariant } from '@/hooks/useVariant';
import { toast } from '@/components/ui/Toast';
import { X, Upload, Save, Info, Settings, Tag, Image as ImageIcon, ChevronDown } from 'lucide-react';
import Button from '@/components/ui/Button';
import clsx from 'clsx';
import { getVariantImageUrl, generateSlug, formatSKU } from '@/lib/productUtils';
import { useGetAttributes } from '@/hooks/useAttribute';

export default function AddVariantModal({ isOpen, onClose, productId, parentProduct, editingVariant = null }) {
    const [activeTab, setActiveTab] = useState('basic');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        product_name: '',
        product_url: '',
        description: '',
        meta_title: '',
        meta_keywords: '',
        meta_description: '',
        mrp_price: '',
        selling_price: '',
        stock: '',
        skucode: '',
        weight: '',
        weight_type: 'ml',
        status: 'Active',
        brand: '',
        newarrivedproduct: 'Inactive',
        trendingproduct: 'Inactive',
        featuredproduct: 'Inactive',
    });

    const [existingImages, setExistingImages] = useState([]); // Array of server filenames
    const [newImages, setNewImages] = useState([]); // Array of File objects
    const [previewImages, setPreviewImages] = useState([]); // Combined previews

    const createVariantMutation = useCreateVariant(productId);
    const updateVariantMutation = useUpdateVariant(productId);
    const { data: allAttributesResponse } = useGetAttributes();
    const allAttributes = allAttributesResponse?.data || [];

    useEffect(() => {
        if (editingVariant) {
            setFormData({
                product_name: editingVariant.product_name || '',
                product_url: editingVariant.product_url || '',
                description: editingVariant.description || '',
                meta_title: editingVariant.meta_title || '',
                meta_keywords: editingVariant.meta_keywords || '',
                meta_description: editingVariant.meta_description || '',
                mrp_price: editingVariant.mrp_price || '',
                selling_price: editingVariant.selling_price || '',
                stock: editingVariant.stock || '',
                skucode: editingVariant.skucode || '',
                weight: editingVariant.weight || '',
                weight_type: editingVariant.weight_type || 'ml',
                status: editingVariant.status || 'Active',
                brand: editingVariant.brand || '',
                newarrivedproduct: editingVariant.newarrivedproduct || 'Inactive',
                trendingproduct: editingVariant.trendingproduct || 'Inactive',
                featuredproduct: editingVariant.featuredproduct || 'Inactive',
            });

            // Handle previews for editing
            if (editingVariant) {
                const serverImages = editingVariant.variant_images && editingVariant.variant_images.length > 0
                    ? editingVariant.variant_images
                    : [
                        editingVariant.product_image1,
                        editingVariant.product_image2,
                        editingVariant.product_image3,
                        editingVariant.product_image4
                    ].filter(Boolean);

                setExistingImages(serverImages);
                const serverPreviews = serverImages.map(getVariantImageUrl);
                setPreviewImages(serverPreviews);
            }
        } else if (parentProduct) {
            // Auto-fill from parent
            setFormData(prev => ({
                ...prev,
                product_name: parentProduct.product_name + ' - ',
                description: parentProduct.description || '',
                meta_title: parentProduct.meta_title || '',
                meta_keywords: parentProduct.meta_keywords || '',
                meta_description: parentProduct.meta_description || '',
                brand: parentProduct.brand || '',
            }));
        }
    }, [editingVariant, parentProduct, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const next = { ...prev, [name]: name === 'skucode' ? formatSKU(value) : value };
            if (name === 'product_name' && !editingVariant) {
                next.product_url = generateSlug(value);
            }
            return next;
        });
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setNewImages(prev => [...prev, ...files]);
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setPreviewImages(prev => [...prev, ...newPreviews]);
            toast.success(`${files.length} image(s) added`);
        }
    };

    const removeImage = (index) => {
        setPreviewImages(prev => prev.filter((_, i) => i !== index));
        if (index < existingImages.length) {
            setExistingImages(prev => prev.filter((_, i) => i !== index));
        } else {
            const newIdx = index - existingImages.length;
            setNewImages(prev => prev.filter((_, i) => i !== newIdx));
        }
        toast.info("Image removed");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const submissionData = new FormData();

            // Append ID and static fields
            submissionData.append('productId', productId);
            Object.keys(formData).forEach(key => {
                submissionData.append(key, formData[key]);
            });


            // Append Images logic
            if (editingVariant) {
                submissionData.append('existingImages', JSON.stringify(existingImages));
            }
            newImages.forEach(image => {
                submissionData.append('product_images', image);
            });

            if (editingVariant) {
                await updateVariantMutation.mutateAsync({ id: editingVariant._id || editingVariant.id, data: submissionData });
                toast.success('Variant updated successfully');
            } else {
                await createVariantMutation.mutateAsync(submissionData);
                toast.success('Variant created successfully');
            }
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save variant');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const tabs = [
        { id: 'basic', label: 'Basic Info', icon: Info },
        { id: 'pricing', label: 'Pricing & Stock', icon: Tag },
        { id: 'attributes', label: 'Attributes', icon: Settings },
        { id: 'media', label: 'Media & SEO', icon: ImageIcon },
    ];

    return (
        <div className="fixed inset-0 z-300 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {editingVariant ? 'Edit Variant' : 'Add New Variant'}
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">Parent: {parentProduct?.product_name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={clsx(
                                "flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all whitespace-nowrap",
                                activeTab === tab.id
                                    ? "text-[#e09a74] border-b-2 border-[#e09a74] bg-orange-50/30"
                                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                    {activeTab === 'basic' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Variant Name *</label>
                                    <input
                                        name="product_name"
                                        value={formData.product_name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#e09a74] transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Variant URL Slug *</label>
                                    <input
                                        name="product_url"
                                        value={formData.product_url}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#e09a74] transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#e09a74]"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Full Description (Editor)</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={4}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#e09a74]"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'pricing' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">MRP Price *</label>
                                    <input
                                        name="mrp_price"
                                        type="number"
                                        value={formData.mrp_price}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#e09a74]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Selling Price *</label>
                                    <input
                                        name="selling_price"
                                        type="number"
                                        value={formData.selling_price}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#e09a74]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Stock Inventory *</label>
                                    <input
                                        name="stock"
                                        type="number"
                                        min="0"
                                        value={formData.stock}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#e09a74]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">SKU Code *</label>
                                    <input
                                        name="skucode"
                                        value={formData.skucode}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#e09a74]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Weight</label>
                                    <div className="flex gap-2">
                                        <input
                                            name="weight"
                                            type="number"
                                            value={formData.weight}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#e09a74]"
                                        />
                                        <select
                                            name="weight_type"
                                            value={formData.weight_type}
                                            onChange={handleChange}
                                            className="w-24 rounded-xl border border-gray-200"
                                        >
                                            <option value="ml">ml</option>
                                            <option value="gm">gm</option>
                                            <option value="kg">kg</option>
                                            <option value="litre">litre</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'attributes' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Brand</label>
                                    {allAttributes.find(a => a.attributeName.toLowerCase() === 'brand') ? (
                                        <div className="relative">
                                            <select
                                                name="brand"
                                                value={formData.brand}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#e09a74] appearance-none bg-white"
                                            >
                                                <option value="">Select Brand</option>
                                                {allAttributes.find(a => a.attributeName.toLowerCase() === 'brand').attributeValues.map(v => (
                                                    <option key={v} value={v}>{v}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        </div>
                                    ) : (
                                        <input
                                            name="brand"
                                            value={formData.brand}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm"
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 mt-8">
                                <h4 className="text-sm font-bold text-orange-900 mb-2">Promotion Flags</h4>
                                <div className="flex flex-wrap gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.newarrivedproduct === 'Active'}
                                            onChange={(e) => setFormData(prev => ({ ...prev, newarrivedproduct: e.target.checked ? 'Active' : 'Inactive' }))}
                                            className="w-4 h-4 rounded text-[#e09a74]"
                                        />
                                        <span className="text-sm text-gray-700 font-medium">New Arrival</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.trendingproduct === 'Active'}
                                            onChange={(e) => setFormData(prev => ({ ...prev, trendingproduct: e.target.checked ? 'Active' : 'Inactive' }))}
                                            className="w-4 h-4 rounded text-[#e09a74]"
                                        />
                                        <span className="text-sm text-gray-700 font-medium">Trending</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.featuredproduct === 'Active'}
                                            onChange={(e) => setFormData(prev => ({ ...prev, featuredproduct: e.target.checked ? 'Active' : 'Inactive' }))}
                                            className="w-4 h-4 rounded text-[#e09a74]"
                                        />
                                        <span className="text-sm text-gray-700 font-medium">Featured</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'media' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <label className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors group">
                                    <Upload className="w-8 h-8 text-gray-300 group-hover:text-[#e09a74] transition-colors" />
                                    <span className="text-xs text-gray-500 font-bold mt-2">Add Images</span>
                                    <input
                                        type="file"
                                        multiple
                                        onChange={handleImageChange}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                </label>

                                {previewImages.map((src, idx) => (
                                    <div key={idx} className="aspect-square rounded-xl border border-gray-100 relative group overflow-hidden bg-gray-50 flex items-center justify-center">
                                        <img src={src} className="w-full h-full object-cover" alt={`Preview ${idx + 1}`} />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-[10px] text-white py-1 px-2 backdrop-blur-sm">
                                            Image {idx + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6 border-t border-gray-100">
                                <h4 className="text-sm font-bold text-gray-900 mb-4">SEO Optimization</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Meta Title</label>
                                        <input
                                            name="meta_title"
                                            value={formData.meta_title}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Meta Keywords</label>
                                        <input
                                            name="meta_keywords"
                                            value={formData.meta_keywords}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Meta Description</label>
                                        <textarea
                                            name="meta_description"
                                            value={formData.meta_description}
                                            onChange={handleChange}
                                            rows={2}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-[#e09a74] text-white px-8 py-2.5 font-bold rounded-xl hover:bg-white hover:text-[#e09a74] hover:border-[#e09a74] border shadow-lg shadow-orange-100 flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {editingVariant ? 'Update Variant' : 'Create Variant'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
