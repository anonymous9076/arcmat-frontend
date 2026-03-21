'use client';

import { useState, useEffect } from 'react';
import { X, Search, Loader2, IndianRupee, Layout, CheckCircle2, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useGetMoodboardDropdown } from '@/hooks/useMoodboard';
import { useGetProjects } from '@/hooks/useProject';
import { useCreateEstimatedCost, useUpdateEstimatedCost } from '@/hooks/useEstimatedCost';
import { 
    useGetTemplates, 
    useGetMoodboardTemplates, 
    useUpdateEstimatedCostTemplate,
    useCreateEstimatedCostTemplate
} from '@/hooks/useTemplate';
import { useAddMaterialVersion } from '@/hooks/useMaterialHistory';
import useProjectStore from '@/store/useProjectStore';
import { useSelectionStore } from '@/store/useSelectionStore';
import { useSidebarStore } from '@/store/useSidebarStore';
import { toast } from 'sonner';

export default function AddToMoodboardModal({ isOpen, onClose, product, products }) {
    const { activeProjectId, activeProjectName, activeMoodboardId, activeMoodboardName } = useProjectStore();
    const { triggerFolderAnimation } = useSidebarStore();
    const { clearSelection, toggleProduct } = useSelectionStore();
    const [targetType, setTargetType] = useState('project');
    const [selectedProjectId, setSelectedProjectId] = useState(activeProjectId || '');
    const [selectedMoodboardId, setSelectedMoodboardId] = useState(activeMoodboardId || '');

    const { data: projectsData, isLoading: projectsLoading } = useGetProjects({ enabled: isOpen && targetType === 'project' });
    const { data: templatesData, isLoading: templatesLoading } = useGetTemplates({ enabled: isOpen && targetType === 'template' });
    
    const { data: moodboardsData, isLoading: moodboardsLoading } = useGetMoodboardDropdown(targetType === 'project' ? selectedProjectId : null);
    const { data: templateSpacesData, isLoading: templateSpacesLoading } = useGetMoodboardTemplates(targetType === 'template' ? selectedProjectId : null);

    const createEstimateMutation = useCreateEstimatedCost();
    const updateEstimateMutation = useUpdateEstimatedCost();
    const createTemplateEstimateMutation = useCreateEstimatedCostTemplate();
    const updateTemplateEstimateMutation = useUpdateEstimatedCostTemplate();
    const addMaterialVersionMutation = useAddMaterialVersion(targetType === 'project' ? selectedProjectId : null);

    const items = targetType === 'project' ? (projectsData?.data || []) : (templatesData?.data || []);
    const moodboards = targetType === 'project' ? (moodboardsData?.data || []) : (templateSpacesData?.data || []);


    useEffect(() => {
        if (isOpen) {
            if (activeProjectId) setSelectedProjectId(activeProjectId);
            if (activeMoodboardId) setSelectedMoodboardId(activeMoodboardId);
        }
    }, [isOpen, activeProjectId, activeMoodboardId]);

    // Reset moodboard selection when project changes or type changes
    useEffect(() => {
        if (selectedProjectId !== activeProjectId) {
            setSelectedMoodboardId('');
        } else if (activeMoodboardId) {
            setSelectedMoodboardId(activeMoodboardId);
        }
    }, [selectedProjectId, activeProjectId, activeMoodboardId, targetType]);

    // Handle extraction of single or multiple product IDs
    const getProductIds = () => {
        if (products && products.length > 0) {
            return products.map(p => p.override_id || p._id || p.id).filter(Boolean);
        }
        if (product) {
            // Restore previous logic for single product matching
            const id = product.override_id || product._id || product.id;
            return id ? [id] : [];
        }
        return [];
    };

    const handleAdd = () => {
        const productIdsToSend = getProductIds();

        if (!selectedProjectId) {
            toast.warning(`Please select a ${targetType} first.`);
            return;
        }

        if (!selectedMoodboardId) {
            toast.warning("Please select a space first.");
            return;
        }

        if (productIdsToSend.length === 0) {
            toast.error("Internal Error: Product IDs are missing. Could not evaluate data to send.");
            return;
        }

        const selectedMb = moodboards.find(mb => mb._id === selectedMoodboardId);

        const onSuccessAction = () => {
            // Clear selection state
            if (products) clearSelection();
            if (product) {
                const isSelected = useSelectionStore.getState().selectedProducts.some(p => (p.override_id || p._id || p.id) === (product.override_id || product._id || product.id));
                if (isSelected) toggleProduct(product);
            }
            triggerFolderAnimation();
            onClose();
        };

        if (targetType === 'template') {
            const existingCostId = selectedMb?.estimation?._id;
            if (existingCostId) {
                const existingProductIds = selectedMb.estimation.productIds || [];
                const normalizedExisting = existingProductIds.map(p => typeof p === 'object' ? (p.productId?._id || p._id) : p);
                const newIds = productIdsToSend.filter(id => !normalizedExisting.includes(id));

                if (newIds.length === 0) {
                    toast.success("Products already exist in this template space!");
                    onClose();
                    return;
                }

                updateTemplateEstimateMutation.mutate({
                    costId: existingCostId,
                    data: {
                        productIds: [...normalizedExisting, ...newIds]
                    }
                }, {
                    onSuccess: () => {
                        toast.success("Added to Template Space successfully!");
                        onSuccessAction();
                    }
                });
            } else {
                // CREATING new estimation for TEMPLATE
                createTemplateEstimateMutation.mutate({
                    templateId: selectedProjectId,
                    moodboardTemplateId: selectedMoodboardId,
                    productIds: productIdsToSend
                }, {
                    onSuccess: () => {
                        toast.success("Created Template Estimation and Added Products!");
                        onSuccessAction();
                    }
                });
            }
            return;
        }

        if (selectedMb?.estimatedCostId) {
            // UPDATING existing estimation for PROJECT
            const existingRetailerProductIds = selectedMb.estimatedCostId.productIds || [];
            const normalizedExisting = existingRetailerProductIds.map(p => typeof p === 'object' ? (p.productId?._id || p._id) : p);

            // Filter out products that are already in the list
            const newIds = productIdsToSend.filter(id => !normalizedExisting.includes(id));

            if (newIds.length === 0) {
                toast.success("Products already exist in this moodboard!");
                onClose(); // All selected products already exist in the moodboard
                return;
            }

            updateEstimateMutation.mutate({
                id: selectedMb.estimatedCostId._id,
                data: {
                    productIds: [...normalizedExisting, ...newIds]
                }
            }, {
                onSuccess: () => {
                    // Record Material History for each new product (V1)
                    newIds.forEach(id => {
                        const prodObj = (products || []).find(p => (p.override_id || p._id || p.id) === id) || 
                                       ((product && (product.override_id || product._id || product.id) === id) ? product : null);
                        
                        const name = prodObj?.product_name || prodObj?.productId?.product_name || 'Material';
                        const image = prodObj?.variant_images?.[0]?.secure_url || prodObj?.productId?.product_images?.[0]?.secure_url || prodObj?.secure_url;
                        
                        addMaterialVersionMutation.mutate({
                            spaceId: selectedMoodboardId,
                            spaceName: selectedMb.moodboard_name || 'Space',
                            materialId: id,
                            materialName: name,
                            materialImage: image,
                            reason: 'Initial specification'
                        });
                    });
                    onSuccessAction();
                }
            });
        } else {
            // CREATING new estimation for PROJECT
            createEstimateMutation.mutate({
                moodboardId: selectedMoodboardId,
                projectId: selectedProjectId,
                productIds: productIdsToSend
            }, {
                onSuccess: (res) => {
                    // Record Material History for each product (V1)
                    productIdsToSend.forEach(id => {
                        const prodObj = (products || []).find(p => (p.override_id || p._id || p.id) === id) || 
                                       ((product && (product.override_id || product._id || product.id) === id) ? product : null);
                        
                        const name = prodObj?.product_name || prodObj?.productId?.product_name || 'Material';
                        const image = prodObj?.variant_images?.[0]?.secure_url || prodObj?.productId?.product_images?.[0]?.secure_url || prodObj?.secure_url;
                        
                        addMaterialVersionMutation.mutate({
                            spaceId: selectedMoodboardId,
                            spaceName: selectedMb.moodboard_name || 'Space',
                            materialId: id,
                            materialName: name,
                            materialImage: image,
                            reason: 'Initial specification'
                        });
                    });
                    onSuccessAction();
                }
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
                <div className="p-8 pb-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-[#2d3142]">
                            Add to Spaces
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="px-8 py-4">
                    {products && products.length > 0 ? (
                        <div className="bg-gray-50 rounded-3xl p-4 flex items-center gap-4 mb-2 border border-gray-100">
                            <div className="w-16 h-16 bg-[#2d3142] text-[#d9a88a] rounded-2xl flex items-center justify-center shadow-sm shrink-0 border border-gray-50">
                                <span className="text-xl font-black">{products.length}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-[#2d3142] truncate">Adding Multiple Items</h4>
                                <p className="text-xs text-gray-400 font-medium">{products.length} items selected for moodboard</p>
                            </div>
                        </div>
                    ) : product ? (
                        <div className="bg-gray-50 rounded-3xl p-4 flex items-center gap-4 mb-2 border border-gray-100">
                            <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden shadow-sm shrink-0 border border-gray-50">
                                {product.variant_images?.[0]?.secure_url || product.productId?.product_images?.[0]?.secure_url || product.secure_url ? (
                                    <img
                                        src={product.variant_images?.[0]?.secure_url || product.productId?.product_images?.[0]?.secure_url || product.secure_url}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-200">
                                        <Layout className="w-6 h-6" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-[#2d3142] truncate">{product?.product_name || product?.productId?.product_name}</h4>
                                <p className="text-xs text-gray-400 font-medium">{product?.productId?.brand?.name || product?.brand_name || 'Brand'}</p>
                            </div>
                        </div>
                    ) : null}

                    <div className="space-y-4 mt-4">
                        {/* Target Selection Toggle */}
                        <div className="flex bg-gray-100 p-1 rounded-2xl mb-4">
                            <button
                                onClick={() => { setTargetType('project'); setSelectedProjectId(''); setSelectedMoodboardId(''); }}
                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${targetType === 'project' ? 'bg-white text-[#d9a88a] shadow-sm' : 'text-gray-400'}`}
                            >
                                Projects
                            </button>
                            <button
                                onClick={() => { setTargetType('template'); setSelectedProjectId(''); setSelectedMoodboardId(''); }}
                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${targetType === 'template' ? 'bg-white text-[#d9a88a] shadow-sm' : 'text-gray-400'}`}
                            >
                                Templates
                            </button>
                        </div>

                        {/* Project/Template Selection */}
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">
                                1. Select {targetType === 'project' ? 'Project' : 'Template'}
                            </label>
                            {projectsLoading || templatesLoading ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="w-6 h-6 text-[#d9a88a] animate-spin" />
                                </div>
                            ) : items.length > 0 ? (
                                <select
                                    value={selectedProjectId}
                                    onChange={(e) => setSelectedProjectId(e.target.value)}
                                    className="w-full p-4 rounded-2xl border-2 border-gray-50 bg-white font-bold text-[#2d3142] focus:border-[#d9a88a] outline-none transition-all cursor-pointer"
                                >
                                    <option value="" disabled>Choose a {targetType}...</option>
                                    {items.map(p => (
                                        <option key={p._id} value={p._id}>{targetType === 'project' ? p.projectName : p.templateName}</option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-center py-4 text-gray-400 text-sm">No {targetType}s found</p>
                            )}
                        </div>

                        {/* Space Selection */}
                        {selectedProjectId && (
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">
                                    2. Choose Space
                                </label>

                                {moodboardsLoading || templateSpacesLoading ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="w-8 h-8 text-[#d9a88a] animate-spin" />
                                    </div>
                                ) : moodboards.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                        {moodboards.map((mb) => (
                                            <button
                                                key={mb._id}
                                                onClick={() => setSelectedMoodboardId(mb._id)}
                                                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${selectedMoodboardId === mb._id
                                                    ? 'border-[#d9a88a] bg-[#fef7f2]'
                                                    : 'border-gray-50 bg-white hover:border-gray-200'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedMoodboardId === mb._id ? 'bg-[#d9a88a] text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                        <Layout className="w-5 h-5" />
                                                    </div>
                                                    <span className={`font-bold ${selectedMoodboardId === mb._id ? 'text-[#d9a88a]' : 'text-[#2d3142]'}`}>
                                                        {mb.moodboard_name}
                                                    </span>
                                                </div>
                                                {selectedMoodboardId === mb._id && (
                                                    <CheckCircle2 className="w-5 h-5 text-[#d9a88a]" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 bg-orange-50 rounded-3xl text-center border border-dashed border-orange-200">
                                        <p className="text-orange-500 font-bold text-sm mb-2">No spaces found</p>
                                        <p className="text-orange-400 text-xs">Create a space in this project first.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-8 pt-4 flex gap-3">
                    <Button
                        onClick={onClose}
                        className="flex-1 py-4 px-6 border border-gray-200 text-gray-500 font-bold rounded-2xl hover:bg-gray-50 transition-all"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAdd}
                        disabled={!selectedMoodboardId || createEstimateMutation.isPending || updateEstimateMutation.isPending || updateTemplateEstimateMutation.isPending || createTemplateEstimateMutation.isPending}
                        className="flex-2 py-4 bg-[#d9a88a] text-white font-black rounded-2xl hover:bg-[#c59678] shadow-lg shadow-orange-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                        {createEstimateMutation.isPending || updateEstimateMutation.isPending || updateTemplateEstimateMutation.isPending || createTemplateEstimateMutation.isPending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            'Add to board'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
