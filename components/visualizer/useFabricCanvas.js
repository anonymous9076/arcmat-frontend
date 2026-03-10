'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { removeBackground, preload } from '@imgly/background-removal';

/**
 * Helper to resize image for faster AI processing
 */
const resizeImageForAI = (src, maxDim = 1024) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const width = img.width;
            const height = img.height;

            if (width <= maxDim && height <= maxDim) {
                resolve(src); // No need to resize
                return;
            }

            let newWidth, newHeight;
            if (width > height) {
                newWidth = maxDim;
                newHeight = (height / width) * maxDim;
            } else {
                newHeight = maxDim;
                newWidth = (width / height) * maxDim;
            }

            const canvas = document.createElement('canvas');
            canvas.width = newWidth;
            canvas.height = newHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, newWidth, newHeight);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(src); // Fallback to original
        img.src = src;
    });
};

/**
 * Custom hook to manage the Fabric.js canvas
 */
import { getProductImageUrl, getVariantImageUrl, getProductName, getProductCategory } from '@/lib/productUtils';

const DEFAULT_CARD_W = 148;
const DEFAULT_CARD_H = 172;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

export function useFabricCanvas({
    canvasContainerRef,
    boardItems,
    onUpdateItem,
    onRemoveItem,
    onReposition,
    onMaterialSelect,
    initialWidth,
    initialHeight,
    canvasBg = '#f0eee9'
}) {
    const canvasRef = useRef(null);
    const fabricRef = useRef(null);

    // Update background color when canvasBg changes
    useEffect(() => {
        if (fabricRef.current) {
            fabricRef.current.set({ backgroundColor: canvasBg });
            fabricRef.current.requestRenderAll();
        }
    }, [canvasBg]);
    const [zoom, setZoom] = useState(1);
    const [panMode, setPanMode] = useState(false);
    const panModeRef = useRef(panMode);
    useEffect(() => { panModeRef.current = panMode; }, [panMode]);
    const [lockedIds, setLockedIds] = useState(new Set());
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [activeMenuConfig, setActiveMenuConfig] = useState(null);
    const [canvasReady, setCanvasReady] = useState(false);
    const [showGrid, setShowGrid] = useState(false);
    const showGridRef = useRef(false);
    useEffect(() => {
        showGridRef.current = showGrid;
        if (fabricRef.current) fabricRef.current.requestRenderAll();
    }, [showGrid]);

    // --- Initialize Fabric Canvas ---
    useEffect(() => {
        if (!canvasRef.current) return;

        // Clean up old instance
        if (fabricRef.current) fabricRef.current.dispose();

        const canvas = new fabric.Canvas(canvasRef.current, {
            width: initialWidth || window.innerWidth - 300,
            height: initialHeight || window.innerHeight - 150,
            backgroundColor: '#f0eee9',
            preserveObjectStacking: true,
            selection: true,
            uniformScaling: false
        });

        fabricRef.current = canvas;

        // --- Panning ---
        canvas.on('mouse:down', function (opt) {
            const evt = opt.e;
            if (panModeRef.current || evt.altKey || (evt.code === 'Space')) {
                this.isDragging = true;
                this.selection = false;
                this.lastPosX = evt.clientX;
                this.lastPosY = evt.clientY;
            }
        });

        canvas.on('mouse:move', function (opt) {
            if (this.isDragging) {
                const e = opt.e;
                const vpt = this.viewportTransform;
                vpt[4] += e.clientX - this.lastPosX;
                vpt[5] += e.clientY - this.lastPosY;
                this.requestRenderAll();
                this.lastPosX = e.clientX;
                this.lastPosY = e.clientY;
                updateMenu();
            }
        });

        canvas.on('mouse:up', function () {
            this.isDragging = false;
            this.selection = true;
        });

        canvas.on('mouse:wheel', function (opt) {
            const delta = opt.e.deltaY;
            let newZoom = canvas.getZoom();
            newZoom *= 0.999 ** delta;
            if (newZoom > MAX_ZOOM) newZoom = MAX_ZOOM;
            if (newZoom < MIN_ZOOM) newZoom = MIN_ZOOM;
            canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, newZoom);
            opt.e.preventDefault();
            opt.e.stopPropagation();
            setZoom(newZoom);
            updateMenu();
        });

        // --- Grid Rendering ---
        canvas.on('before:render', function () {
            if (!showGridRef.current) return;
            const ctx = canvas.getContext();
            const w = canvas.width;
            const h = canvas.height;
            const vpt = canvas.viewportTransform;
            const zoom = vpt[0];
            const offsetX = vpt[4];
            const offsetY = vpt[5];

            const gridSize = 40;
            const left = -offsetX / zoom;
            const top = -offsetY / zoom;
            const right = (w - offsetX) / zoom;
            const bottom = (h - offsetY) / zoom;

            ctx.save();
            ctx.transform(vpt[0], vpt[1], vpt[2], vpt[3], vpt[4], vpt[5]);

            ctx.beginPath();
            ctx.lineWidth = 1 / zoom;
            ctx.strokeStyle = 'rgba(0,0,0,0.06)';

            const startX = Math.floor(left / gridSize) * gridSize;
            const endX = Math.ceil(right / gridSize) * gridSize;
            const startY = Math.floor(top / gridSize) * gridSize;
            const endY = Math.ceil(bottom / gridSize) * gridSize;

            for (let x = startX; x <= endX; x += gridSize) {
                ctx.moveTo(x, top);
                ctx.lineTo(x, bottom);
            }
            for (let y = startY; y <= endY; y += gridSize) {
                ctx.moveTo(left, y);
                ctx.lineTo(right, y);
            }
            ctx.stroke();
            ctx.restore();
        });

        // --- Active Menu ---
        const updateMenu = () => {
            const activeObjects = canvas.getActiveObjects();
            if (activeObjects.length === 1) {
                const obj = activeObjects[0];
                obj.setCoords();
                const tr = obj.oCoords.tr;
                setActiveMenuConfig({
                    id: obj.id,
                    type: obj.type === 'i-text' || obj.type === 'text' ? 'text' : 'material',
                    left: tr.x + 10,
                    top: tr.y,
                    quantity: obj.materialData?.quantity || 1,
                    price: obj.materialData?.price || 0,
                    scale: obj.scaleX,
                    rotation: obj.angle,
                    textColor: obj.fill,
                    fontSize: obj.fontSize
                });
            } else {
                setActiveMenuConfig(null);
            }
        };

        // --- Selection syncing ---
        const syncSelection = () => {
            const activeObjects = canvas.getActiveObjects();
            updateMenu();
            if (activeObjects.length > 0) {
                const newSelected = new Set(activeObjects.map(obj => obj.id).filter(Boolean));
                setSelectedIds(newSelected);
                if (activeObjects.length === 1 && activeObjects[0].materialData) {
                    onMaterialSelect(activeObjects[0].materialData);
                }
            } else setSelectedIds(new Set());
        };

        canvas.on('selection:created', syncSelection);
        canvas.on('selection:updated', syncSelection);
        canvas.on('selection:cleared', syncSelection);

        // --- Object modification syncing ---
        canvas.on('object:modified', (e) => {
            const obj = e.target;
            if (!obj) return;
            if (obj.type === 'activeSelection') {
                obj.getObjects().forEach(item => {
                    const center = item.getCenterPoint();
                    if (item.id) {
                        onReposition(item.id, center.x, center.y);
                        onUpdateItem(item.id, {
                            scaleX: item.scaleX,
                            scaleY: item.scaleY,
                            rotation: item.angle
                        });
                    }
                });
            } else if (obj.id) {
                onReposition(obj.id, obj.left, obj.top);

                const updates = {
                    scaleX: obj.scaleX,
                    scaleY: obj.scaleY,
                    rotation: obj.angle,
                    w: obj.width * obj.scaleX,
                    h: obj.height * obj.scaleY
                };

                if (obj.type === 'i-text' || obj.type === 'text') {
                    updates.text = obj.text;
                }

                onUpdateItem(obj.id, updates);
            }
            updateMenu();
        });

        canvas.on('text:changed', (e) => {
            const obj = e.target;
            if (obj && obj.id && (obj.type === 'i-text' || obj.type === 'text')) {
                onUpdateItem(obj.id, { text: obj.text });
            }
        });

        canvas.on('text:editing:exited', (e) => {
            const obj = e.target;
            if (obj && obj.id && (obj.type === 'i-text' || obj.type === 'text')) {
                onUpdateItem(obj.id, { text: obj.text });
            }
        });

        canvas.on('object:moving', updateMenu);
        canvas.on('object:scaling', updateMenu);
        canvas.on('object:rotating', updateMenu);

        // --- Responsive resize ---
        const handleResize = () => {
            const wrapper = canvasContainerRef?.current || canvas.wrapperEl?.parentElement || canvasRef.current?.parentElement;
            if (wrapper && wrapper.clientWidth > 0 && wrapper.clientHeight > 0) {
                canvas.setDimensions({ width: wrapper.clientWidth, height: wrapper.clientHeight });
            }
        };

        const resizeObserver = new ResizeObserver(handleResize);
        if (canvasContainerRef?.current) {
            resizeObserver.observe(canvasContainerRef.current);
        } else if (canvas.wrapperEl?.parentElement) {
            resizeObserver.observe(canvas.wrapperEl.parentElement);
        }

        window.addEventListener('resize', handleResize);
        handleResize();

        setCanvasReady(true);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', handleResize);
            canvas.dispose();
            fabricRef.current = null;
            setCanvasReady(false);
            renderedIds.current.clear();
        };
    }, []);

    // --- Sync boardItems to Fabric ---
    const renderedIds = useRef(new Set());
    useEffect(() => {
        if (!fabricRef.current || !canvasReady) return;
        const canvas = fabricRef.current;

        boardItems.forEach(item => {
            if (renderedIds.current.has(item.id)) return;
            renderedIds.current.add(item.id);

            if (item.type === 'text') {
                const textObj = new fabric.IText(item.text || 'Add text', {
                    id: item.id,
                    left: item.x,
                    top: item.y,
                    fontFamily: 'Helvetica',
                    fill: item.textColor || '#1a1a1a',
                    fontSize: item.fontSize || 32,
                    fontWeight: 'bold',
                    angle: item.rotation || 0,
                    scaleX: item.scale || 1,
                    scaleY: item.scale || 1,
                    lockMovementX: lockedIds.has(item.id),
                    lockMovementY: lockedIds.has(item.id),
                    selectable: !lockedIds.has(item.id)
                });
                canvas.add(textObj);
            } else {
                const imgUrl = getUrl(item.material);
                const targetW = item.w || DEFAULT_CARD_W;
                const targetH = item.h || DEFAULT_CARD_H;
                const nameStr = getProductName(item.material);
                const catStr = getProductCategory(item.material);

                if (imgUrl) {
                    fabric.Image.fromURL(imgUrl, { crossOrigin: 'anonymous' }).then((img) => {
                        const halfW = targetW / 2;
                        const halfH = targetH / 2;

                        // --- FIXED SCALE: fit inside card safely ---
                        const scaleX = targetW / img.width;
                        const scaleY = targetH / img.height;
                        const scaleMath = Math.min(scaleX, scaleY) * 1.0;

                        img.set({
                            originX: 'center',
                            originY: 'center',
                            left: 0,
                            top: 0,
                            scaleX: scaleMath,
                            scaleY: scaleMath
                        });

                        // Background rect with rounded corners
                        const bgRect = new fabric.Rect({
                            originX: 'center',
                            originY: 'center',
                            left: 0,
                            top: 0,
                            width: targetW,
                            height: targetH,
                            fill: 'transparent',
                            rx: 10,
                            ry: 10,
                        });

                        const group = new fabric.Group([bgRect, img], {
                            id: item.id,
                            left: item.x,
                            top: item.y,
                            originX: 'center',
                            originY: 'center',
                            angle: item.rotation || 0,
                            scaleX: item.scaleX || item.scale || 1,
                            scaleY: item.scaleY || item.scale || 1,
                            lockMovementX: lockedIds.has(item.id),
                            lockMovementY: lockedIds.has(item.id),
                            selectable: !lockedIds.has(item.id),
                            materialData: item.material,
                            cornerColor: '#e09a74',
                            cornerStyle: 'rect',
                            transparentCorners: false,
                            borderColor: '#e09a74'
                        });

                        canvas.add(group);
                        canvas.requestRenderAll();
                    });
                } else {
                    // fallback placeholder rect
                    const rect = new fabric.Rect({
                        id: item.id,
                        left: item.x,
                        top: item.y,
                        width: targetW,
                        height: targetH,
                        fill: '#ccc',
                        materialData: item.material
                    });
                    canvas.add(rect);
                }
            }
        });

        // --- Remove deleted items ---
        const currentIds = new Set(boardItems.map(i => i.id));
        const toRemove = [];
        canvas.getObjects().forEach(obj => {
            if (obj.id && !currentIds.has(obj.id)) {
                toRemove.push(obj);
                renderedIds.current.delete(obj.id);
                setSelectedIds(prev => { const n = new Set(prev); n.delete(obj.id); return n; });
            }
        });
        if (toRemove.length) {
            toRemove.forEach(obj => canvas.remove(obj));
            canvas.requestRenderAll();
        }
    }, [boardItems, lockedIds, canvasReady]);

    // --- Helpers ---
    const getUrl = (v) => {
        if (!v) return null;
        if (v.isCustomPhoto && v.photoUrl) return v.photoUrl;
        const first = v.images?.[0];
        if (first) return first.startsWith('blob:') || first.startsWith('data:') ? first : getProductImageUrl(first);
        if (v.variant_images?.length) return getVariantImageUrl(v.variant_images[0]);
        if (typeof v.productId === 'object' && v.productId?.product_images?.length) return getProductImageUrl(v.productId.product_images[0]);
        return null;
    };

    // --- Toolbar Actions ---

    const toggleLock = useCallback(() => {
        if (!fabricRef.current) return;
        const canvas = fabricRef.current;
        const activeObjects = canvas.getActiveObjects();
        if (!activeObjects.length) return;

        setLockedIds(prev => {
            const next = new Set(prev);
            activeObjects.forEach(obj => {
                const id = obj.id;
                if (!id) return;
                if (next.has(id)) {
                    next.delete(id);
                    obj.set({ lockMovementX: false, lockMovementY: false, lockRotation: false, lockScalingX: false, lockScalingY: false, hasControls: true });
                } else {
                    next.add(id);
                    obj.set({ lockMovementX: true, lockMovementY: true, lockRotation: true, lockScalingX: true, lockScalingY: true, hasControls: false });
                }
            });
            canvas.requestRenderAll();
            return next;
        });
    }, []);

    const bringForward = useCallback(() => {
        if (!fabricRef.current) return;
        const activeObjects = fabricRef.current.getActiveObjects();
        if (activeObjects.length) {
            activeObjects.forEach(obj => fabricRef.current.bringForward(obj));
            fabricRef.current.requestRenderAll();
        }
    }, []);

    const sendBackward = useCallback(() => { if (fabricRef.current?.getActiveObject()) { fabricRef.current.sendObjectBackwards(fabricRef.current.getActiveObject()); fabricRef.current.requestRenderAll(); } }, []);
    const groupSelection = useCallback(() => { if (!fabricRef.current) return; const canvas = fabricRef.current; if (canvas.getActiveObject()?.type === 'activeSelection') { canvas.getActiveObject().toGroup(); canvas.requestRenderAll(); } }, []);
    const ungroupSelection = useCallback(() => { if (!fabricRef.current) return; const activeObj = fabricRef.current.getActiveObject(); if (activeObj?.type === 'group') { activeObj.toActiveSelection(); fabricRef.current.requestRenderAll(); } }, []);
    const zoomIn = useCallback(() => { if (!fabricRef.current) return; let newZoom = fabricRef.current.getZoom() + ZOOM_STEP; if (newZoom > MAX_ZOOM) newZoom = MAX_ZOOM; fabricRef.current.setZoom(newZoom); setZoom(newZoom); }, []);
    const zoomOut = useCallback(() => { if (!fabricRef.current) return; let newZoom = fabricRef.current.getZoom() - ZOOM_STEP; if (newZoom < MIN_ZOOM) newZoom = MIN_ZOOM; fabricRef.current.setZoom(newZoom); setZoom(newZoom); }, []);
    const resetZoom = useCallback(() => { if (!fabricRef.current) return; fabricRef.current.setViewportTransform([1, 0, 0, 1, 0, 0]); setZoom(1); }, []);

    // --- Export High-Res ---
    const exportHighRes = useCallback((fileName = 'moodboard', format = 'jpeg') => {
        if (!fabricRef.current) return;
        const canvas = fabricRef.current;
        const objects = canvas.getObjects();
        if (!objects.length) return;

        // Save current state
        const originalVPT = [...canvas.viewportTransform];
        const originalSelection = canvas.selection;

        // Temporarily reset to identity for accurate world-space bounding box
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        canvas.discardActiveObject();
        canvas.selection = false;
        canvas.renderAll();

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        objects.forEach(obj => {
            const br = obj.getBoundingRect(true, true);
            if (br.left < minX) minX = br.left;
            if (br.top < minY) minY = br.top;
            if (br.left + br.width > maxX) maxX = br.left + br.width;
            if (br.top + br.height > maxY) maxY = br.top + br.height;
        });

        // Add padding if finite, else use current dimensions
        let padding = 60;
        let left = isFinite(minX) ? minX - padding : 0;
        let top = isFinite(minY) ? minY - padding : 0;
        let width = isFinite(maxX) && isFinite(minX) ? (maxX - minX) + (padding * 2) : canvas.width;
        let height = isFinite(maxY) && isFinite(minY) ? (maxY - minY) + (padding * 2) : canvas.height;

        // High resolution multiplier (300 DPI approx)
        const multiplier = 2;

        try {
            const dataURL = canvas.toDataURL({
                format,
                quality: 1.0,
                multiplier,
                left,
                top,
                width,
                height,
                enableRetinaScaling: true
            });

            const link = document.createElement('a');
            link.download = `${fileName}-design.${format}`;
            link.href = dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error("Export failed:", err);
            alert("High-Res export failed (possibly due to CORS images). Please try again.");
        } finally {
            // Restore original view and state
            canvas.viewportTransform = originalVPT;
            canvas.selection = originalSelection;
            canvas.renderAll();
        }
    }, []);

    const updateFabricObject = useCallback((id, props) => {
        if (!fabricRef.current) return;
        const obj = fabricRef.current.getObjects().find(o => o.id === id);
        if (!obj) return;
        if (props.textColor) props.fill = props.textColor;
        if (props.scale) { props.scaleX = props.scale; props.scaleY = props.scale; delete props.scale; }
        obj.set(props);
        fabricRef.current.requestRenderAll();
        onUpdateItem(id, props);
    }, [onUpdateItem]);

    /* ── Background Removal ──────────────────────────── */
    const [isProcessingBg, setIsProcessingBg] = useState(false);
    const [bgProgress, setBgProgress] = useState(0);

    // Preload AI assets on mount
    useEffect(() => {
        console.log("Preloading AI background removal assets...");
        preload({ model: 'small' }).catch(err => console.warn("AI Preload failed", err));
    }, []);

    const removeSelectedBackground = async () => {
        const activeObj = fabricRef.current?.getActiveObject();
        if (!activeObj || isProcessingBg) return;

        // Find the image inside the group or if it's a direct image
        let imgObj = null;
        if (activeObj.type === 'group') {
            imgObj = activeObj._objects.find(o => o.type === 'image' || o.constructor.name.includes('Image'));
        } else if (activeObj.type === 'image' || activeObj.constructor.name.includes('Image')) {
            imgObj = activeObj;
        }

        if (!imgObj || !imgObj.getSrc) return;

        try {
            setIsProcessingBg(true);
            setBgProgress(1); // Start with 1% to show it's alive

            let src = imgObj.getSrc();

            // 0. Resize image if too large (speeds up processing significantly)
            setBgProgress(5); // Resizing...
            src = await resizeImageForAI(src);

            // 1. Remove background
            const blob = await removeBackground(src, {
                progress: (key, current, total) => {
                    const p = Math.round((current / total) * 100);
                    // Map progress to 10-90 range to account for setup/finalize
                    setBgProgress(10 + Math.round(p * 0.8));
                    console.log(`AI Progress [${key}]: ${p}%`);
                },
                model: 'small',
            });

            setBgProgress(95); // Finalizing...

            // 2. Convert result to DataURL
            const reader = new FileReader();
            reader.onload = async (e) => {
                const dataUrl = e.target.result;

                // 3. Update the image source
                const newImg = await fabric.Image.fromURL(dataUrl, { crossOrigin: 'anonymous' });

                // Keep same scale/flip properties but reset filter-related ones
                newImg.set({
                    scaleX: imgObj.scaleX,
                    scaleY: imgObj.scaleY,
                    flipX: imgObj.flipX,
                    flipY: imgObj.flipY,
                    originX: 'center',
                    originY: 'center',
                    left: imgObj.left,
                    top: imgObj.top
                });

                if (activeObj.type === 'group') {
                    // Update image inside group
                    const idx = activeObj._objects.indexOf(imgObj);
                    if (idx > -1) {
                        activeObj.removeWithUpdate(imgObj);
                        activeObj.insertAt(newImg, idx);
                        fabricRef.current.requestRenderAll();
                    }
                } else {
                    // Replace direct image
                    fabricRef.current.remove(imgObj);
                    fabricRef.current.add(newImg);
                    fabricRef.current.setActiveObject(newImg);
                }

                // Trigger persistent save
                const objId = activeObj.id || imgObj.id;
                if (objId) {
                    onUpdateItem(objId, { material: { ...activeObj.material || imgObj.material, photoUrl: dataUrl, images: [dataUrl] } });
                }

                fabricRef.current.requestRenderAll();
                setIsProcessingBg(false);
                setBgProgress(0);
            };
            reader.readAsDataURL(blob);

        } catch (error) {
            console.error("Background removal failed:", error);
            setIsProcessingBg(false);
            setBgProgress(0);
            alert("Background removal failed. This usually happens if the image is corrupt or device memory is low. Try with a smaller image!");
        }
    };

    const deleteSelection = useCallback(() => {
        if (!fabricRef.current) return;
        const canvas = fabricRef.current;
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length) {
            activeObjects.forEach(obj => {
                if (obj.id) onRemoveItem(obj.id);
                canvas.remove(obj); // Force instant visual clear and engine clear
            });
            canvas.discardActiveObject();
            canvas.requestRenderAll();
        }
    }, [onRemoveItem]);

    const getSerializedState = useCallback(() => {
        if (!fabricRef.current) return boardItems;

        // FabricJS removes grouped active selections from the main canvas object tree.
        // We must temporarily discard the selection so items return to absolute canvas coordinates.
        let activeSelectionObjs = null;
        const active = fabricRef.current.getActiveObject();
        if (active && active.type === 'activeSelection') {
            activeSelectionObjs = active.getObjects();
            fabricRef.current.discardActiveObject();
        }

        const canvasObjects = fabricRef.current.getObjects();

        // The absolute source of truth is what currently exists in the FabricJS engine
        const serialized = canvasObjects.map(fObj => {
            if (!fObj.id) return null;
            const existingMeta = boardItems.find(i => i.id === fObj.id) || {};

            if (fObj.type === 'i-text' || fObj.type === 'text') {
                return {
                    ...existingMeta,
                    id: fObj.id,
                    type: 'text',
                    text: fObj.text,
                    textColor: fObj.fill,
                    fontSize: fObj.fontSize,
                    x: fObj.left,
                    y: fObj.top,
                    scale: fObj.scaleX,
                    rotation: fObj.angle,
                };
            } else {
                return {
                    ...existingMeta,
                    id: fObj.id,
                    type: existingMeta.type || 'material',
                    x: fObj.left,
                    y: fObj.top,
                    scaleX: fObj.scaleX,
                    scaleY: fObj.scaleY,
                    rotation: fObj.angle,
                    // DO NOT multiply by scaleX here. 
                    // The base width is intrinsic, scaleX handles the sizing independently!
                    w: fObj.width,
                    h: fObj.height
                };
            }
        }).filter(Boolean);

        // Restore active selection transparently
        if (activeSelectionObjs) {
            const newSel = new fabric.ActiveSelection(activeSelectionObjs, { canvas: fabricRef.current });
            fabricRef.current.setActiveObject(newSel);
        }

        return serialized;
    }, [boardItems]);

    return {
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
        getSerializedState // Exported here
    };
}