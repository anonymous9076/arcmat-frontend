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
    Trash2, ChevronRight, Minus, ImagePlus, Search, List, ChevronDown,
    IndianRupee, CreditCard
} from 'lucide-react';
import ExcelJS from 'exceljs';
import {
    getProductImageUrl, getProductName, getProductCategory,
    getProductBrand, getProductThumbnail
} from '@/lib/productUtils';

// Visualizer components
import OverviewTab from '@/components/moodboard/tabs/OverviewTab';
import ExportTab from '@/components/moodboard/tabs/ExportTab';
import DownloadTab from '@/components/moodboard/tabs/DownloadTab';

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

    // Photo upload modal
    // Custom photos: [{ id, title, description, previewUrl, status }]
    const [customPhotos, setCustomPhotos] = useState([]);
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
                if (moodboard.canvasBackgroundColor) setCanvasBg(moodboard.canvasBackgroundColor);
                // Restore custom photos (title/description/status but not blob URLs which are ephemeral)
                if (Array.isArray(moodboard.customPhotos)) setCustomPhotos(moodboard.customPhotos);
                // Restore product statuses
                if (moodboard.productMetadata) setProductStatuses(moodboard.productMetadata);
                isDataLoaded.current = true;
            }
        }
    }, [moodboard]);

    // Materials from estimation + custom photos for Material Panel
    const materials = useMemo(() => {
        const base = moodboard?.estimatedCostId?.productIds || [];
        const photos = customPhotos.map(p => ({
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
        if (!moodboardId || !isDataLoaded.current) return;
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
    const handlePhotoAdd = useCallback(({ file, previewUrl, title, description, price, quantity }) => {
        const photoId = 'photo_' + Date.now();
        const newPhoto = {
            id: photoId,
            title,
            description,
            previewUrl, // Base64 now
            status: 'Considering',
            price: price || 0,
            quantity: quantity || 1
        };
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

    /* ── Status Handlers ───────────────────────── */
    const handlePhotoStatusChange = useCallback((photoId, status) => {
        setCustomPhotos(prev => {
            const next = prev.map(p => p.id === photoId ? { ...p, status } : p);
            updateMoodboard({ id: moodboardId, data: { customPhotos: next } });
            return next;
        });
    }, [moodboardId, updateMoodboard]);

    const handleProductStatusChange = useCallback((productId, status) => {
        setProductStatuses(prev => {
            const current = prev[productId];
            const next = {
                ...prev,
                [productId]: typeof current === 'object' ? { ...current, status } : { status }
            };
            updateMoodboard({ id: moodboardId, data: { productMetadata: next } });
            return next;
        });
    }, [moodboardId, updateMoodboard]);

    const handlePriceQtyUpdate = useCallback((id, updates, isPhoto) => {
        if (isPhoto) {
            setCustomPhotos(prev => {
                const next = prev.map(p => p.id === id ? { ...p, ...updates } : p);
                updateMoodboard({ id: moodboardId, data: { customPhotos: next } });
                return next;
            });
        } else {
            setProductStatuses(prev => {
                const current = prev[id];
                const next = {
                    ...prev,
                    [id]: typeof current === 'object' ? { ...current, ...updates } : { status: current || 'Considering', ...updates }
                };
                updateMoodboard({ id: moodboardId, data: { productMetadata: next } });
                return next;
            });
        }
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

    /* ── Excel Export ─────────────────────────────── */
    const exportAsCSV = async () => {
        const allOverviewItems = [
            ...products.map(p => ({ isPhoto: false, data: p })),
            ...customPhotos.map(p => ({ isPhoto: true, data: p }))
        ];

        if (allOverviewItems.length === 0) { toast.error('No materials to export'); return; }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Materials Export');

        // Setup Headers
        const headerRow = [
            'Product Image',
            'Name',
            'Spec Status',
            'Project Name',
            'Brand',
            'Manufacturer SKU',
            'Quantity',
            'Unit Price',
            'Total Cost'
        ];

        worksheet.getRow(1).values = headerRow;
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).height = 30;
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

        // Set column widths
        worksheet.columns = [
            { width: 25 }, // Image
            { width: 30 }, // Name
            { width: 15 }, // Status
            { width: 20 }, // Project
            { width: 20 }, // Brand
            { width: 20 }, // SKU
            { width: 10 }, // Qty
            { width: 15 }, // Price
            { width: 15 }  // Total
        ];

        let totalSum = 0;

        toast.loading('Preparing excel export with images...', { id: 'export-toast' });

        try {
            for (let i = 0; i < allOverviewItems.length; i++) {
                const { isPhoto, data } = allOverviewItems[i];
                const id = isPhoto ? data.id : data._id;
                const meta = isPhoto ? data : (productStatuses[id] || {});
                const st = isPhoto ? (data.status || 'Considering') : (typeof meta === 'object' ? meta.status : meta || 'Considering');
                const qty = Number(meta.quantity) || 1;

                let price = 0;
                if (isPhoto) {
                    price = Number(meta.price) || 0;
                } else {
                    if (typeof meta === 'object' && meta.price !== undefined) {
                        price = Number(meta.price);
                    } else {
                        const { price: defaultPrice } = resolvePricing(data);
                        price = defaultPrice;
                    }
                }
                const total = qty * price;
                totalSum += total;

                const currentRow = i + 2;
                const row = worksheet.getRow(currentRow);

                // Set text values
                row.getCell(2).value = isPhoto ? data.title : getProductName(data);
                row.getCell(3).value = st;
                row.getCell(4).value = project?.projectName || 'ArcMat';
                row.getCell(5).value = isPhoto ? 'Custom Upload' : getProductBrand(data);
                row.getCell(6).value = isPhoto ? '—' : (data?.skucode || data?.productId?.skucode || '');
                row.getCell(7).value = qty;
                row.getCell(8).value = price;
                row.getCell(9).value = total;

                row.height = 100; // Set height for image
                row.alignment = { vertical: 'middle', horizontal: 'center' };

                // Handle Image
                const thumbUrl = isPhoto ? (data.previewUrl || '') : getProductThumbnail(data);
                if (thumbUrl) {
                    try {
                        const response = await fetch(thumbUrl);
                        const buffer = await response.arrayBuffer();
                        const extension = thumbUrl.split('.').pop().split('?')[0].toLowerCase() || 'png';

                        const imageId = workbook.addImage({
                            buffer: buffer,
                            extension: extension === 'jpg' ? 'jpeg' : extension,
                        });

                        worksheet.addImage(imageId, {
                            tl: { col: 0, row: currentRow - 1 },
                            ext: { width: 120, height: 120 },
                            editAs: 'oneCell'
                        });
                    } catch (err) {
                        console.error('Failed to load image for row', i, err);
                        row.getCell(1).value = '(Image Failed)';
                    }
                }
            }

            // Add Grand Total Row
            const totalRowIndex = allOverviewItems.length + 2;
            const totalRow = worksheet.getRow(totalRowIndex);
            totalRow.getCell(8).value = 'GRAND TOTAL';
            totalRow.getCell(8).font = { bold: true };
            totalRow.getCell(9).value = totalSum;
            totalRow.getCell(9).font = { bold: true };
            totalRow.height = 30;
            totalRow.alignment = { vertical: 'middle' };

            // Generate and Download
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${(moodboard?.moodboard_name || 'moodboard').replace(/\s+/g, '-')}-export.xlsx`;
            link.click();
            URL.revokeObjectURL(url);

            toast.success('Excel exported successfully!', { id: 'export-toast' });
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Failed to export Excel', { id: 'export-toast' });
        }
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
                    <OverviewTab
                        products={products}
                        customPhotos={customPhotos}
                        productStatuses={productStatuses}
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
                        handleAddToCart={handleAddToCart}
                        router={router}
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
                                    className="absolute left-0 top-1/2 -translate-y-1/2 z-[60] bg-white border border-l-0 border-gray-200 p-1.5 rounded-r-xl shadow-md hover:bg-gray-50 transition-all group"
                                    title="Open Materials"
                                >
                                    <ChevronDown className="w-5 h-5 -rotate-90 text-gray-400 group-hover:text-[#d9a88a]" />
                                </button>
                            )}

                            {/* Left Material Panel */}
                            <div className={`shrink-0 border-r border-gray-200 bg-white overflow-hidden transition-all duration-300 ease-in-out ${isPanelOpen ? 'w-[260px]' : 'w-0'}`}>
                                <MaterialPanel
                                    materials={materials}
                                    selectedMaterial={selectedMaterial}
                                    stagedMaterial={stagedMaterial}
                                    onSelect={handleMaterialSelect}
                                    isOpen={isPanelOpen}
                                    onToggle={() => setIsPanelOpen(!isPanelOpen)}
                                />
                            </div>

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
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* EXPORT */}
                {activeTab === 'export' && (
                    <ExportTab
                        products={products}
                        customPhotos={customPhotos}
                        boardItems={boardItems}
                        productStatuses={productStatuses}
                        projectName={project?.projectName}
                        exportAsCSV={exportAsCSV}
                        handleAddToCart={handleAddToCart}
                        handlePriceQtyUpdate={handlePriceQtyUpdate}
                        handlePhotoStatusChange={handlePhotoStatusChange}
                        handleProductStatusChange={handleProductStatusChange}
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
            </div>
        </div>
    );
}
