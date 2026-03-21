'use client';

import React, { useState, useEffect } from 'react';
import { useCreateVariant, useUpdateVariant } from '@/hooks/useVariant';
import { toast } from '@/components/ui/Toast';
import { Upload, X, Save, Plus, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import clsx from 'clsx';
import { getVariantImageUrl, formatSKU } from '@/lib/productUtils';
import { useGetAttributes } from '@/hooks/useAttribute';

export default function VariantForm({ productId, vendorId, onComplete, editingVariant = null, onCancel }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        weight_type: 'kg',
        weight: '',
        stock: '',
        skucode: '',
        mrp_price: '',
        selling_price: '',
        product_name: '',
    });

    const [attributes, setAttributes] = useState([{ key: '', value: '' }]);
    const [existingImages, setExistingImages] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const [previewImages, setPreviewImages] = useState([]);

    const { data: allAttributesResponse } = useGetAttributes();
    const allAttributes = allAttributesResponse?.data || [];

    const createVariantMutation = useCreateVariant(productId);
    const variantId = editingVariant?._id || editingVariant?.id;
    const updateVariantMutation = useUpdateVariant(productId, variantId);

    useEffect(() => {
        if (editingVariant) {
            setFormData({
                weight_type: editingVariant.weight_type || 'kg',
                weight: editingVariant.weight || '',
                stock: (editingVariant.stock !== undefined && editingVariant.stock !== null) ? editingVariant.stock.toString() : '',
                skucode: editingVariant.skucode || '',
                mrp_price: editingVariant.mrp_price || '',
                selling_price: editingVariant.selling_price || '',
                product_name: editingVariant.product_name || '',
            });

            if (editingVariant.dynamicAttributes && editingVariant.dynamicAttributes.length > 0) {
                setAttributes(editingVariant.dynamicAttributes);
            } else {
                const legacyAttrs = [];
                if (editingVariant.brand) legacyAttrs.push({ key: 'Brand', value: editingVariant.brand });
                setAttributes(legacyAttrs.length > 0 ? legacyAttrs : [{ key: '', value: '' }]);
            }

            const imgs = editingVariant.variant_images && editingVariant.variant_images.length > 0
                ? editingVariant.variant_images
                : [
                    editingVariant.product_image1,
                    editingVariant.product_image2,
                    editingVariant.product_image3,
                    editingVariant.product_image4
                ].filter(Boolean);

            setExistingImages(imgs);

            const previews = imgs.map(getVariantImageUrl);
            setPreviewImages(previews);
        } else {
            setFormData({
                weight_type: 'kg',
                weight: '',
                stock: '',
                skucode: '',
                mrp_price: '',
                selling_price: '',
                product_name: '',
            });
            setAttributes([{ key: '', value: '' }]);
            setExistingImages([]);
            setNewImages([]);
            setPreviewImages([]);
        }
    }, [editingVariant]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'skucode' ? formatSKU(value) : value
        }));
    };

    const handleAttributeChange = (index, field, value) => {
        const updated = [...attributes];
        updated[index][field] = value;
        setAttributes(updated);
    };

    const addAttribute = () => setAttributes([...attributes, { key: '', value: '' }]);
    const removeAttribute = (index) => setAttributes(attributes.filter((_, i) => i !== index));

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setNewImages(prev => [...prev, ...files]);
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setPreviewImages(prev => [...prev, ...newPreviews]);
        }
    };

    const removeImage = (indexToRemove) => {
        if (indexToRemove < existingImages.length) {
            setExistingImages(prev => prev.filter((_, i) => i !== indexToRemove));
            setPreviewImages(prev => prev.filter((_, i) => i !== indexToRemove));
        } else {
            const newImageIndex = indexToRemove - existingImages.length;
            setNewImages(prev => prev.filter((_, i) => i !== newImageIndex));
            setPreviewImages(prev => prev.filter((_, i) => i !== indexToRemove));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate productId is present
        if (!productId) {
            toast.error("Product ID is required for variant upload. Please try creating the product again.");
            return;
        }


        if (newImages.length === 0 && existingImages.length === 0) {
            toast.error("At least one variant image is required");
            return;
        }

        setIsSubmitting(true);
        try {
            const submissionData = new FormData();
            submissionData.append('productId', productId);

            Object.keys(formData).forEach(key => {
                submissionData.append(key, formData[key]);
            });

            const validAttributes = attributes.filter(a => a.key && a.value);
            if (validAttributes.length > 0) {
                submissionData.append('dynamicAttributes', JSON.stringify(validAttributes));
            }

            if (editingVariant) {
                submissionData.append('existingImages', JSON.stringify(existingImages));
            }

            newImages.forEach(image => {
                submissionData.append('variant_images', image);
            });

            for (let pair of submissionData.entries()) {
            }

            if (editingVariant) {
                await updateVariantMutation.mutateAsync({ id: variantId, data: submissionData });
                toast.success('Variant updated successfully!');
            } else {
                await createVariantMutation.mutateAsync(submissionData);
                toast.success('Variant created successfully!');
            }

            if (onComplete) onComplete();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save variant');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-900">{editingVariant ? 'Edit Variant Details' : 'Variant Details'}</h2>
                <p className="text-gray-500 mt-1">Add pricing, stock and variation details for this product.</p>
                <p className="text-xs font-mono text-gray-400 mt-2">Product ID: {productId}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">MRP Price *</label>
                        <input
                            name="mrp_price"
                            type="number"
                            value={formData.mrp_price}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#e09a74] transition-all"
                            placeholder="0.00"
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
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#e09a74] transition-all"
                            placeholder="0.00"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Stock (optional)</label>
                        <input
                            name="stock"
                            type="number"
                            min="0"
                            value={formData.stock}
                            onChange={handleChange}
                            onInput={(e) => {
                                if (e.target.value.length > 1 && e.target.value.startsWith('0')) {
                                    e.target.value = e.target.value.replace(/^0+/, '');
                                }
                            }}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#e09a74] transition-all"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2">SKU Code *</label>
                        <input
                            name="skucode"
                            value={formData.skucode}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#e09a74] transition-all"
                            placeholder="e.g. CHAIR-WOOD-RED"
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
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#e09a74] flex-1"
                                placeholder="Value"
                            />
                            <select
                                name="weight_type"
                                value={['kg', 'gm', 'ml', 'litre', 'mm', 'cm', 'm', 'inch', 'ft', 'sqft', 'nos'].includes(formData.weight_type) ? formData.weight_type : 'CUSTOM_UNIT'}
                                onChange={(e) => {
                                    if (e.target.value === 'CUSTOM_UNIT') {
                                        setFormData(prev => ({ ...prev, weight_type: 'unit' }));
                                    } else {
                                        handleChange(e);
                                    }
                                }}
                                className="w-28 rounded-xl border border-gray-200 bg-gray-50 text-xs px-2"
                            >
                                <option value="kg">kg</option>
                                <option value="gm">gm</option>
                                <option value="ml">ml</option>
                                <option value="litre">litre</option>
                                <option value="mm">mm</option>
                                <option value="cm">cm</option>
                                <option value="m">m</option>
                                <option value="inch">inch</option>
                                <option value="ft">ft</option>
                                <option value="sqft">sqft</option>
                                <option value="nos">nos</option>
                                <option value="CUSTOM_UNIT">Other...</option>
                            </select>
                        </div>
                        {!['kg', 'gm', 'ml', 'litre', 'mm', 'cm', 'm', 'inch', 'ft', 'sqft', 'nos'].includes(formData.weight_type) && (
                            <input
                                name="weight_type"
                                value={formData.weight_type}
                                onChange={handleChange}
                                className="w-full mt-2 px-4 py-2 rounded-lg border border-gray-100 bg-orange-50/30 focus:ring-1 focus:ring-[#e09a74] text-xs"
                                placeholder="Enter custom unit (e.g. gauge, ply)"
                            />
                        )}
                    </div>
                </div>

                <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Attributes</h3>
                        <button type="button" onClick={addAttribute} className="text-[#e09a74] hover:text-[#d08963] text-sm font-bold flex items-center gap-1">
                            <Plus className="w-4 h-4" /> Add Attribute
                        </button>
                    </div>
                    <div className="space-y-3">
                        {attributes.map((attr, idx) => {
                            const selectedAttr = allAttributes.find(a => a.attributeName === attr.key);
                            const availableValues = selectedAttr?.attributeValues || [];

                            const otherSelectedKeys = attributes
                                .filter((_, i) => i !== idx)
                                .map(a => a.key)
                                .filter(Boolean);

                            return (
                                <div key={idx} className="space-y-2 pb-2 border-b border-gray-50 last:border-0">
                                    <div className="flex gap-3 items-center">
                                        <div className="flex-1 flex flex-col gap-1">
                                            <select
                                                value={allAttributes.some(a => a.attributeName === attr.key) ? attr.key : (attr.key === '' ? '' : 'CUSTOM_KEY')}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === 'CUSTOM_KEY') {
                                                        handleAttributeChange(idx, 'key', ''); 
                                                    } else {
                                                        handleAttributeChange(idx, 'key', val);
                                                        handleAttributeChange(idx, 'value', ''); 
                                                    }
                                                }}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-100 bg-gray-50/50 focus:ring-2 focus:ring-[#e09a74] text-sm appearance-none"
                                            >
                                                <option value="">Select Attribute</option>
                                                {allAttributes
                                                    .filter(a => !otherSelectedKeys.includes(a.attributeName))
                                                    .map(a => (
                                                        <option key={a._id} value={a.attributeName}>{a.attributeName}</option>
                                                    ))}
                                                <option value="CUSTOM_KEY">+ Custom Attribute</option>
                                            </select>
                                            
                                            {(!allAttributes.some(a => a.attributeName === attr.key) && attr.key !== 'CUSTOM_KEY') && (
                                                <input
                                                    placeholder="Attribute name (e.g. Thickness)"
                                                    value={attr.key}
                                                    onChange={(e) => handleAttributeChange(idx, 'key', e.target.value)}
                                                    className="px-4 py-2 rounded-lg border border-orange-100 bg-orange-50/30 focus:ring-1 focus:ring-[#e09a74] text-sm"
                                                />
                                            )}
                                        </div>

                                        <div className="flex-1 flex flex-col gap-1">
                                            <select
                                                value={availableValues.includes(attr.value) ? attr.value : (attr.value === '' ? '' : 'CUSTOM_VALUE')}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === 'CUSTOM_VALUE') {
                                                        handleAttributeChange(idx, 'value', '');
                                                    } else {
                                                        handleAttributeChange(idx, 'value', val);
                                                    }
                                                }}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-100 bg-gray-50/50 focus:ring-2 focus:ring-[#e09a74] text-sm appearance-none disabled:opacity-50"
                                                disabled={!attr.key}
                                            >
                                                <option value="">Select Value</option>
                                                {availableValues.map(v => (
                                                    <option key={v} value={v}>{v}</option>
                                                ))}
                                                <option value="CUSTOM_VALUE">+ Custom Value</option>
                                            </select>

                                            {(attr.key && !availableValues.includes(attr.value) && attr.value !== 'CUSTOM_VALUE') && (
                                                <input
                                                    placeholder="Enter custom value"
                                                    value={attr.value}
                                                    onChange={(e) => handleAttributeChange(idx, 'value', e.target.value)}
                                                    className="px-4 py-2 rounded-lg border border-orange-100 bg-orange-50/30 focus:ring-1 focus:ring-[#e09a74] text-sm"
                                                />
                                            )}
                                        </div>
                                        
                                        <button type="button" onClick={() => removeAttribute(idx)} className="p-2 text-gray-300 hover:text-red-500 transition-colors shrink-0">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-4 pt-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Variant Images *</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <label className="aspect-square border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all group">
                            <Upload className="w-6 h-6 text-gray-300 group-hover:text-[#e09a74] transition-colors" />
                            <span className="text-[10px] font-bold text-gray-400 mt-2">Upload</span>
                            <input type="file" multiple onChange={handleImageChange} className="hidden" accept="image/*" />
                        </label>
                        {previewImages.map((src, idx) => (
                            <div key={idx} className="aspect-square rounded-2xl border border-gray-100 relative overflow-hidden group">
                                <img src={src} className="w-full h-full object-cover" alt="" />
                                <button
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-8 border-t flex justify-end gap-4">
                    <Button variant="outline" type="button" className="cursor-pointer hover:text-red-500" onClick={() => window.history.back()}>Cancel</Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-[#e09a74] text-white px-10 py-3 font-bold rounded-full hover:bg-white hover:text-[#e09a74] hover:border-[#e09a74] border transition-all cursor-pointer shadow-lg shadow-orange-100"
                    >
                        {isSubmitting ? 'Saving...' : 'Save & Finish'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
