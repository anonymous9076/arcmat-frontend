'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';

import { 
    useGetMoodboardTemplateById, 
    useUpdateMoodboardTemplate, 
    useUpdateEstimatedCostTemplate 
} from '@/hooks/useTemplate';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import useProjectStore from '@/store/useProjectStore';
import { useSidebarStore } from '@/store/useSidebarStore';
import { resolvePricing } from '@/lib/productUtils';

import { ArrowLeft, Loader2, Edit2, Check, X, ImagePlus } from 'lucide-react';

import OverviewTab from '@/components/moodboard/tabs/OverviewTab';
import PhotoUploadModal from '@/components/moodboard/PhotoUploadModal';
import Container from '@/components/ui/Container';

export default function TemplateSpaceDetailPage() {
    const { templateId, spaceId } = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const isArchitect = user?.role === 'architect';

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [customPhotos, setCustomPhotos] = useState([]);
    const [productStatuses, setProductStatuses] = useState({});
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const isDataLoaded = useRef(false);

    const { data: spaceData, isLoading, isError } = useGetMoodboardTemplateById(spaceId);
    const updateMoodboardMutation = useUpdateMoodboardTemplate();
    const updateEstimationMutation = useUpdateEstimatedCostTemplate();
    const queryClient = useQueryClient();

    const moodboard = spaceData?.data;
    const estimation = moodboard?.estimation;
    const products = estimation?.productIds || [];

    const { setActiveMoodboard, clearActiveProject } = useProjectStore();
    const { triggerFolderAnimation } = useSidebarStore();

    useEffect(() => {
        if (moodboard) {
            if (moodboard.moodboard_name) setEditName(moodboard.moodboard_name);
            
            // Set as active so Add to Moodboard flow works
            setActiveMoodboard(
                spaceId, 
                moodboard.moodboard_name, 
                templateId, 
                templateId // We don't have template name here easily, templateId is fine
            );

            if (!isDataLoaded.current) {
                if (Array.isArray(moodboard.customPhotos)) setCustomPhotos(moodboard.customPhotos);
                if (moodboard.productMetadata) setProductStatuses(moodboard.productMetadata);
                isDataLoaded.current = true;
            }
        }
    }, [moodboard]);

    const handlePriceQtyUpdate = useCallback((id, updates, isPhoto) => {
        if (isPhoto) {
            setCustomPhotos(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
        } else {
            setProductStatuses(prev => {
                const current = prev[id];
                return {
                    ...prev,
                    [id]: typeof current === 'object' ? { ...current, ...updates } : { status: current || 'Considering', ...updates }
                };
            });
        }
    }, []);

    const handlePhotoAdd = useCallback(({ file, previewUrl, title, description, price, quantity, tags = [] }) => {
        const photoId = 'photo_' + Date.now();
        const newPhoto = {
            id: photoId,
            title,
            description,
            previewUrl,
            status: 'Considering',
            price: price || 0,
            quantity: quantity || 1,
            tags: tags
        };

        setCustomPhotos(prev => {
            const nextPhotos = [...prev, newPhoto];
            updateMoodboardMutation.mutate({
                spaceId,
                data: { customPhotos: nextPhotos }
            });
            return nextPhotos;
        });
        triggerFolderAnimation();
        toast.success(`"${title}" added!`);
    }, [spaceId, updateMoodboardMutation]);

    const handlePhotoStatusChange = useCallback((photoId, status) => {
        setCustomPhotos(prev => prev.map(p => p.id === photoId ? { ...p, status } : p));
    }, []);

    const handleProductStatusChange = useCallback((productId, status) => {
        setProductStatuses(prev => {
            const current = prev[productId];
            return {
                ...prev,
                [productId]: typeof current === 'object' ? { ...current, status } : { status }
            };
        });
    }, []);

    const handleRemovePhoto = useCallback((photoId) => {
        setCustomPhotos(prev => prev.filter(p => p.id !== photoId));
        toast.success('Photo removed');
    }, []);

    const handleRemoveProduct = useCallback((productId) => {
        if (estimation?._id && products.length > 0) {
            const newProductIds = products
                .filter(p => p._id !== productId)
                .map(p => p._id);

            updateEstimationMutation.mutate({
                costId: estimation._id,
                data: { productIds: newProductIds }
            }, {
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ['project-templates', 'space', spaceId] });
                }
            });
        }
        toast.success('Product removed');
    }, [estimation, products, updateEstimationMutation, spaceId, queryClient]);


    useEffect(() => {
        if (!isDataLoaded.current) return;
        const timer = setTimeout(() => {
            updateMoodboardMutation.mutate({ spaceId, data: { customPhotos } });
        }, 1500);
        return () => clearTimeout(timer);
    }, [customPhotos, spaceId, updateMoodboardMutation]);

    useEffect(() => {
        if (!isDataLoaded.current) return;
        const timer = setTimeout(() => {
            updateMoodboardMutation.mutate({ spaceId, data: { productMetadata: productStatuses } });
        }, 1500);
        return () => clearTimeout(timer);
    }, [productStatuses, spaceId, updateMoodboardMutation]);

    const handleSaveName = () => {
        if (!editName.trim()) { toast.error('Name cannot be empty'); return; }
        updateMoodboardMutation.mutate({ spaceId, data: { moodboard_name: editName } }, {
            onSuccess: () => setIsEditing(false)
        });
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 text-[#d9a88a] animate-spin mb-3" />
                <p className="text-gray-400 font-semibold text-sm">Loading template space...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col bg-white min-h-[calc(100vh-64px)]">
            {/* Header */}
            <div className="border-b border-gray-100 bg-white">
                <Container className="pt-6 pb-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button onClick={() => router.push(`/dashboard/templates/${templateId}/spaces`)} className="p-2.5 bg-gray-50 text-gray-400 hover:text-[#2d3142] hover:bg-gray-100 rounded-xl transition-all">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                {isEditing ? (
                                    <div className="flex items-center gap-2">
                                        <input 
                                            autoFocus
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setIsEditing(false); }}
                                            className="text-2xl font-black text-[#1a1a2e] bg-transparent border-b-2 border-[#d9a88a] focus:outline-none"
                                        />
                                        <button onClick={handleSaveName} className="p-1 text-green-600"><Check className="w-5 h-5" /></button>
                                        <button onClick={() => setIsEditing(false)} className="p-1 text-red-400"><X className="w-5 h-5" /></button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 group/title">
                                        <h1 className="text-2xl font-black text-[#1a1a2e]">{moodboard?.moodboard_name}</h1>
                                        <button onClick={() => setIsEditing(true)} className="p-1 opacity-0 group-hover/title:opacity-100 transition-opacity"><Edit2 className="w-4 h-4 text-gray-300" /></button>
                                    </div>
                                )}
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Template: {moodboard?.templateId?.templateName}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/productlist')}
                                className="px-6 py-2.5 bg-[#3c4153] hover:bg-[#2d3142] text-white rounded-xl font-bold text-sm shadow-xl transition-all"
                            >
                                Add Products
                            </button>
                        </div>
                    </div>
                </Container>
            </div>

            <div className="flex-1 pb-20">
                <OverviewTab
                    products={products}
                    customPhotos={customPhotos}
                    productStatuses={productStatuses}
                    productNotifications={{}}
                    projectId={templateId}
                    projectName={moodboard?.templateId?.templateName}
                    moodboardId={spaceId}
                    moodboardName={moodboard?.moodboard_name}
                    isArchitect={isArchitect}
                    isTemplate={true}
                    handleProductStatusChange={handleProductStatusChange}
                    handlePhotoStatusChange={handlePhotoStatusChange}
                    handleRemoveProduct={handleRemoveProduct}
                    handleRemovePhoto={handleRemovePhoto}
                    handlePriceQtyUpdate={handlePriceQtyUpdate}
                    handlePhotoAdd={handlePhotoAdd}
                    router={router}
                />
            </div>

            {/* Support Modals */}
            <PhotoUploadModal 
                onUpload={handlePhotoAdd}
            />
        </div>
    );
}
