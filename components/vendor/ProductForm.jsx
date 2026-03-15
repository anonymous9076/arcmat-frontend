"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useGetCategories } from '@/hooks/useCategory';
import { useGetAttributes } from '@/hooks/useAttribute';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import { Upload, X, Plus, Trash2, ArrowLeft, Pencil } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import clsx from 'clsx';
import VariantForm from './VariantForm';
import { useGetVariants, useDeleteVariant } from '@/hooks/useVariant';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { generateSlug, getProductImageUrl, getVariantImageUrl, parseAttributes, formatCurrency, formatSKU } from '@/lib/productUtils';
import useAuthStore from '@/store/useAuthStore';
import { useGetBrands } from '@/hooks/useBrand';

const ProductForm = ({ initialData = null, onSubmit, onCancel, isSubmitting, vendorId }) => {
  const { user, activeBrand, selectedBrands } = useAuthStore();
  const { data: categoryData } = useGetCategories();
  const { data: attributeData } = useGetAttributes();
  const { data: brandsData } = useGetBrands();

  const isAdmin = user?.role === 'admin';
  // API may return: array | { data: [...] } | { data: { status, data: [...] } }
  const rawBrands = brandsData?.data;
  const allBrands = Array.isArray(rawBrands)
    ? rawBrands
    : Array.isArray(rawBrands?.data)
      ? rawBrands.data
      : [];
  // selectedBrands from auth store may be ObjectIds or brand objects — normalise to string IDs
  const selectedBrandIds = (selectedBrands || []).map(b =>
    typeof b === 'object' ? (b._id || b.id)?.toString() : b?.toString()
  );
  const userBrands = isAdmin ? allBrands : allBrands.filter(b =>
    selectedBrandIds.includes((b._id || b.id)?.toString())
  );


  const [editingVariant, setEditingVariant] = useState(null);
  const [isVariantFormOpen, setIsVariantFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [variantToDelete, setVariantToDelete] = useState(null);
  const productId = initialData?._id || initialData?.id;
  const { data: variantsData, isLoading: isLoadingVariants } = useGetVariants(productId);
  const deleteVariantMutation = useDeleteVariant(productId);

  const variants = variantsData?.data || [];

  const [formData, setFormData] = useState({
    product_name: '',
    product_url: '',
    description: '',
    skucode: '',
    meta_title: '',
    meta_keywords: '',
    meta_description: '',
    categoryId: '',
    subcategoryId: '',
    subsubcategoryId: '',
    brand: '',
  });

  const [productAttributes, setProductAttributes] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        product_name: initialData.product_name || initialData.name || '',
        product_url: initialData.product_url || initialData.url || '',
        description: initialData.description || '',
        status: initialData.status || (initialData.isActive ? 'Active' : 'Inactive'),
        skucode: initialData.skucode || '',
        meta_title: initialData.meta_title || '',
        meta_keywords: initialData.meta_keywords || '',
        meta_description: initialData.meta_description || '',
        brand: initialData.brand?._id || initialData.brand || '',
      });

      const catId = initialData.categoryId?._id || initialData.categoryId || '';
      const subCatId = initialData.subcategoryId?._id || initialData.subcategoryId || '';
      const subSubCatId = initialData.subsubcategoryId?._id || initialData.subsubcategoryId || '';

      setFormData(prev => ({
        ...prev,
        categoryId: catId,
        subcategoryId: subCatId,
        subsubcategoryId: subSubCatId
      }));

      if (initialData.dynamicAttributes) {
        setProductAttributes(parseAttributes(initialData.dynamicAttributes));
      }

      if (initialData.product_images && initialData.product_images.length > 0) {
        setExistingImages(initialData.product_images);
        const existingPreviews = initialData.product_images.map(getProductImageUrl);
        setPreviewImages(existingPreviews);
        if (!initialData && activeBrand) {
          // activeBrand may be a full object {_id, name,...} or just an id string
          setFormData(prev => ({ ...prev, brand: activeBrand?._id || activeBrand }));
        }
      }
    }
  }, [initialData, activeBrand]);


  // Scroll to top when switching between product and variant forms
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [isVariantFormOpen]);

  const categories = useMemo(() => Array.isArray(categoryData) ? categoryData : (categoryData?.data || []), [categoryData]);
  const l1Categories = useMemo(() => categories.filter(c => c.level === 1), [categories]);
  const l2Categories = useMemo(() => categories.filter(c => c.level === 2 && c.parentId === formData.categoryId), [categories, formData.categoryId]);
  const l3Categories = useMemo(() => categories.filter(c => c.level === 3 && c.parentId === formData.subcategoryId), [categories, formData.subcategoryId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'skucode' ? formatSKU(value) : value
    }));

    if (name === "product_name" && !initialData) {
      setFormData(prev => ({
        ...prev,
        product_url: generateSlug(value)
      }));
    }
  };

  const handleCategoryChange = (level, value) => {
    setFormData(prev => {
      const next = { ...prev };
      if (level === 'categoryId') {
        next.categoryId = value;
        next.subcategoryId = '';
        next.subsubcategoryId = '';
      } else if (level === 'subcategoryId') {
        next.subcategoryId = value;
        next.subsubcategoryId = '';
      } else if (level === 'subsubcategoryId') {
        next.subsubcategoryId = value;
      }
      return next;
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const validFiles = [];
    const invalidFiles = [];

    files.forEach(file => {
      if (file.size > MAX_SIZE) {
        invalidFiles.push(`${file.name} (Too large, max 5MB)`);
      } else if (!file.type.startsWith('image/')) {
        invalidFiles.push(`${file.name} (Not an image)`);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      toast.error(`Some files were skipped: ${invalidFiles.join(', ')}`);
    }

    if (validFiles.length > 0) {
      setNewImages(prev => [...prev, ...validFiles]);
      const newPreviews = validFiles.map(file => URL.createObjectURL(file));
      setPreviewImages(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index) => {
    if (index < existingImages.length) {
      setExistingImages(prev => prev.filter((_, i) => i !== index));
    } else {
      const newIdx = index - existingImages.length;
      setNewImages(prev => prev.filter((_, i) => i !== newIdx));
    }
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditVariant = (variant, e) => {
    if (e) e.preventDefault();
    setEditingVariant(variant);
    setIsVariantFormOpen(true);
  };

  const handleAddVariant = (e) => {
    if (e) e.preventDefault();
    setEditingVariant(null);
    setIsVariantFormOpen(true);
  };

  const handleDeleteVariant = (id, e) => {
    if (e) e.preventDefault();
    setVariantToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteVariant = async () => {
    if (!variantToDelete) return;
    try {
      await deleteVariantMutation.mutateAsync(variantToDelete);
      toast.success('Variant deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete variant');
    } finally {
      setVariantToDelete(null);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.product_name) newErrors.product_name = "Product name is required";
    if (!formData.product_url) newErrors.product_url = "Product URL is required";
    if (!formData.skucode) newErrors.skucode = "SKU Code is required";
    if (!formData.description) newErrors.description = "Description is required";

    if (!formData.subsubcategoryId && !initialData) newErrors.category = "Category selection is required";
    if (existingImages.length === 0 && newImages.length === 0 && !initialData) newErrors.images = "At least one image is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fill required fields");
      return;
    }

    const submissionData = new FormData();
    Object.keys(formData).forEach(key => {
      submissionData.append(key, formData[key]);
    });

    if (productAttributes.length > 0) {
      submissionData.append('dynamicAttributes', JSON.stringify(productAttributes));
    }

    if (user?._id) submissionData.append('user_id', user._id);

    // Use 'brand' instead of 'brandId' to match refactored backend
    if (formData.brand) {
      submissionData.append('brand', formData.brand);
    } else if (activeBrand) {
      submissionData.append('brand', activeBrand?._id || activeBrand);
    }

    if (initialData) {
      submissionData.append('existingImages', JSON.stringify(existingImages));
    }
    newImages.forEach(image => {
      submissionData.append('product_images', image);
    });

    onSubmit(submissionData);
  };

  return (
    <>
      {isVariantFormOpen ? (
        <div className="space-y-6">
          <VariantForm
            productId={productId}
            editingVariant={editingVariant}
            onComplete={() => setIsVariantFormOpen(false)}
            onCancel={() => setIsVariantFormOpen(false)}
          />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8 pb-20">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6 border-b pb-2">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name *</label>
                <input name="product_name" value={formData.product_name} onChange={handleChange} className={clsx("w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#e09a74]", errors.product_name ? "border-red-500" : "border-gray-200")} />
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product URL *</label>
                <input name="product_url" value={formData.product_url} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none bg-gray-50" />
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">SKU Code *</label>
                <input name="skucode" value={formData.skucode} onChange={handleChange} className={clsx("w-full px-4 py-2 border rounded-lg outline-none", errors.skucode ? "border-red-500" : "border-gray-200")} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={6} className={clsx("w-full px-4 py-2 border rounded-lg outline-none", errors.description ? "border-red-500" : "border-gray-200")} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6 border-b pb-2">Organization</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select value={formData.categoryId} onChange={(e) => handleCategoryChange('categoryId', e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none">
                <option value="">Select Category</option>
                {l1Categories.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>)}
              </select>
              <select value={formData.subcategoryId} onChange={(e) => handleCategoryChange('subcategoryId', e.target.value)} disabled={!formData.categoryId} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none disabled:bg-gray-50">
                <option value="">Select Sub-Category</option>
                {l2Categories.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>)}
              </select>
              <select value={formData.subsubcategoryId} onChange={(e) => handleCategoryChange('subsubcategoryId', e.target.value)} disabled={!formData.subcategoryId} className={clsx("w-full px-4 py-2 border rounded-lg outline-none disabled:bg-gray-50", errors.category ? "border-red-500" : "border-gray-200")}>
                <option value="">Select Sub-Sub-Category</option>
                {l3Categories.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>)}
              </select>
            </div>
            {(isAdmin || (userBrands.length > 1)) && (
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Assign to Brand *</label>
                <select
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
                >
                  <option value="">Select Brand</option>
                  {userBrands.map(b => (
                    <option key={b._id || b.id} value={b._id || b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6 border-b pb-2">Images</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <label className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                <Upload className="w-6 h-6 text-gray-400 mb-2" />
                <span className="text-xs text-gray-500">Add Images</span>
                <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
              {previewImages.map((src, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                  <img src={src} alt="Preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {initialData && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6 border-b pb-2">
                <h3 className="text-lg font-bold text-gray-900 border-none">Product Variants</h3>
                <Button type="button" onClick={handleAddVariant} className="bg-[#e09a74] text-white hover:bg-white hover:text-[#e09a74] border-[#e09a74] border transition-all cursor-pointer text-sm py-1.5 px-4 rounded-lg flex items-center gap-2 ">
                  <Plus className="w-4 h-4" /> Add Variant
                </Button>
              </div>

              {isLoadingVariants ? (
                <div className="py-8 text-center text-gray-500">Loading variants...</div>
              ) : variants.length === 0 ? (
                <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200 italic">
                  No variants added yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase">Variant</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase">Attributes</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase">Price</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase">Stock</th>
                        <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-400 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {variants.map(v => (
                        <tr key={v._id || v.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden shrink-0">
                                 {v.variant_images && v.variant_images[0] && (
                                  <img
                                    src={getVariantImageUrl(v.variant_images[0])}
                                    className="w-full h-full object-cover"
                                    alt=""
                                  />
                                )}
                                {!v.variant_images?.[0] && v.product_image1 && (
                                  <img
                                    src={getProductImageUrl(v.product_image1)}
                                    className="w-full h-full object-cover"
                                    alt=""
                                  />
                                )}
                              </div>
                              <span className="text-sm font-semibold">{v.product_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1">
                              {v.dynamicAttributes && v.dynamicAttributes.length > 0 ? (
                                v.dynamicAttributes.map((attr, idx) => (
                                  <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] rounded-full">
                                    {attr.key}: {attr.value}
                                  </span>
                                ))
                              ) : (
                                <>
                                  {v.size && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded-full">Size: {v.size}</span>}
                                  {v.color && <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] rounded-full">Color: {v.color}</span>}
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm font-bold">{formatCurrency(v.selling_price)}</td>
                          <td className="px-4 py-4 text-sm">{v.stock} units</td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={(e) => handleEditVariant(v, e)}
                                className="p-2 text-[#e09a74] hover:bg-orange-50 rounded-lg transition-all"
                                title="Edit Variant"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteVariant(v._id || v.id, e)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete Variant"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6 border-b pb-2">SEO Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Meta Title</label>
                <input name="meta_title" value={formData.meta_title} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Meta Keywords</label>
                <input name="meta_keywords" value={formData.meta_keywords} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Meta Description</label>
                <textarea name="meta_description" value={formData.meta_description} onChange={handleChange} rows={3} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <Button variant="outline" className="cursor-pointer hover:text-red-500" type="button" onClick={() => onCancel ? onCancel() : window.history.back()}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-[#e09a74] px-4 py-2 text-white hover:bg-white hover:text-[#e09a74] border border-[#e09a74] cursor-pointer">
              {isSubmitting ? 'Saving...' : initialData ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteVariant}
        title="Delete Variant"
        message="Are you sure you want to delete this variant? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </>
  );
};

export default ProductForm;
