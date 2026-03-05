'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';

import { useGetMoodboard, useDeleteMoodboard, useUpdateMoodboard, useGetMoodboardsByProject } from '@/hooks/useMoodboard';
import { useUpdateEstimatedCost } from '@/hooks/useEstimatedCost';
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
    Trash2, ChevronRight, Minus, ImagePlus, Search, List, ChevronDown
} from 'lucide-react';
import {
    getProductImageUrl, getProductName, getProductCategory,
    getProductBrand, getProductThumbnail
} from '@/lib/productUtils';

// Visualizer components
import MaterialPanel from '@/components/visualizer/MaterialPanel';
import CanvasPreview from '@/components/visualizer/CanvasPreview';
import PhotoUploadModal from '@/components/moodboard/PhotoUploadModal';
import CardContextMenu from '@/components/moodboard/CardContextMenu';

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
    { id: 'export', label: 'Export', icon: TableProperties },
    { id: 'download', label: 'Download', icon: FolderDown },
];

export default function MoodboardDetailPage() {
    const { projectId, moodboardId } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated } = useAuth();

    const initialTab = searchParams.get('tab') || 'overview';
    const [activeTab, setActiveTab] = useState(initialTab);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [menuOpen, setMenuOpen] = useState(false);
    const [brandFilterOpen, setBrandFilterOpen] = useState(false);
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [addCardOpen, setAddCardOpen] = useState(false);

    // Photo upload modal
    const [photoModalOpen, setPhotoModalOpen] = useState(false);
    // Custom photos: [{ id, title, description, previewUrl, status }]
    const [customPhotos, setCustomPhotos] = useState([]);
    // Per-product status map: { [productId]: 'Considering' | 'Specified' | 'Excluded' }
    const [productStatuses, setProductStatuses] = useState({});
    // Right-click context menu
    const [contextMenu, setContextMenu] = useState(null); // { x, y, itemId, isPhoto }

    // Canvas state (Design Desk)
    const [boardItems, setBoardItems] = useState([]);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [stagedMaterial, setStagedMaterial] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const isDataLoaded = useRef(false);

    const { data: moodboardData, isLoading } = useGetMoodboard(moodboardId);
    const { data: siblingData } = useGetMoodboardsByProject(projectId);
    const deleteMutation = useDeleteMoodboard();
    const updateEstimationMutation = useUpdateEstimatedCost();
    const { mutate: updateMoodboard, isPending: isUpdatingName } = useUpdateMoodboard();
    const queryClient = useQueryClient();
    const { mutate: addToCartBackend } = useAddToCart();

    const moodboard = moodboardData?.data;
    const project = moodboard?.projectId;
    const estimation = moodboard?.estimatedCostId;
    const products = estimation?.productIds || [];
    const siblingBoards = (siblingData?.data || []).filter(b => b._id !== moodboardId);

    useEffect(() => { setIsMounted(true); }, []);

    useEffect(() => {
        isDataLoaded.current = false;
    }, [moodboardId]);

    useEffect(() => {
        if (moodboard) {
            if (moodboard.moodboard_name) setEditName(moodboard.moodboard_name);
            if (!isDataLoaded.current) {
                const state = Array.isArray(moodboard.canvasState) ? moodboard.canvasState : [];
                setBoardItems(state);
                // Restore custom photos (title/description/status but not blob URLs which are ephemeral)
                if (Array.isArray(moodboard.customPhotos)) setCustomPhotos(moodboard.customPhotos);
                // Restore product statuses
                if (moodboard.productMetadata) setProductStatuses(moodboard.productMetadata);
                isDataLoaded.current = true;
            }
        }
    }, [moodboard]);

    // Materials from estimation for Material Panel
    const materials = useMemo(() => {
        if (!moodboard?.estimatedCostId?.productIds) return [];
        return moodboard.estimatedCostId.productIds;
    }, [moodboard]);

    // Budget
    const totalBudget = useMemo(() => {
        return boardItems.filter(i => i.type !== 'text').reduce((sum, item) => {
            return sum + (Number(item.price) || 0) * (Number(item.quantity) || 1);
        }, 0);
    }, [boardItems]);

    /* ── Backend save ───────────────────────────── */
    const saveToBackend = useCallback((items) => {
        if (!moodboardId || !isDataLoaded.current) return;
        setIsSaving(true);
        const budget = items.filter(i => i.type !== 'text').reduce((sum, item) => {
            return sum + (Number(item.price) || 0) * (Number(item.quantity) || 1);
        }, 0);
        updateMoodboard({ id: moodboardId, data: { canvasState: items, totalBudget: budget } }, {
            onSettled: () => setTimeout(() => setIsSaving(false), 2000)
        });
    }, [moodboardId, updateMoodboard]);

    useEffect(() => {
        if (!isDataLoaded.current) return;
        const timer = setTimeout(() => saveToBackend(boardItems), 1000);
        return () => clearTimeout(timer);
    }, [boardItems, saveToBackend]);

    /* ── Board handlers ─────────────────────────── */
    const handleDrop = useCallback((material, x, y) => {
        const { price } = resolvePricing(material);
        setBoardItems(prev => {
            const next = [...prev, { id: Date.now() + Math.random(), type: 'material', material, x, y, scale: 1, rotation: 0, quantity: 1, price }];
            saveToBackend(next);
            return next;
        });
        setSelectedMaterial(material);
        setStagedMaterial(null);
    }, [saveToBackend]);

    const handleAddText = useCallback((x, y) => {
        const newId = Date.now() + Math.random();
        setBoardItems(prev => {
            const next = [...prev, { id: newId, type: 'text', text: '', fontSize: 32, fontWeight: 'bold', textColor: '#1a1a1a', x, y }];
            saveToBackend(next);
            return next;
        });
        return newId;
    }, [saveToBackend]);

    const handleReposition = useCallback((id, x, y) => {
        setBoardItems(prev => prev.map(item => item.id === id ? { ...item, x, y } : item));
    }, []);

    const handleUpdateItem = useCallback((id, updates) => {
        setBoardItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    }, []);

    const handleRemoveItem = useCallback((id) => {
        setBoardItems(prev => {
            const next = prev.filter(item => item.id !== id);
            saveToBackend(next);
            return next;
        });
    }, [saveToBackend]);

    const handleClearBoard = useCallback(() => {
        setBoardItems([]);
        setSelectedMaterial(null);
        setStagedMaterial(null);
        saveToBackend([]);
    }, [saveToBackend]);

    const handleSave = useCallback(() => {
        saveToBackend(boardItems);
    }, [boardItems, saveToBackend]);

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
    const handlePhotoAdd = useCallback(({ file, previewUrl, title, description }) => {
        const photoId = 'photo_' + Date.now();
        const newPhoto = {
            id: photoId,
            title,
            description,
            previewUrl, // Base64 now
            status: 'Considering',
        };
        setCustomPhotos(prev => {
            const next = [...prev, newPhoto];
            updateMoodboard({ id: moodboardId, data: { customPhotos: next } });
            return next;
        });

        // Also add to Canvas
        const pseudoMaterial = {
            _id: photoId,
            name: title,
            isCustomPhoto: true,
            photoUrl: previewUrl,
            images: [previewUrl],
            category: 'My Photo',
            brand: 'Custom Upload',
        };
        // Add to boardItems so it shows on Design Desk canvas
        handleDrop(pseudoMaterial, 400, 300);

        toast.success(`"${title}" added to Overview and Canvas!`);
    }, [moodboardId, updateMoodboard, handleDrop]);

    /* ── Status Handlers ───────────────────────── */
    const handlePhotoStatusChange = useCallback((photoId, status) => {
        setCustomPhotos(prev => {
            const next = prev.map(p => p.id === photoId ? { ...p, status } : p);
            const toSave = next.map(({ previewUrl: _url, ...rest }) => rest);
            updateMoodboard({ id: moodboardId, data: { customPhotos: toSave } });
            return next;
        });
    }, [moodboardId, updateMoodboard]);

    const handleProductStatusChange = useCallback((productId, status) => {
        setProductStatuses(prev => {
            const next = { ...prev, [productId]: status };
            updateMoodboard({ id: moodboardId, data: { productMetadata: next } });
            return next;
        });
    }, [moodboardId, updateMoodboard]);

    const handleRemovePhoto = useCallback((photoId) => {
        // Remove from Overview customPhotos
        setCustomPhotos(prev => {
            const next = prev.filter(p => p.id !== photoId);
            updateMoodboard({ id: moodboardId, data: { customPhotos: next } });
            return next;
        });
        // Remove from Canvas boardItems
        setBoardItems(prev => {
            const next = prev.filter(item => item.material?._id !== photoId);
            saveToBackend(next);
            return next;
        });
        toast.success('Photo removed from board');
    }, [moodboardId, updateMoodboard, saveToBackend]);

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
            saveToBackend(next);
            return next;
        });
        toast.success('Product removed from board');
    }, [estimation, products, updateEstimationMutation, moodboardId, queryClient, saveToBackend]);

    /* ── Context Menu ──────────────────────────── */
    const openContextMenu = useCallback((e, itemId, isPhoto) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, itemId, isPhoto });
    }, []);

    /* ── CSV Export ─────────────────────────────── */
    const exportAsCSV = () => {
        const matsOnBoard = boardItems.filter(i => i.type !== 'text');

        // Unify all overview items (products + custom photos)
        const allOverviewItems = [
            ...products.map(p => ({ isPhoto: false, data: p })),
            ...customPhotos.map(p => ({ isPhoto: true, data: p }))
        ];

        if (allOverviewItems.length === 0) { toast.error('No materials to export'); return; }

        const source = allOverviewItems.map(({ isPhoto, data }) => {
            const id = isPhoto ? data.id : data._id;
            // Check if this item is on the canvas to get quantity and price
            const canvasInstances = matsOnBoard.filter(i => i.material?._id === id);
            const totalQty = canvasInstances.length > 0 ? canvasInstances.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0) : 1;
            const price = canvasInstances.length > 0 ? canvasInstances[0].price : 0; // Using first instance price if applicable

            return {
                name: isPhoto ? data.title : getProductName(data),
                category: isPhoto ? 'Uploaded Image' : getProductCategory(data),
                brand: isPhoto ? 'Custom Upload' : getProductBrand(data),
                sku: isPhoto ? '—' : (data?.skucode || data?.productId?.skucode || ''),
                qty: totalQty,
                price: price || 0,
                status: isPhoto ? (data.status || 'Considering') : (productStatuses[id] || 'Considering')
            };
        });

        const headers = ['Name', 'Spec Status', 'Project Name', 'Tags', 'Brand', 'Manufacturer SKU'];
        const rows = source.map(r => [r.name, r.status, project?.projectName || 'ArcMat', 'Add tag', r.brand, r.sku]
            .map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${(moodboard?.moodboard_name || 'moodboard').replace(/\s+/g, '-')}-export.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('CSV exported!');
    };

    if (isLoading || !isMounted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 text-[#d9a88a] animate-spin mb-3" />
                <p className="text-gray-400 font-semibold text-sm">Loading board...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-white overflow-hidden">
            {/* ── Header ───────────────────────────────── */}
            <div className="px-8 pt-6 pb-0 border-b border-gray-100 bg-white">
                <div className="flex items-start justify-between mb-4">
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
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-1.5 text-gray-300 hover:text-gray-500 rounded-lg opacity-0 group-hover/title:opacity-100 transition-all"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        <p className="text-sm text-gray-400 font-medium">
                            {moodboard?.description || 'Enter a description for the board'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <div className="relative">
                            <button
                                onClick={() => setMenuOpen(o => !o)}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                            >
                                <MoreHorizontal className="w-5 h-5" />
                            </button>
                            {menuOpen && (
                                <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50">
                                    <button
                                        onClick={() => { setIsEditing(true); setMenuOpen(false); }}
                                        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                                    >
                                        <Edit2 className="w-4 h-4" /> Rename
                                    </button>
                                    <button
                                        onClick={() => {
                                            setMenuOpen(false);
                                            if (window.confirm('Delete this moodboard?')) {
                                                deleteMutation.mutate(moodboardId, {
                                                    onSuccess: () => router.push(`/dashboard/projects/${projectId}/moodboards`)
                                                });
                                            }
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" /> Delete
                                    </button>
                                    {siblingBoards.length > 0 && (
                                        <>
                                            <div className="border-t border-gray-100 my-1" />
                                            <p className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Other Boards</p>
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
                            Project Board
                        </Link>
                    </div>
                </div>

                {/* ── Tab Navigation ─── */}
                <div className="flex items-center gap-0">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${activeTab === tab.id
                                ? 'border-[#1a1a2e] text-[#1a1a2e]'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Tab Content ─────────────────────────── */}
            <div className="flex-1 overflow-hidden">

                {/* OVERVIEW */}
                {activeTab === 'overview' && (
                    <div className="h-full overflow-y-auto p-8">
                        {/* Filter Bar */}
                        <div className="flex items-center gap-3 mb-6 relative">
                            {/* Brand Filter */}
                            <div className="relative">
                                <button
                                    onClick={() => { setBrandFilterOpen(o => !o); }}
                                    className={`px-4 py-2 border rounded-full text-sm font-semibold transition-colors flex items-center gap-1.5 ${selectedBrands.length > 0
                                        ? 'bg-[#1a1a2e] text-white border-[#1a1a2e]'
                                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                        }`}
                                >
                                    Brands {selectedBrands.length > 0 && <span className="bg-white/20 text-white text-[10px] font-black rounded-full px-1.5">{selectedBrands.length}</span>}
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${brandFilterOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {brandFilterOpen && (
                                    <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50">
                                        <div className="px-3 pb-2">
                                            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                                                <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                <input
                                                    type="text"
                                                    placeholder="Search brands"
                                                    className="bg-transparent text-sm text-gray-700 outline-none w-full placeholder:text-gray-400"
                                                    onChange={() => { }}
                                                />
                                            </div>
                                        </div>
                                        <div className="max-h-48 overflow-y-auto">
                                            {[...new Set(products.map(p => getProductBrand(p)).filter(Boolean))].map(brand => (
                                                <label key={brand} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedBrands.includes(brand)}
                                                        onChange={() => setSelectedBrands(prev =>
                                                            prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
                                                        )}
                                                        className="w-4 h-4 rounded border-gray-300 accent-[#1a1a2e]"
                                                    />
                                                    <span className="text-sm text-gray-700 font-medium truncate">{brand}</span>
                                                </label>
                                            ))}
                                            {products.length > 0 && [...new Set(products.map(p => getProductBrand(p)).filter(Boolean))].length === 0 && (
                                                <p className="px-4 py-3 text-xs text-gray-400">No brands found</p>
                                            )}
                                        </div>
                                        {selectedBrands.length > 0 && (
                                            <div className="border-t border-gray-100 px-4 pt-2 pb-1">
                                                <button
                                                    onClick={() => setSelectedBrands([])}
                                                    className="text-sm text-[#d9a88a] font-semibold hover:underline"
                                                >
                                                    Clear all
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <button className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-semibold text-gray-600 hover:border-gray-300 transition-colors flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5" /> Tags
                            </button>

                            {/* Close dropdowns on outside click */}
                            {(brandFilterOpen || addCardOpen) && (
                                <div className="fixed inset-0 z-40" onClick={() => { setBrandFilterOpen(false); setAddCardOpen(false); }} />
                            )}
                        </div>

                        {/* Photo upload modal (no hidden input needed) */}
                        <PhotoUploadModal
                            isOpen={photoModalOpen}
                            onClose={() => setPhotoModalOpen(false)}
                            onAdd={handlePhotoAdd}
                        />

                        {/* Context menu (rendered at root level so it escapes overflow) */}
                        {contextMenu && (
                            <CardContextMenu
                                x={contextMenu.x}
                                y={contextMenu.y}
                                isPhoto={contextMenu.isPhoto}
                                currentStatus={
                                    contextMenu.isPhoto
                                        ? customPhotos.find(p => p.id === contextMenu.itemId)?.status ?? 'Considering'
                                        : productStatuses[contextMenu.itemId] ?? 'Considering'
                                }
                                onStatusChange={(status) => {
                                    if (contextMenu.isPhoto) handlePhotoStatusChange(contextMenu.itemId, status);
                                    else handleProductStatusChange(contextMenu.itemId, status);
                                }}
                                onRemove={() => {
                                    if (contextMenu.isPhoto) handleRemovePhoto(contextMenu.itemId);
                                    else handleRemoveProduct(contextMenu.itemId);
                                }}
                                onEditTitle={contextMenu.isPhoto ? () => {
                                    // Simple: re-open modal pre-filled (future enhancement)
                                    toast.info('Edit via the product list');
                                } : null}
                                onClose={() => setContextMenu(null)}
                            />
                        )}

                        {products.length === 0 && customPhotos.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-gray-200 rounded-3xl text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                                    <ShoppingCart className="w-7 h-7 text-gray-300" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-600 mb-2">No materials yet</h3>
                                <p className="text-sm text-gray-400 mb-6 max-w-sm">Add products from the catalog or upload custom images.</p>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => {
                                            useProjectStore.getState().setActiveMoodboard(moodboardId, moodboard?.moodboard_name, projectId, project?.projectName || '');
                                            router.push('/productlist');
                                        }}
                                        className="px-6 py-3 bg-[#1a1a2e] text-white font-bold rounded-2xl hover:bg-[#2d2d4a] transition-colors flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" /> Add Products
                                    </button>
                                    <button
                                        onClick={() => setPhotoModalOpen(true)}
                                        className="px-6 py-3 border border-[#d9a88a] text-[#d9a88a] font-bold rounded-2xl hover:bg-[#fef7f2] transition-colors flex items-center gap-2"
                                    >
                                        <ImagePlus className="w-4 h-4" /> Upload Image
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {/* + Add Card */}
                                <div className="relative">
                                    <button
                                        onClick={() => setAddCardOpen(o => !o)}
                                        className="w-full border-2 border-dashed border-[#d9a88a]/40 rounded-2xl flex flex-col items-center justify-center gap-2 min-h-[220px] cursor-pointer hover:border-[#d9a88a] hover:bg-[#fef7f2] transition-all group bg-[#fef7f2]/50"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-[#d9a88a]/10 flex items-center justify-center">
                                            <Plus className="w-5 h-5 text-[#d9a88a]" />
                                        </div>
                                        <span className="text-xs font-semibold text-[#d9a88a] text-center px-2">Images, Video &amp; Pinterest</span>
                                    </button>
                                    {addCardOpen && (
                                        <div className="absolute top-2 left-full ml-2 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50">
                                            <button
                                                onClick={() => {
                                                    setAddCardOpen(false);
                                                    useProjectStore.getState().setActiveMoodboard(moodboardId, moodboard?.moodboard_name, projectId, project?.projectName || '');
                                                    router.push('/productlist');
                                                }}
                                                className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                                            >
                                                <div className="w-7 h-7 bg-[#1a1a2e] rounded-lg flex items-center justify-center shrink-0">
                                                    <List className="w-4 h-4 text-white" />
                                                </div>
                                                Browse Product List
                                            </button>
                                            <button
                                                onClick={() => { setAddCardOpen(false); setPhotoModalOpen(true); }}
                                                className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                                            >
                                                <div className="w-7 h-7 bg-[#d9a88a] rounded-lg flex items-center justify-center shrink-0">
                                                    <ImagePlus className="w-4 h-4 text-white" />
                                                </div>
                                                Upload Photo
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Custom uploaded photos */}
                                {customPhotos.map((photo) => (
                                    <div
                                        key={photo.id}
                                        onContextMenu={(e) => openContextMenu(e, photo.id, true)}
                                        className="flex flex-col border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-all group cursor-context-menu"
                                    >
                                        <div className="relative aspect-square bg-gray-100 overflow-hidden">
                                            {photo.previewUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={photo.previewUrl} alt={photo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                                    <ImagePlus className="w-8 h-8 text-gray-300" />
                                                </div>
                                            )}
                                            {/* Status dot */}
                                            <StatusDot status={photo.status} />
                                        </div>
                                        <div className="p-3 flex flex-col gap-0.5 flex-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Uploaded Image</p>
                                            <p className="text-sm font-bold text-[#1a1a2e] leading-snug line-clamp-2">{photo.title}</p>
                                            {photo.description && <p className="text-xs text-gray-400 truncate">{photo.description}</p>}
                                        </div>
                                    </div>
                                ))}

                                {/* Product cards */}
                                {products
                                    .filter(p => selectedBrands.length === 0 || selectedBrands.includes(getProductBrand(p)))
                                    .map((product, i) => {
                                        const imgUrl = getProductThumbnail(product);
                                        const name = getProductName(product);
                                        const brand = getProductBrand(product);
                                        const category = getProductCategory(product);
                                        const hasVariants = (typeof product.productId === 'object' ? product.productId?.variants?.length : 0) || 0;
                                        const productId = product._id;
                                        const status = productStatuses[productId] ?? 'Considering';

                                        return (
                                            <div
                                                key={`${productId || 'p'}-${i}`}
                                                onContextMenu={(e) => openContextMenu(e, productId, false)}
                                                className="flex flex-col border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-all group cursor-context-menu"
                                            >
                                                <div className="relative aspect-square bg-gray-50 overflow-hidden">
                                                    {imgUrl && imgUrl !== '/Icons/arcmatlogo.svg' ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={imgUrl} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                            <Building2 className="w-8 h-8 text-gray-300" />
                                                        </div>
                                                    )}
                                                    {/* Status dot */}
                                                    <StatusDot status={status} />
                                                </div>
                                                <div className="p-3 flex flex-col gap-1 flex-1">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{hasVariants > 0 ? `${hasVariants} Finishes` : '0 Finishes'}</p>
                                                    <p className="text-sm font-bold text-[#1a1a2e] leading-snug line-clamp-2">{brand}</p>
                                                    <p className="text-xs text-gray-400 truncate">{name}</p>
                                                    <div className="mt-auto pt-2">
                                                        {hasVariants > 0 ? (
                                                            <button className="w-full py-2 border border-gray-200 text-xs font-bold text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
                                                                Sample Finishes
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleAddToCart(product)}
                                                                className="w-full py-2 bg-[#1a1a2e] text-white text-xs font-bold rounded-xl hover:bg-[#2d2d4a] transition-colors flex items-center justify-center gap-1"
                                                            >
                                                                <ShoppingCart className="w-3 h-3" /> Add to Cart
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </div>
                )}


                {/* DESIGN DESK */}
                {activeTab === 'designDesk' && isMounted && (
                    <div className="flex h-full">
                        {/* Left Material Panel */}
                        <div className="w-[220px] shrink-0 border-r border-gray-200 bg-white overflow-hidden">
                            <MaterialPanel
                                materials={materials}
                                selectedMaterial={selectedMaterial}
                                stagedMaterial={stagedMaterial}
                                onSelect={handleMaterialSelect}
                            />
                        </div>

                        {/* Canvas */}
                        <div className="flex-1 flex flex-col min-w-0">
                            <CanvasPreview
                                projectName={project?.projectName}
                                roomName={moodboard?.moodboard_name}
                                boardItems={boardItems}
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
                            />
                        </div>
                    </div>
                )}

                {/* EXPORT */}
                {activeTab === 'export' && (
                    <div className="h-full overflow-y-auto p-8">
                        {/* Toolbar */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" /></svg>
                                    Filter
                                </button>
                                <button className="p-2 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                                    <Edit2 className="w-4 h-4" /> Choose template
                                </button>
                                <button
                                    onClick={exportAsCSV}
                                    className="flex items-center gap-2 px-5 py-2 bg-[#1a1a2e] text-white rounded-xl text-sm font-bold hover:bg-[#2d2d4a] transition-colors"
                                >
                                    <Download className="w-4 h-4" /> Export
                                </button>
                                <button className="p-2 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors">
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="border border-gray-200 rounded-2xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Spec Status</th>
                                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Project Name</th>
                                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Tags</th>
                                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Brand</th>
                                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Manufacturer SKU</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {(products.length === 0 && customPhotos.length === 0) ? (
                                        <tr>
                                            <td colSpan={7} className="py-16 text-center text-gray-400 text-sm font-medium">
                                                No materials to export. Add products or images first.
                                            </td>
                                        </tr>
                                    ) : (
                                        [
                                            ...products.map(p => ({ isPhoto: false, data: p })),
                                            ...customPhotos.map(p => ({ isPhoto: true, data: p }))
                                        ].map(({ isPhoto, data }, i) => {
                                            const id = isPhoto ? data.id : data._id;
                                            const thumb = isPhoto ? (data.previewUrl || '/Icons/arcmatlogo.svg') : getProductThumbnail(data);
                                            const name = isPhoto ? data.title : getProductName(data);
                                            const brand = isPhoto ? 'Custom Upload' : getProductBrand(data);
                                            const sku = isPhoto ? '—' : (data?.skucode || (typeof data?.productId === 'object' ? data?.productId?.skucode : '') || '—');
                                            const st = isPhoto ? (data.status || 'Considering') : (productStatuses[id] || 'Considering');

                                            // Optional: calculate quantity based on canvas if we wanted to show it in the table
                                            // const onCanvasCount = boardItems.filter(ci => ci.material?._id === id && ci.type !== 'text').length;

                                            return (
                                                <tr key={`${id || 'item'}-${i}`} className="hover:bg-gray-50 transition-colors group">
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                <img src={thumb} alt={name} className="w-full h-full object-cover" />
                                                            </div>
                                                            <span className="font-semibold text-[#1a1a2e] truncate max-w-[180px]">{name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        {(() => {
                                                            const sty = STATUS_STYLES[st] || STATUS_STYLES['Considering'];
                                                            return (
                                                                <span className={`flex items-center gap-1.5 text-xs font-semibold ${sty.label}`}>
                                                                    <span className={`w-2 h-2 rounded-full shrink-0 ${sty.dot}`} />{st}
                                                                </span>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-gray-600 font-medium">{project?.projectName || 'ArcMat'}</td>
                                                    <td className="px-4 py-3.5">
                                                        <button className="text-xs text-gray-400 hover:text-[#d9a88a] font-medium transition-colors">Add tag</button>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-gray-700 font-medium">{brand || '—'}</td>
                                                    <td className="px-4 py-3.5 text-gray-500 font-mono text-xs">{sku}</td>
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400" title="Email"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></button>
                                                            {!isPhoto && (
                                                                <button
                                                                    onClick={() => handleAddToCart(data)}
                                                                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"
                                                                    title="Add to Cart"
                                                                >
                                                                    <ShoppingCart className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400" title="More"><MoreHorizontal className="w-4 h-4" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* DOWNLOAD */}
                {activeTab === 'download' && (
                    <div className="h-full overflow-y-auto p-8">
                        <h2 className="text-xl font-black text-[#1a1a2e] mb-2">Download Your Board</h2>
                        <p className="text-sm text-gray-400 mb-8">Export the canvas as an image or download a material spec sheet.</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl">
                            <DownloadCard
                                title="Canvas Image"
                                description="Download the design desk canvas as a high-res JPEG"
                                icon={<svg className="w-7 h-7 text-[#d9a88a]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                                label="Download JPEG"
                                onClick={() => {
                                    if (boardItems.length === 0) { toast.error('Canvas is empty. Add items first.'); return; }
                                    setActiveTab('designDesk');
                                    setTimeout(() => toast.info('Use the Download button in the canvas toolbar'), 500);
                                }}
                                color="orange"
                            />
                            <DownloadCard
                                title="Material CSV"
                                description="Export all materials as a spreadsheet with specs and pricing"
                                icon={<FileOutput className="w-7 h-7 text-green-500" />}
                                label="Download CSV"
                                onClick={exportAsCSV}
                                color="green"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function DownloadCard({ title, description, icon, label, onClick, color }) {
    const colors = {
        orange: 'border-[#d9a88a]/20 hover:border-[#d9a88a] bg-[#fef7f2]/50 hover:bg-[#fef7f2]',
        green: 'border-green-200 hover:border-green-400 bg-green-50/50 hover:bg-green-50',
    };
    const btnColors = {
        orange: 'bg-[#d9a88a] hover:bg-[#c59678] text-white',
        green: 'bg-green-600 hover:bg-green-700 text-white',
    };
    return (
        <div className={`flex flex-col gap-4 p-6 border-2 rounded-3xl transition-all ${colors[color]}`}>
            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center">{icon}</div>
            <div>
                <h3 className="font-black text-[#1a1a2e] text-base mb-1">{title}</h3>
                <p className="text-xs text-gray-400 font-medium leading-relaxed">{description}</p>
            </div>
            <button
                onClick={onClick}
                className={`mt-auto w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${btnColors[color]}`}
            >
                <Download className="w-4 h-4" /> {label}
            </button>
        </div>
    );
}
