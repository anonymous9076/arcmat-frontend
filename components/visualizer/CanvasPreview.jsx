'use client';

import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
    Lock, LockOpen, Trash, Trash2, Save, Download, Move, CornerUpLeft,
    Type, ImagePlus, ArrowUpToLine, ArrowDownToLine, Focus,
    Plus, Minus, Wand2, Loader2, FileOutput, Grid3x3
} from 'lucide-react';
import { getProductName, getProductCategory } from '@/lib/productUtils';
import { useFabricCanvas } from './useFabricCanvas';

const TOOLBAR_W = 44;

const CanvasPreview = forwardRef((props, ref) => {
    const {
        onMaterialSelect,
        boardItems,
        onDrop,
        onReposition,
        onUpdateItem,
        onAddText,
        onClear,
        onRemoveItem,
        onSave,
        autoSaving = false,
        projectName = 'My Project',
        roomName = 'Living Room',
        isArchitect = true,
    } = props;
    const photoInputRef = useRef(null);
    const canvasContainerRef = useRef(null);
    const containerRef = useRef({ width: window.innerWidth, height: window.innerHeight });

    const [saving, setSaving] = useState(false);
    const [exportPDFLoading, setExportPDFLoading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [adjustProp, setAdjustProp] = useState(null);

    const {
        canvasRef,
        zoom,
        setZoom,
        panMode,
        setPanMode,
        lockedIds,
        selectedIds,
        zoomIn,
        zoomOut,
        resetZoom,
        deleteSelection,
        toggleLock,
        groupSelection,
        ungroupSelection,
        bringForward,
        sendBackward,
        exportHighRes,
        updateFabricObject,
        removeSelectedBackground,
        isProcessingBg,
        bgProgress,
        activeMenuConfig,
        showGrid,
        setShowGrid,
        getSerializedState
    } = useFabricCanvas({
        canvasContainerRef,
        boardItems,
        onUpdateItem,
        onRemoveItem,
        onReposition,
        onMaterialSelect,
        initialWidth: containerRef.current.width,
        initialHeight: containerRef.current.height,
        canvasBg: props.canvasBg
    });

    useImperativeHandle(ref, () => ({
        download: (format = 'jpeg') => {
            if (boardItems.length === 0) return false;
            exportHighRes(projectName, format);
            return true;
        },
        getLatestState: () => {
            return getSerializedState();
        }
    }));

    const filledCount = boardItems.length;

    useEffect(() => {
        if (!activeMenuConfig) setAdjustProp(null);
    }, [activeMenuConfig]);

    /* ── Photo Upload ─────────────────────────────────── */
    const handlePhotoUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target.result;
            const pseudoMaterial = {
                _id: 'photo_' + Date.now(),
                name: file.name.replace(/\.[^.]+$/, ''),
                isCustomPhoto: true,
                photoUrl: base64,
                images: [base64],
                category: 'My Photo',
            };
            onDrop(pseudoMaterial, containerRef.current.width / 2, containerRef.current.height / 2);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    /* ── Save & Undo ─────────────────────────────────── */
    const handleSave = useCallback(() => {
        setSaving(true);
        onSave?.();
        setTimeout(() => setSaving(false), 1500);
    }, [onSave]);

    const handleUndo = useCallback(() => {
        if (boardItems.length > 0) onRemoveItem(boardItems[boardItems.length - 1].id);
    }, [boardItems, onRemoveItem]);

    /* ── Keyboard Shortcuts ───────────────────────────── */
    useEffect(() => {
        const handleKeyDown = (e) => {
            const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
            if (isInput) return;

            if (!isArchitect) {
                // Allow zoom and pan even for clients
                if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) { e.preventDefault(); zoomIn(); }
                if ((e.ctrlKey || e.metaKey) && e.key === '-') { e.preventDefault(); zoomOut(); }
                return;
            }

            if ((e.ctrlKey || e.metaKey) && e.key === ']') { e.preventDefault(); bringForward(); }
            if ((e.ctrlKey || e.metaKey) && e.key === '[') { e.preventDefault(); sendBackward(); }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') { e.preventDefault(); groupSelection(); }
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'g') { e.preventDefault(); ungroupSelection(); }

            if (e.key === 'Delete' || e.key === 'Backspace') { deleteSelection(); e.preventDefault(); }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); handleUndo(); }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); handleSave(); }
            if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) { e.preventDefault(); zoomIn(); }
            if ((e.ctrlKey || e.metaKey) && e.key === '-') { e.preventDefault(); zoomOut(); }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUndo, handleSave, zoomIn, zoomOut, deleteSelection, bringForward, sendBackward, groupSelection, ungroupSelection, isArchitect]);

    /* ── Drag & Drop ─────────────────────────────────── */
    const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setIsDragOver(true); };
    const handleDropEvent = (e) => {
        if (!isArchitect) return;
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.getData('placed-card')) return;
        try {
            const data = e.dataTransfer.getData('application/json');
            if (!data) return;
            const material = JSON.parse(data);
            const rect = canvasContainerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left - 74;
            const y = e.clientY - rect.top - 86;
            onDrop(material, x, y);
        } catch (err) { console.error("Invalid drop data:", err); }
    };

    const handleAddTextAtCenter = () => {
        const x = containerRef.current.width / 2;
        const y = containerRef.current.height / 2;
        onAddText(x, y);
    };

    /* ── Object Drop logic etc. ──────────────────────── */

    const handleResetZoom = () => resetZoom();

    return (
        <div className="flex flex-col h-full w-full bg-[#f5f4f1]">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-3 md:px-5 py-2.5 bg-white border-b border-gray-200 z-10 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 shrink-0 mr-4">
                    <span className="font-semibold text-gray-900 truncate max-w-[100px] md:max-w-none">{projectName}</span>
                    <span className="text-gray-400">/</span>
                    <span className="truncate max-w-[80px] md:max-w-none">{roomName}</span>
                    {autoSaving && (
                        <div className="flex items-center gap-1.5 ml-2 text-[10px] font-bold text-[#d9a88a] animate-pulse">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#d9a88a]" />
                            SYNCING...
                        </div>
                    )}
                    {filledCount > 0 && (
                        <span className="ml-1 px-2 py-0.5 text-[10px] md:text-xs font-semibold rounded-full bg-[#e09a74]/10 text-[#e09a74] whitespace-nowrap">
                            {filledCount} <span className="hidden md:inline">item{filledCount !== 1 ? 's' : ''}</span>
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                    {isArchitect && (
                        <>
                            {filledCount > 0 && (
                                <button onClick={onClear} className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" /><span className="hidden md:inline">Clear</span>
                                </button>
                            )}
                            <button onClick={handleSave} className={`flex items-center gap-1.5 px-2 md:px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${saving ? 'bg-green-50 text-green-600 border-green-200' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                <Save className="w-3.5 h-3.5" /> <span className="hidden md:inline">{saving ? 'Saved!' : 'Save'}</span>
                            </button>
                        </>
                    )}

                    {/* Top Download Image / PDF */}
                    <button onClick={() => {
                        setExportPDFLoading(true);
                        setTimeout(() => {
                            exportHighRes(projectName, 'jpeg');
                            setExportPDFLoading(false);
                        }, 500);
                    }} disabled={exportPDFLoading || filledCount === 0} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-40 transition-colors">
                        <Download className="w-3.5 h-3.5" />

                    </button>
                </div>
            </div>

            {/* Canvas */}
            <div ref={canvasContainerRef} className={`flex-1 relative overflow-hidden select-none ${panMode ? 'cursor-grab active:cursor-grabbing' : ''} ${isDragOver ? 'bg-[#e09a74]/5 ring-2 ring-inset ring-[#e09a74]/30' : 'bg-[#f0eee9]'}`} onDragOver={handleDragOver} onDragLeave={() => setIsDragOver(false)} onDrop={handleDropEvent} style={{ backgroundColor: props.canvasBg }}>
                {filledCount === 0 && !isDragOver && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none text-gray-400 z-0">
                        <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                            <Type className="w-7 h-7 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium">Drag materials or add text</p>
                    </div>
                )}
                {isArchitect && activeMenuConfig && (
                    <div
                        className="absolute z-50 bg-white/95 backdrop-blur-md shadow-xl rounded-xl border border-gray-200 flex flex-col items-center p-1.5 gap-1 transition-opacity pointer-events-auto"
                        style={{
                            left: Math.max(10, activeMenuConfig.left),
                            top: Math.max(10, activeMenuConfig.top),
                            transform: 'translate(15px, -15px)'
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onWheel={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-1">
                            <MenuBtn onClick={bringForward} title="Bring Forward (Ctrl+]">
                                <ArrowUpToLine className="w-4 h-4" />
                            </MenuBtn>
                            <MenuBtn onClick={sendBackward} title="Send Backward (Ctrl+[">
                                <ArrowDownToLine className="w-4 h-4" />
                            </MenuBtn>
                            <div className="w-px h-4 bg-gray-200 mx-1" />

                            {activeMenuConfig.type === 'text' && (
                                <>
                                    <div className="relative flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-all cursor-pointer overflow-hidden p-[2px]" title="Text Color">
                                        <input
                                            type="color"
                                            className="w-full h-full cursor-pointer rounded-sm border-0 p-0 block"
                                            value={activeMenuConfig.textColor || '#1a1a1a'}
                                            onChange={(e) => updateFabricObject(activeMenuConfig.id, { textColor: e.target.value })}
                                        />
                                    </div>
                                    <div className="w-px h-4 bg-gray-200 mx-1" />
                                </>
                            )}

                            {/* Background Remover Button */}
                            <MenuBtn
                                onClick={removeSelectedBackground}
                                title="Remove Background (AI)"
                                disabled={isProcessingBg}
                                active={isProcessingBg}
                            >
                                {isProcessingBg ? (
                                    <div className="relative flex items-center justify-center">
                                        <Loader2 className="w-4 h-4 animate-spin text-[#e09a74]" />
                                        {bgProgress > 0 && (
                                            <span className="absolute -bottom-4 text-[8px] font-bold text-[#e09a74] whitespace-nowrap bg-white/80 px-1 rounded-sm">
                                                {bgProgress < 10 ? 'Loading...' : `${bgProgress}%`}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <Wand2 className="w-4 h-4" />
                                )}
                            </MenuBtn>
                            <div className="w-px h-4 bg-gray-200 mx-1" />

                            <MenuBtn
                                onClick={toggleLock}
                                title={lockedIds.has(activeMenuConfig.id) ? "Unlock Position" : "Lock Position"}
                                active={lockedIds.has(activeMenuConfig.id)}
                            >
                                {lockedIds.has(activeMenuConfig.id) ? (
                                    <Lock className="w-4 h-4 text-[#e09a74]" />
                                ) : (
                                    <LockOpen className="w-4 h-4" />
                                )}
                            </MenuBtn>
                            <div className="w-px h-4 bg-gray-200 mx-1" />
                            <MenuBtn onClick={deleteSelection} title="Delete (Del)" isDanger>
                                <Trash className="w-4 h-4 text-red-500" />
                            </MenuBtn>
                        </div>
                    </div>
                )}
                <div>
                    <canvas ref={canvasRef} className="w-full h-full" />
                </div>
            </div>

            {/* Bottom Toolbar */}
            <div className="flex items-center justify-between px-3 md:px-4 py-2.5 bg-white border-t border-gray-200 relative z-10 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                    <BottomBtn onClick={() => setPanMode(p => !p)} title="Pan" active={panMode}><Move className="w-4 h-4" /></BottomBtn>
                    <BottomBtn onClick={() => setShowGrid(!showGrid)} title="Toggle Grid" active={showGrid}><Grid3x3 className="w-4 h-4" /></BottomBtn>

                    {isArchitect && (
                        <>
                            <BottomBtn onClick={handleUndo} title="Undo" disabled={filledCount === 0}><CornerUpLeft className="w-4 h-4" /></BottomBtn>
                            <BottomBtn onClick={toggleLock} title="Lock Selection" active={lockedIds.size > 0}><Lock className="w-4 h-4" /></BottomBtn>
                            <BottomBtn onClick={groupSelection} title="Group Selection" disabled={selectedIds.size < 2}><Focus className="w-4 h-4" /></BottomBtn>
                            <BottomBtn onClick={deleteSelection} title="Delete Selection" disabled={selectedIds.size === 0}><Trash className="w-4 h-4" /></BottomBtn>

                            <div className="w-px h-5 bg-gray-200 mx-1" />

                            <BottomBtn onClick={handleAddTextAtCenter} title="Add Text"><Type className="w-4 h-4" /></BottomBtn>
                            <BottomBtn onClick={() => photoInputRef.current?.click()} title="Add Photo"><ImagePlus className="w-4 h-4" /></BottomBtn>
                            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />

                            <div className="w-px h-5 bg-gray-200 mx-1" />

                            {/* Canvas Background Color Picker */}
                            <div className="relative group/bg">
                                <BottomBtn
                                    onClick={() => document.getElementById('canvas-bg-picker').click()}
                                    title="Canvas Background"
                                >
                                    <div
                                        className="w-4 h-4 rounded-full border border-gray-300 shadow-sm"
                                        style={{ backgroundColor: props.canvasBg }}
                                    />
                                </BottomBtn>
                                <input
                                    id="canvas-bg-picker"
                                    type="color"
                                    className="absolute -top-10 left-0 opacity-0 pointer-events-none"
                                    value={props.canvasBg}
                                    onChange={(e) => props.onBgChange(e.target.value)}
                                />
                            </div>

                            <div className="w-px h-5 bg-gray-200 mx-1" />
                        </>
                    )}

                    <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden ml-2">
                        <button onClick={zoomOut} className="px-1 py-1 hover:bg-gray-100"><Minus className="w-3 h-3" /></button>
                        <button onClick={handleResetZoom} className="px-2 py-1 text-xs font-mono w-14 text-center">{Math.round(zoom * 100)}%</button>
                        <button onClick={zoomIn} className="px-1 py-1 hover:bg-gray-100"><Plus className="w-3 h-3" /></button>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default CanvasPreview;

function BottomBtn({ onClick, title, children, active, disabled }) {
    return (
        <button onClick={onClick} title={title} disabled={disabled}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                ${disabled ? 'opacity-30 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
            style={active ? { backgroundColor: 'rgba(224, 154, 116, 0.1)', color: '#e09a74' } : {}}
        >
            {children}
        </button>
    );
}

function MenuBtn({ onClick, title, children, active, isDanger }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all
                ${active
                    ? 'bg-[#e09a74]/10 text-[#e09a74]'
                    : isDanger
                        ? 'text-red-500 hover:bg-red-50'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
        >
            {children}
        </button>
    );
}