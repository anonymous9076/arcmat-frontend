'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { resolvePricing } from '@/lib/productUtils';
import MaterialPanel from '@/components/visualizer/MaterialPanel';
import CanvasPreview from '@/components/visualizer/CanvasPreview';
import DetailsPanel from '@/components/visualizer/DetailsPanel';
import ProjectDrawer from '@/components/visualizer/ProjectDrawer';
import { Loader2, ChevronLeft, ChevronRight, Layout } from 'lucide-react';
import useAuthStore from '@/store/useAuthStore';
import useProjectStore from '@/store/useProjectStore';
import { useGetMoodboard, useUpdateMoodboard } from '@/hooks/useMoodboard';
import Link from 'next/link';

export default function VisualizerPage() {
    const { user } = useAuthStore();
    const { activeMoodboardId } = useProjectStore();

    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [stagedMaterial, setStagedMaterial] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [savedMaterials, setSavedMaterials] = useState([]);
    const [boardItems, setBoardItems] = useState([]);
    const [isMounted, setIsMounted] = useState(false);
    const [leftOpen, setLeftOpen] = useState(true);
    const [rightOpen, setRightOpen] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const { data: moodboardData, isLoading: moodboardLoading } = useGetMoodboard(activeMoodboardId);
    const { mutate: updateMoodboard } = useUpdateMoodboard();

    const moodboard = moodboardData?.data;
    const isDataLoaded = useRef(false);

    useEffect(() => {
        setIsMounted(true);

        // Auto-collapse panels on small screens
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setLeftOpen(false);
            }
            if (window.innerWidth < 768) {
                setRightOpen(false);
            }
        };

        handleResize(); // Check initial size
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Load canvas state from backend once per moodboard
    useEffect(() => {
        isDataLoaded.current = false;
    }, [activeMoodboardId]);

    useEffect(() => {
        if (moodboard && !isDataLoaded.current) {
            const state = Array.isArray(moodboard.canvasState) ? moodboard.canvasState : [];
            setBoardItems(state);
            isDataLoaded.current = true;
        }
    }, [moodboard]);

    // Budget derived from board items
    const { totalBudget, materialCount } = useMemo(() => {
        if (!isMounted) return { totalBudget: 0, materialCount: 0 };
        const mats = boardItems.filter(i => i.type !== 'text');
        const total = mats.reduce((sum, item) => {
            const itemPrice = Number(item.price) || 0;
            const itemQty = Number(item.quantity) || 1;
            return sum + (itemPrice * itemQty);
        }, 0);
        return { totalBudget: total, materialCount: mats.length };
    }, [boardItems, isMounted]);

    // Materials for left panel
    const materials = useMemo(() => {
        if (!moodboard?.estimatedCostId?.productIds) return [];
        const products = moodboard.estimatedCostId.productIds;
        return products.length > 0 ? products : [];
    }, [moodboard]);

    /* ── Backend save ────────────────────────── */
    const saveToBackend = useCallback((items) => {
        if (!activeMoodboardId || !isDataLoaded.current) return;
        setIsSaving(true);
        const serializable = items;

        // Calculate budget locally to ensure it's in sync with 'items'
        const budget = items.filter(i => i.type !== 'text').reduce((sum, item) => {
            const itemPrice = Number(item.price) || 0;
            const itemQty = Number(item.quantity) || 1;
            return sum + (itemPrice * itemQty);
        }, 0);

        updateMoodboard({
            id: activeMoodboardId,
            data: {
                canvasState: serializable,
                totalBudget: budget
            }
        }, {
            onSettled: () => setTimeout(() => setIsSaving(false), 2000)
        });
    }, [activeMoodboardId, updateMoodboard]);

    useEffect(() => {
        if (!isDataLoaded.current) return;
        const timer = setTimeout(() => saveToBackend(boardItems), 1000);
        return () => clearTimeout(timer);
    }, [boardItems, saveToBackend]);

    /* ── Board handlers ────────────────────────── */
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

    const handlePhaseUpdate = useCallback((newPhase) => {
        updateMoodboard({
            id: activeMoodboardId,
            data: { phase: newPhase }
        });
    }, [activeMoodboardId, updateMoodboard]);

    const handleMaterialSelect = useCallback((material) => {
        setSelectedMaterial(material);
        setStagedMaterial(material);
    }, []);

    const handleStagedPlace = useCallback((x, y) => {
        if (!stagedMaterial) return;
        handleDrop(stagedMaterial, x, y);
    }, [stagedMaterial, handleDrop]);

    const handleVariantChange = useCallback((variant) => setSelectedMaterial(variant), []);
    const handleAddToDrawer = useCallback((material) => {
        setSavedMaterials(prev => prev.some(m => m._id === material._id) ? prev : [...prev, material]);
    }, []);
    const handleRemoveFromDrawer = useCallback((id) => {
        setSavedMaterials(prev => prev.filter(m => m._id !== id));
    }, []);

    if (!isMounted) return null;

    if (!activeMoodboardId) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#f8f7f5] p-8">
                <div className="bg-white p-12 rounded-[40px] border border-gray-100 shadow-sm text-center max-w-xl">
                    <div className="w-24 h-24 bg-[#fef7f2] rounded-3xl flex items-center justify-center mx-auto mb-8">
                        <Layout className="w-12 h-12 text-[#d9a88a]" />
                    </div>
                    <h2 className="text-3xl font-black text-[#2d3142] mb-4">No Moodboard Selected</h2>
                    <p className="text-gray-500 font-medium mb-8">
                        The Visualizer needs to be linked to a specific design. Please go to your projects, select a moodboard, and click &quot;Visualize&quot;.
                    </p>
                    <Link href="/dashboard/projects" className="inline-flex items-center justify-center px-8 py-4 bg-[#d9a88a] text-white rounded-2xl font-bold hover:bg-[#c59678] transition-all shadow-lg shadow-orange-100">
                        Go to My Projects
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-1 h-screen bg-[#f8f7f5] overflow-hidden rounded-tl-2xl">

            {/* LEFT PANEL */}
            <div
                className="relative flex flex-col h-full border-r border-gray-200 shadow-sm overflow-hidden transition-all duration-300 bg-white"
                style={{ width: leftOpen ? 224 : 0, minWidth: leftOpen ? 224 : 0 }}
            >
                {moodboardLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-[#d9a88a]" />
                    </div>
                ) : (
                    <MaterialPanel
                        materials={materials}
                        selectedMaterial={selectedMaterial}
                        stagedMaterial={stagedMaterial}
                        onSelect={handleMaterialSelect}
                    />
                )}
            </div>

            <button
                onClick={() => setLeftOpen(o => !o)}
                className="relative z-20 self-center -mx-px w-5 h-12 bg-white border border-gray-200 rounded-r-lg flex items-center justify-center shadow-sm hover:bg-gray-50 hover:shadow transition-all shrink-0"
                title={leftOpen ? 'Collapse panel' : 'Expand panel'}
            >
                {leftOpen ? <ChevronLeft className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
            </button>

            {/* CENTER: Canvas */}
            <div className="flex-1 flex flex-col h-full relative min-w-0">
                {moodboardLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-12 h-12 text-[#d9a88a] animate-spin" />
                    </div>
                ) : (
                    <CanvasPreview
                        projectName={moodboard?.projectId?.projectName}
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
                        onDrawerToggle={() => setDrawerOpen(p => !p)}
                    />
                )}

                <ProjectDrawer
                    isOpen={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    savedMaterials={savedMaterials}
                    onAdd={handleAddToDrawer}
                    onRemove={handleRemoveFromDrawer}
                    selectedMaterial={selectedMaterial}
                />
            </div>

            <button
                onClick={() => setRightOpen(o => !o)}
                className="relative z-20 self-center -mx-px w-5 h-12 bg-white border border-gray-200 rounded-l-lg flex items-center justify-center shadow-sm hover:bg-gray-50 hover:shadow transition-all shrink-0"
                title={rightOpen ? 'Collapse panel' : 'Expand panel'}
            >
                {rightOpen ? <ChevronRight className="w-3.5 h-3.5 text-gray-400" /> : <ChevronLeft className="w-3.5 h-3.5 text-gray-400" />}
            </button>

            {/* RIGHT PANEL */}
            <div
                className="flex flex-col h-full border-l border-gray-200 overflow-hidden transition-all duration-300 bg-white"
                style={{ width: rightOpen ? 288 : 0, minWidth: rightOpen ? 288 : 0 }}
            >
                <DetailsPanel
                    selectedMaterial={selectedMaterial}
                    onVariantChange={handleVariantChange}
                    totalBudget={totalBudget}
                    materialCount={materialCount}
                    boardItems={boardItems}
                    onUpdateItem={handleUpdateItem}
                    currentPhase={moodboard?.projectId?.phase}
                    onPhaseUpdate={handlePhaseUpdate}
                    projectId={moodboard?.projectId?._id}
                    moodboardId={activeMoodboardId}
                    projectBudget={moodboard?.projectId?.budget}
                />
            </div>
        </div>
    );
}