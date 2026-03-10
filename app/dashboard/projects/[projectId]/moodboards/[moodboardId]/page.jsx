'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';

import { useGetMoodboard, useDeleteMoodboard, useUpdateMoodboard, useGetMoodboardsByProject } from '@/hooks/useMoodboard';
import { useUpdateEstimatedCost } from '@/hooks/useEstimatedCost';
import { useAddMaterialVersion } from '@/hooks/useMaterialHistory';
import { usePostComment } from '@/hooks/useDiscussion';
import { useMarkNotificationsRead, useGetProductNotifications } from '@/hooks/useProject';
import { useQueryClient } from '@tanstack/react-query';
import useProjectStore from '@/store/useProjectStore';
import { useAddToCart } from '@/hooks/useCart';
import { useCartStore } from '@/store/useCartStore';
import { useAuth } from '@/hooks/useAuth';
import { resolvePricing } from '@/lib/productUtils';

import {
    MoreHorizontal, ArrowLeft, Loader2, Edit2, Check, X, Plus,
    Download, FileOutput, ShoppingCart, Tag, Building2, Hash,
    LayoutDashboard, Paintbrush2, TableProperties, FolderDown,
    Trash2, ChevronRight, Minus, ImagePlus, Search, List, ChevronDown,
    IndianRupee, CreditCard
} from 'lucide-react';
import ExcelJS from 'exceljs';
import {
    getProductImageUrl, getProductName, getProductCategory,
    getProductBrand, getProductThumbnail
} from '@/lib/productUtils';
import { exportMoodboardToExcel } from '@/lib/exportUtils';

// Visualizer components
import OverviewTab from '@/components/moodboard/tabs/OverviewTab';
import ExportTab from '@/components/moodboard/tabs/ExportTab';
import DownloadTab from '@/components/moodboard/tabs/DownloadTab';
import DiscussionTab from '@/components/moodboard/tabs/DiscussionTab';
import DeleteConfirmationModal from '@/components/moodboard/DeleteConfirmationModal';

import MaterialPanel from '@/components/visualizer/MaterialPanel';
import CanvasPreview from '@/components/visualizer/CanvasPreview';
import PhotoUploadModal from '@/components/moodboard/PhotoUploadModal';
import CardContextMenu from '@/components/moodboard/CardContextMenu';
import Container from '@/components/ui/Container';

// Status badge helper
const STATUS_STYLES = {
    'Specified': { dot: 'bg-green-400', label: 'text-green-600' },
    'Considering': { dot: 'bg-gray-500', label: 'text-gray-600' },
    'Excluded': { dot: 'bg-pink-400', label: 'text-pink-500' },
};
function StatusDot({ status = 'Considering' }) {
    const s = STATUS_STYLES[status] || STATUS_STYLES['Considering'];
    return (
        <span
            className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full border-2 border-white shadow ${s.dot}`}
            title={status}
        />
    );
}

const TABS = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'designDesk', label: 'Design Desk', icon: Paintbrush2 },
    { id: 'renders', label: 'Renders', icon: ImagePlus },
    { id: 'discussion', label: 'Discussion', icon: Paintbrush2 },
    { id: 'export', label: 'Export', icon: TableProperties },
    { id: 'download', label: 'Download', icon: FolderDown },
];

export default function MoodboardDetailPage() {
    const { projectId, moodboardId } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isAuthenticated } = useAuth();
    const isArchitect = user?.role === 'architect';
    const isContractor = user?.professionalType === 'Contractor / Builder';

    useEffect(() => {
        if (isContractor) {
            toast.error("Contractors do not have access to Spaces.");
            router.push('/dashboard/projects');
        }
    }, [isContractor, router]);

    const initialTab = searchParams.get('tab') || 'overview';
    const [activeTab, setActiveTab] = useState(initialTab);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [menuOpen, setMenuOpen] = useState(false);
    const [isRenderModalOpen, setIsRenderModalOpen] = useState(false);
    const [selectedFullScreenImage, setSelectedFullScreenImage] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Photo upload modal
    // Custom photos: [{ id, title, description, previewUrl, status }]
    const [customPhotos, setCustomPhotos] = useState([]);
    // Isolated custom rows just for the Export view
    const [customRows, setCustomRows] = useState([]);
    // Per-product status map: { [productId]: 'Considering' | 'Specified' | 'Excluded' }
    const [productStatuses, setProductStatuses] = useState({});
    const [isPanelOpen, setIsPanelOpen] = useState(true);
    const canvasRef = useRef(null);

    // Canvas state (Design Desk)
    const [boardItems, setBoardItems] = useState([]);
    const [canvasBg, setCanvasBg] = useState('#f0eee9');
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [stagedMaterial, setStagedMaterial] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const isDataLoaded = useRef(false);

    const { data: moodboardData, isLoading, isError, error } = useGetMoodboard(moodboardId);
    const { data: siblingData } = useGetMoodboardsByProject(projectId);
    const deleteMutation = useDeleteMoodboard();
    const updateEstimationMutation = useUpdateEstimatedCost();
    const { mutate: updateMoodboard, isPending: isUpdatingName } = useUpdateMoodboard();
    const addMaterialVersionMutation = useAddMaterialVersion(projectId);
    const queryClient = useQueryClient();
    const { mutate: addToCartBackend } = useAddToCart();
    const { mutate: markNotificationsRead } = useMarkNotificationsRead();
    const { mutate: postComment } = usePostComment(projectId);

    // Fetch product-level notifications
    const { data: notificationsData } = useGetProductNotifications(projectId, moodboardId);
    const productNotifications = notificationsData?.data?.productNotifications || {};

    const moodboard = moodboardData?.data;
    const project = moodboard?.projectId;
    const estimation = moodboard?.estimatedCostId;
    const products = estimation?.productIds || [];
    const siblingBoards = (siblingData?.data || []).filter(b => b._id !== moodboardId);

    useEffect(() => { setIsMounted(true); }, []);

    // Mark GENERAL space/project discussions as read on mount (avoids clearing material-specific badges)
    useEffect(() => {
        if (projectId && moodboardId && isAuthenticated) {
            markNotificationsRead({ id: projectId, spaceId: moodboardId, type: 'general' });
        }
    }, [projectId, moodboardId, isAuthenticated, markNotificationsRead]);

    // Redirect if there's an error fetching the moodboard (e.g., 403 Forbidden due to privacy settings)
    useEffect(() => {
        if (isError) {
            toast.error(error?.response?.data?.message || "You don't have permission to view this space.");
            router.push(`/dashboard/projects/${projectId}`);
        }
    }, [isError, error, router, projectId]);

    // Redirect if the data loads and we see the flag is strictly false for a non-architect
    useEffect(() => {
        if (!isLoading && moodboard) {
            if (!isArchitect && project?.privacyControls?.showMoodboards === false) {
                toast.error("You don't have permission to view spaces for this project.");
                router.push(`/dashboard/projects/${projectId}`);
            }
        }
    }, [isLoading, moodboard, isArchitect, project, router, projectId]);

    useEffect(() => {
        isDataLoaded.current = false;
    }, [moodboardId]);

    useEffect(() => {
        if (moodboard) {
            if (moodboard.moodboard_name) setEditName(moodboard.moodboard_name);
            if (!isDataLoaded.current) {
                const state = Array.isArray(moodboard.canvasState) ? moodboard.canvasState : [];
                setBoardItems(state);
                if (moodboard.canvasBackgroundColor) setCanvasBg(moodboard.canvasBackgroundColor);
                // Restore custom photos (title/description/status but not blob URLs which are ephemeral)
                if (Array.isArray(moodboard.customPhotos)) setCustomPhotos(moodboard.customPhotos);
                // Restore custom rows
                if (Array.isArray(moodboard.customRows)) setCustomRows(moodboard.customRows);
                // Restore product statuses
                if (moodboard.productMetadata) setProductStatuses(moodboard.productMetadata);
                isDataLoaded.current = true;
            }
        }
    }, [moodboard]);

    // Materials from estimation + custom photos for Material Panel
    const materials = useMemo(() => {
        const base = moodboard?.estimatedCostId?.productIds || [];
        // Filter out photos tagged as 'Render' from the Design Desk material panel
        const photos = customPhotos
            .filter(p => !(p.tags || []).includes('Render'))
            .map(p => ({
                _id: p.id,
                name: p.title,
                isCustomPhoto: true,
                photoUrl: p.previewUrl,
                images: [p.previewUrl],
                category: 'My Photo',
                brand: 'Custom Upload',
            }));
        return [...base, ...photos];
    }, [moodboard, customPhotos]);

    // Budget
    const totalBudget = useMemo(() => {
        return boardItems.filter(i => i.type !== 'text').reduce((sum, item) => {
            return sum + (Number(item.price) || 0) * (Number(item.quantity) || 1);
        }, 0);
    }, [boardItems]);

    /* ── Backend save ───────────────────────────── */
    const saveToBackend = useCallback((items, bg = canvasBg) => {
        if (!moodboardId || !isDataLoaded.current) {
            return;
        }
        setIsSaving(true);


        const budget = items.filter(i => i.type !== 'text').reduce((sum, item) => {
            return sum + (Number(item.price) || 0) * (Number(item.quantity) || 1);
        }, 0);
        updateMoodboard({
            id: moodboardId,
            data: {
                canvasState: items,
                totalBudget: budget,
                canvasBackgroundColor: bg
            }
        }, {
            onSettled: () => setTimeout(() => setIsSaving(false), 2000)
        });
    }, [moodboardId, updateMoodboard, canvasBg]);

    useEffect(() => {
        if (!isDataLoaded.current) return;
        const timer = setTimeout(() => saveToBackend(boardItems, canvasBg), 1000);
        return () => clearTimeout(timer);
    }, [boardItems, canvasBg, saveToBackend]);

    /* ── Board handlers ─────────────────────────── */
    const handleDrop = useCallback((material, x, y) => {
        const { price } = resolvePricing(material);
        setBoardItems(prev => {
            const next = [...prev, { id: Date.now() + Math.random(), type: 'material', material, x, y, scale: 1, rotation: 0, quantity: 1, price }];
            return next;
        });
        setSelectedMaterial(material);
        setStagedMaterial(null);
    }, []);

    const handleAddText = useCallback((x, y) => {
        const newId = Date.now() + Math.random();
        setBoardItems(prev => {
            const next = [...prev, { id: newId, type: 'text', text: '', fontSize: 32, fontWeight: 'bold', textColor: '#1a1a1a', x, y }];
            return next;
        });
        return newId;
    }, []);

    const handleReposition = useCallback((id, x, y) => {
        setBoardItems(prev => prev.map(item => item.id === id ? { ...item, x, y } : item));
    }, []);

    const handleUpdateItem = useCallback((id, updates) => {
        setBoardItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    }, []);

    const handleRemoveItem = useCallback((id) => {
        setBoardItems(prev => prev.filter(item => item.id !== id));
    }, []);

    const handleClearBoard = useCallback(() => {
        setBoardItems([]);
        setSelectedMaterial(null);
        setStagedMaterial(null);
    }, []);

    const handleSave = useCallback(() => {


        toast.promise(
            new Promise((resolve, reject) => {
                try {
                    if (canvasRef.current && canvasRef.current.getLatestState) {
                        const latest = canvasRef.current.getLatestState();
                        setBoardItems(latest);
                        saveToBackend(latest);
                    } else {
                        saveToBackend(boardItems);
                    }
                    setTimeout(resolve, 800); // UI delay for clarity
                } catch (err) {
                    reject(err);
                }
            }),
            {
                loading: 'Saving canvas state...',
                success: 'Canvas saved successfully!',
                error: 'Could not manually save canvas'
            }
        );
    }, [boardItems, saveToBackend]);

    // --- Debounced Auto-Saves for Export Data (Custom Rows, Photos, Metadata) ---
    useEffect(() => {
        if (!isDataLoaded.current) return;
        const timer = setTimeout(() => {
            updateMoodboard({ id: moodboardId, data: { customRows } });
        }, 800);
        return () => clearTimeout(timer);
    }, [customRows, moodboardId, updateMoodboard]);

    useEffect(() => {
        if (!isDataLoaded.current) return;
        const timer = setTimeout(() => {
            updateMoodboard({ id: moodboardId, data: { customPhotos } });
        }, 800);
        return () => clearTimeout(timer);
    }, [customPhotos, moodboardId, updateMoodboard]);

    useEffect(() => {
        if (!isDataLoaded.current) return;
        const timer = setTimeout(() => {
            updateMoodboard({ id: moodboardId, data: { productMetadata: productStatuses } });
        }, 800);
        return () => clearTimeout(timer);
    }, [productStatuses, moodboardId, updateMoodboard]);

    const handleMaterialSelect = useCallback((material) => {
        setSelectedMaterial(material);
        setStagedMaterial(material);
    }, []);

    const handleStagedPlace = useCallback((x, y) => {
        if (!stagedMaterial) return;
        handleDrop(stagedMaterial, x, y);
    }, [stagedMaterial, handleDrop]);

    /* ── Name edit ──────────────────────────────── */
    const handleSaveName = () => {
        if (!editName.trim()) { toast.error('Name cannot be empty'); return; }
        if (editName === moodboard?.moodboard_name) { setIsEditing(false); return; }
        updateMoodboard({ id: moodboardId, data: { moodboard_name: editName } }, {
            onSuccess: () => {
                setIsEditing(false);
                queryClient.invalidateQueries(['moodboard', moodboardId]);
            }
        });
    };

    /* ── Add to Cart ────────────────────────────── */
    const handleAddToCart = (product) => {
        if (isAuthenticated) {
            addToCartBackend({
                product_name: getProductName(product),
                product_id: (typeof product.productId === 'object' ? product.productId?._id : product.productId) || product._id,
                product_qty: 1,
                product_variant_id: product._id,
                item_or_variant: 'variant',
            });
        } else {
            useCartStore.getState().addItem(product, 1, product);
        }
        toast.success(`${getProductName(product)} added to cart!`);
    };

    /* ── Photo Upload Handler ──────────────────── */
    const handlePhotoAdd = useCallback(({ file, previewUrl, title, description, price, quantity, tags = [] }) => {
        const photoId = 'photo_' + Date.now();
        const isRender = tags.includes('Render');

        const newPhoto = {
            id: photoId,
            title,
            description,
            previewUrl, // Base64 now
            status: 'Considering',
            price: price || 0,
            quantity: quantity || 1,
            tags: tags
        };

        if (isRender) {
            setCustomPhotos(prev => {
                const nextPhotos = [...prev, newPhoto];
                updateMoodboard({
                    id: moodboardId,
                    data: { customPhotos: nextPhotos }
                });
                return nextPhotos;
            });
            toast.success(`"${title}" added to Renders!`);
            return;
        }

        // Create pseudo-material for Design Desk
        const pseudoMaterial = {
            _id: photoId,
            name: title,
            isCustomPhoto: true,
            photoUrl: previewUrl,
            images: [previewUrl],
            category: 'My Photo',
            brand: 'Custom Upload',
        };

        const { price: defaultPrice } = resolvePricing(pseudoMaterial);
        const itemPrice = price || defaultPrice;

        setCustomPhotos(prev => {
            const nextPhotos = [...prev, newPhoto];

            setBoardItems(prevItems => {
                const newItem = {
                    id: Date.now() + Math.random(),
                    type: 'material',
                    material: pseudoMaterial,
                    x: 400,
                    y: 300,
                    scale: 1,
                    rotation: 0,
                    quantity: quantity || 1,
                    price: itemPrice
                };
                const nextItems = [...prevItems, newItem];

                // Single update to backend
                updateMoodboard({
                    id: moodboardId,
                    data: {
                        customPhotos: nextPhotos,
                        canvasState: nextItems,
                        totalBudget: nextItems.filter(i => i.type !== 'text').reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0)
                    }
                });

                return nextItems;
            });

            return nextPhotos;
        });

        toast.success(`"${title}" added to Overview and Canvas!`);
    }, [moodboardId, updateMoodboard]);

    /* ── Export Custom Rows Handlers ───────────── */
    const handleAddCustomRow = useCallback(() => {
        const newRow = {
            id: 'row_' + Date.now(),
            title: 'New Custom Row',
            price: 0,
            quantity: 1,
            status: 'Considering',
            tags: []
        };
        setCustomRows(prev => [...prev, newRow]);
        toast.success("Custom row added to Export!");
    }, []);

    const handleCustomRowUpdate = useCallback((rowId, updates) => {
        setCustomRows(prev => prev.map(r => r.id === rowId ? { ...r, ...updates } : r));
    }, []);

    const handleRemoveCustomRow = useCallback((rowId) => {
        setCustomRows(prev => prev.filter(r => r.id !== rowId));
        toast.success("Custom row removed");
    }, []);

    /* ── Status Handlers ───────────────────────── */
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

    const handleRemovePhoto = useCallback((photoId) => {
        // Remove from Overview customPhotos
        setCustomPhotos(prev => prev.filter(p => p.id !== photoId));
        // Remove from Canvas boardItems
        setBoardItems(prev => {
            const next = prev.filter(item => item.material?._id !== photoId);
            return next;
        });
        toast.success('Photo removed from board');
    }, []);

    const handleRemoveProduct = useCallback((productId) => {
        // 1. Remove from EstimatedCost (Overview Tab)
        if (estimation?._id && products.length > 0) {
            const newProductIds = products
                .filter(p => p._id !== productId)
                .map(p => p._id);

            updateEstimationMutation.mutate({
                id: estimation._id,
                data: { productIds: newProductIds }
            }, {
                onSuccess: () => {
                    queryClient.invalidateQueries(['moodboard', moodboardId]);
                }
            });
        }

        // 2. Remove from Canvas boardItems (Design Desk)
        setBoardItems(prev => {
            const next = prev.filter(item => item.material?._id !== productId);
            return next;
        });
        toast.success('Product removed from board');
    }, [estimation, products, updateEstimationMutation, moodboardId, queryClient]);

    const [isReplacingProduct, setIsReplacingProduct] = useState(false);
    const handleReplaceProduct = useCallback((oldProductId, oldProductName, newProduct, reason) => {
        if (!estimation?._id || products.length === 0) return;
        setIsReplacingProduct(true);

        // --- CRITICAL FIX: ID Resolution ---
        // When searching in ReplaceMaterialModal, the storefront type returns objects where the RetailerProduct ID 
        // is in 'override_id'. If we use '_id', we're using the variant/product ID, and the backend population fails.
        const retailerProductId = newProduct.override_id || newProduct._id;

        // 1. Replace in the product list
        // Use string comparison to safely find the match
        const finalIds = products.map(p => String(p._id) === String(oldProductId) ? retailerProductId : String(p._id));

        // 2. Update EstimatedCost for the project/space (this updates the product list in the Space)
        updateEstimationMutation.mutate({
            id: estimation._id,
            data: { productIds: finalIds }
        }, {
            onSuccess: () => {
                // 3. Record Material History & Notify Approvals
                addMaterialVersionMutation.mutate({
                    spaceId: moodboardId,
                    spaceName: moodboard?.moodboard_name || 'Space',
                    materialId: retailerProductId,
                    materialName: getProductName(newProduct),
                    previousMaterialId: oldProductId,
                    previousMaterialName: oldProductName,
                    reason: reason
                }, {
                    onSuccess: (historyRes) => {
                        const historyId = historyRes?.history?._id;

                        // 4. Post a System Discussion Message for the Customer
                        // This ensures the client gets a notification badge
                        postComment({
                            message: `[System] Replaced "${oldProductName}" with "${getProductName(newProduct)}". Reason: ${reason}. Please approve or reject in the Overview tab.`,
                            spaceId: moodboardId,
                            type: 'comment', // Use 'comment' to trigger unread badge properly
                            referencedMaterialId: retailerProductId,
                            referencedMaterialName: getProductName(newProduct),
                            materialHistoryId: historyId
                        });

                        // 5. Replace in Canvas boardItems (Design Desk)
                        setBoardItems(prev => {
                            return prev.map(item => {
                                if (item.material?._id && String(item.material._id) === String(oldProductId)) {
                                    return { ...item, material: newProduct, price: resolvePricing(newProduct).price };
                                }
                                return item;
                            });
                        });

                        queryClient.invalidateQueries(['moodboard', moodboardId]);
                        toast.success('Material replaced and client notified');
                        setIsReplacingProduct(false);
                    },
                    onError: (err) => {
                        console.error("Material History Error:", err);
                        setIsReplacingProduct(false);
                        toast.error('Failed to record material history');
                    }
                });
            },
            onError: (err) => {
                console.error("Replacement Mutate Error:", err);
                setIsReplacingProduct(false);
                toast.error('Failed to update space with new material');
            }
        });

    }, [estimation, products, updateEstimationMutation, addMaterialVersionMutation, moodboardId, moodboard, queryClient, postComment]);

    /* ── Context Menu ──────────────────────────── */
    const openContextMenu = useCallback((e, itemId, isPhoto) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, itemId, isPhoto });
    }, []);

    /* ── Excel Export ─────────────────────────────── */
    const exportAsCSV = async () => {
        // For excel export, we might still want all data or filtered? 
        // User said "ONLY TENDER TAB NOT ALL TABS", implying UI visibility.
        // Usually export should include everything specified, but let's stick to UI exclusivity first.
        await exportMoodboardToExcel(moodboard, project, products);
    };

    // Filtered photos for Overview and Export (excluding Renders)
    const generalPhotos = useMemo(() => customPhotos.filter(p => !(p.tags || []).includes('Render')), [customPhotos]);
    const renderPhotos = useMemo(() => customPhotos.filter(p => (p.tags || []).includes('Render')), [customPhotos]);

    if (isLoading || !isMounted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 text-[#d9a88a] animate-spin mb-3" />
                <p className="text-gray-400 font-semibold text-sm">Loading space...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-white overflow-hidden">
            {/* ── Header ───────────────────────────────── */}
            <div className="border-b border-gray-100 bg-white">
                <Container className="pt-6 pb-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                        <div className="flex-1 min-w-0">
                            {isEditing ? (
                                <div className="flex items-center gap-3 mb-1">
                                    <input
                                        autoFocus
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setIsEditing(false); }}
                                        className="text-3xl font-black text-[#1a1a2e] bg-transparent border-b-2 border-[#d9a88a] focus:outline-none w-full max-w-sm pb-1"
                                    />
                                    <button onClick={handleSaveName} disabled={isUpdatingName} className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all">
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => { setEditName(moodboard?.moodboard_name || ''); setIsEditing(false); }} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-all">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 mb-1 group/title w-fit">
                                    <h1 className="text-3xl font-black text-[#1a1a2e]">{moodboard?.moodboard_name}</h1>
                                    {isArchitect && (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="p-1.5 text-gray-300 hover:text-gray-500 rounded-lg opacity-0 group-hover/title:opacity-100 transition-all"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            )}
                            <p className="text-sm text-gray-400 font-medium mt-1">
                                {moodboard?.description || 'Enter a description for the board'}
                            </p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-start gap-3 shrink-0">
                            <div className="relative">
                                <button
                                    onClick={() => setMenuOpen(o => !o)}
                                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                                >
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>

                                {menuOpen && (
                                    <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50">
                                        {isArchitect && (
                                            <>
                                                <button
                                                    onClick={() => { setIsEditing(true); setMenuOpen(false); }}
                                                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                                                >
                                                    <Edit2 className="w-4 h-4" /> Rename
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setMenuOpen(false);
                                                        if (window.confirm('Delete this space?')) {
                                                            deleteMutation.mutate(moodboardId, {
                                                                onSuccess: () => router.push(`/dashboard/projects/${projectId}/moodboards`)
                                                            });
                                                        }
                                                    }}
                                                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 flex items-center gap-2"
                                                >
                                                    <Trash2 className="w-4 h-4" /> Delete
                                                </button>
                                            </>
                                        )}
                                        {siblingBoards.length > 0 && (
                                            <>
                                                <div className="border-t border-gray-100 my-1" />
                                                <p className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Other Spaces</p>
                                                {siblingBoards.map(b => (
                                                    <button
                                                        key={b._id}
                                                        onClick={() => { setMenuOpen(false); router.push(`/dashboard/projects/${projectId}/moodboards/${b._id}`); }}
                                                        className="w-full text-left px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2 truncate"
                                                    >
                                                        <List className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                                                        <span className="truncate">{b.moodboard_name}</span>
                                                    </button>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            <Link
                                href={`/dashboard/projects/${projectId}/moodboards`}
                                className="text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-[#d9a88a] transition-colors"
                            >
                                Project Space
                            </Link>
                        </div>
                    </div>

                    {/* Tab Navigation ─── */}
                    <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                        {TABS.map(tab => {
                            const hasGeneralMessages = tab.id === 'discussion' && notificationsData?.data?.generalDiscussions > 0;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`whitespace-nowrap flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all flex-1 sm:flex-none relative ${activeTab === tab.id
                                        ? 'border-[#1a1a2e] text-[#1a1a2e]'
                                        : 'border-transparent text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    {tab.label}
                                    {hasGeneralMessages && (
                                        <span className="flex items-center justify-center bg-red-500 text-white text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full ml-1 animate-pulse">
                                            {notificationsData.data.generalDiscussions}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </Container>
            </div>

            {/* ── Tab Content ─────────────────────────── */}
            <div className="flex-1 overflow-hidden">

                {/* OVERVIEW */}
                {activeTab === 'overview' && (
                    <OverviewTab
                        products={products}
                        customPhotos={generalPhotos}
                        productStatuses={productStatuses}
                        productNotifications={productNotifications}
                        projectId={projectId}
                        projectName={project?.projectName}
                        moodboardId={moodboardId}
                        moodboardName={moodboard?.moodboard_name}
                        handlePhotoAdd={handlePhotoAdd}
                        handlePhotoStatusChange={handlePhotoStatusChange}
                        handleProductStatusChange={handleProductStatusChange}
                        handlePriceQtyUpdate={handlePriceQtyUpdate}
                        handleRemovePhoto={handleRemovePhoto}
                        handleRemoveProduct={handleRemoveProduct}
                        handleReplaceProduct={handleReplaceProduct}
                        isReplacingProduct={isReplacingProduct}
                        handleAddToCart={handleAddToCart}
                        router={router}
                        isArchitect={isArchitect}
                        privacyControls={project?.privacyControls}
                    />
                )}

                {/* DESIGN DESK */}
                <div className={`h-full relative ${activeTab === 'designDesk' ? '' : 'hidden'}`}>
                    {isMounted && (
                        <div className="flex h-full relative">
                            {/* Collapse Toggle Handle */}
                            {!isPanelOpen && (
                                <button
                                    onClick={() => setIsPanelOpen(true)}
                                    className="absolute left-0 top-1/2 -translate-y-1/2 z-60 bg-white border border-l-0 border-gray-200 p-1.5 rounded-r-xl shadow-md hover:bg-gray-50 transition-all group"
                                    title="Open Materials"
                                >
                                    <ChevronDown className="w-5 h-5 -rotate-90 text-gray-400 group-hover:text-[#d9a88a]" />
                                </button>
                            )}

                            {/* Left Material Panel */}
                            {/* Mobile Overlay */}
                            {isPanelOpen && (
                                <div
                                    className="absolute inset-0 z-50 bg-black/20 md:hidden"
                                    onClick={() => setIsPanelOpen(false)}
                                />
                            )}
                            {isArchitect && (
                                <div className={`absolute md:relative z-50 h-full shrink-0 border-r border-gray-200 bg-white overflow-hidden transition-all duration-300 ease-in-out ${isPanelOpen ? 'w-[280px] md:w-[260px] shadow-2xl md:shadow-none' : 'w-0'}`}>
                                    <MaterialPanel
                                        materials={materials}
                                        selectedMaterial={selectedMaterial}
                                        stagedMaterial={stagedMaterial}
                                        onSelect={handleMaterialSelect}
                                        isOpen={isPanelOpen}
                                        onToggle={() => setIsPanelOpen(!isPanelOpen)}
                                    />
                                </div>
                            )}

                            {/* Canvas */}
                            <div className="flex-1 flex flex-col min-w-0">
                                <CanvasPreview
                                    ref={canvasRef}
                                    projectName={project?.projectName}
                                    roomName={moodboard?.moodboard_name}
                                    boardItems={boardItems}
                                    canvasBg={canvasBg}
                                    onBgChange={setCanvasBg}
                                    autoSaving={isSaving}
                                    stagedMaterial={stagedMaterial}
                                    onStagedPlace={handleStagedPlace}
                                    onClearStaged={() => setStagedMaterial(null)}
                                    onDrop={handleDrop}
                                    onAddText={handleAddText}
                                    onReposition={handleReposition}
                                    onUpdateItem={handleUpdateItem}
                                    onRemoveItem={handleRemoveItem}
                                    onClear={handleClearBoard}
                                    onSave={handleSave}
                                    onMaterialSelect={setSelectedMaterial}
                                    isArchitect={isArchitect}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* RENDERS */}
                {activeTab === 'renders' && (
                    <div className="h-full overflow-y-auto p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-[#1a1a2e] mb-1">Renders</h2>
                                <p className="text-sm text-gray-500 font-medium">Visualizations and renders for this space</p>
                            </div>
                            {isArchitect && (
                                <button
                                    onClick={() => setIsRenderModalOpen(true)}
                                    className="px-6 py-3 bg-[#1a1a2e] text-white font-bold rounded-2xl hover:bg-[#2d2d4a] transition-colors flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Add Render
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {renderPhotos.map(photo => (
                                <div
                                    key={photo.id}
                                    className="group relative aspect-video bg-gray-100 rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer"
                                >
                                    <img
                                        src={photo.previewUrl}
                                        alt={photo.title}
                                        onClick={() => setSelectedFullScreenImage(photo)}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />

                                    {/* Delete Button */}
                                    {isArchitect && (
                                        <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setItemToDelete(photo.id);
                                                    setIsDeleteModalOpen(true);
                                                }}
                                                className="p-2 bg-white/90 hover:bg-black hover:text-white rounded-xl shadow-lg transition-all text-red-500"
                                                title="Delete Render"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}

                                    <div
                                        onClick={() => setSelectedFullScreenImage(photo)}
                                        className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6"
                                    >
                                        <p className="text-white font-bold text-lg">{photo.title}</p>
                                        <p className="text-white/80 text-sm line-clamp-1">{photo.description}</p>
                                    </div>
                                </div>
                            ))}
                            {renderPhotos.length === 0 && (
                                <div className="col-span-full py-24 border-2 border-dashed border-gray-200 rounded-[40px] flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                                        <ImagePlus className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-500">No renders yet</h3>
                                    <p className="text-sm text-gray-400 max-w-xs mt-1">
                                        {isArchitect ? "Upload high-quality renders and tag them as 'Render' to show them here." : "No renders have been uploaded for this space yet."}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* EXPORT */}
                {activeTab === 'export' && (
                    <ExportTab
                        products={products}
                        customPhotos={generalPhotos}
                        customRows={customRows}
                        boardItems={boardItems}
                        productStatuses={productStatuses}
                        projectName={project?.projectName}
                        exportAsCSV={exportAsCSV}
                        handleAddToCart={handleAddToCart}
                        handlePriceQtyUpdate={handlePriceQtyUpdate}
                        handlePhotoStatusChange={handlePhotoStatusChange}
                        handleProductStatusChange={handleProductStatusChange}
                        handleAddCustomRow={handleAddCustomRow}
                        handleCustomRowUpdate={handleCustomRowUpdate}
                        handleRemoveCustomRow={handleRemoveCustomRow}
                        isArchitect={isArchitect}
                        privacyControls={project?.privacyControls}
                    />
                )}

                {/* DOWNLOAD */}
                {activeTab === 'download' && (
                    <DownloadTab
                        boardItems={boardItems}
                        exportAsCSV={exportAsCSV}
                        setActiveTab={setActiveTab}
                        downloadCanvas={() => canvasRef.current?.download('jpeg')}
                    />
                )}

                {/* DISCUSSION */}
                {activeTab === 'discussion' && (
                    <DiscussionTab projectId={projectId} />
                )}
            </div>

            <PhotoUploadModal
                isOpen={isRenderModalOpen}
                onClose={() => setIsRenderModalOpen(false)}
                onAdd={handlePhotoAdd}
                tags={['Render']}
            />

            {/* Full Screen Image Viewer */}
            {selectedFullScreenImage && (
                <div
                    className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300 overflow-hidden"
                    onClick={() => setSelectedFullScreenImage(null)}
                >
                    <button
                        className="absolute top-6 right-6 p-3 bg-black/40 hover:bg-black/60 rounded-full text-white transition-all z-50 border border-white/10"
                        onClick={() => setSelectedFullScreenImage(null)}
                    >
                        <X className="w-8 h-8" />
                    </button>

                    {isArchitect && (
                        <button
                            className="absolute top-6 right-24 p-3 bg-black/40 hover:bg-red-500/80 rounded-full text-white transition-all z-50 border border-white/10 group"
                            onClick={(e) => {
                                e.stopPropagation();
                                setItemToDelete(selectedFullScreenImage.id);
                                setIsDeleteModalOpen(true);
                            }}
                            title="Delete Render"
                        >
                            <Trash2 className="w-8 h-8 group-hover:scale-110 transition-transform" />
                        </button>
                    )}

                    <div
                        className="relative w-full h-full flex items-center justify-center"
                        onClick={e => e.stopPropagation()}
                    >
                        <img
                            src={selectedFullScreenImage.previewUrl}
                            alt={selectedFullScreenImage.title}
                            className="w-full h-full object-contain"
                        />

                        {/* Overlay Metadata */}
                        <div className="absolute bottom-0 left-0 right-0 p-12 bg-linear-to-t from-black/80 to-transparent pointer-events-none">
                            <div className="max-w-4xl mx-auto space-y-2">
                                <h2 className="text-4xl font-black text-white drop-shadow-lg">{selectedFullScreenImage.title}</h2>
                                {selectedFullScreenImage.description && (
                                    <p className="text-xl text-white/80 font-medium max-w-2xl drop-shadow-md">{selectedFullScreenImage.description}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={() => {
                    handleRemovePhoto(itemToDelete);
                    if (selectedFullScreenImage?.id === itemToDelete) {
                        setSelectedFullScreenImage(null);
                    }
                    setItemToDelete(null);
                }}
            />
        </div>
    );
}
