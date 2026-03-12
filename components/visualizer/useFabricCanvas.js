'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { removeBackground, preload } from '@imgly/background-removal';
import { getProductImageUrl, getVariantImageUrl, getProductName, getProductCategory } from '@/lib/productUtils';

// ─── Constants ────────────────────────────────────────────────────────────────
const DEFAULT_CARD_W = 148;
const DEFAULT_CARD_H = 172;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

// ─── Helper: resize image for AI processing ───────────────────────────────────
const resizeImageForAI = (src, maxDim = 1024) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const { width, height } = img;
            if (width <= maxDim && height <= maxDim) return resolve(src);

            const ratio = width > height ? maxDim / width : maxDim / height;
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(width * ratio);
            canvas.height = Math.round(height * ratio);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(src); // fallback to original on error
        img.src = src;
    });
};

// ─── Helper: get image URL from material object ───────────────────────────────
const getUrl = (v) => {
    if (!v) return null;
    if (v.isCustomPhoto && v.photoUrl) return v.photoUrl;
    const first = v.images?.[0];
    if (first) return first.startsWith('blob:') || first.startsWith('data:') ? first : getProductImageUrl(first);
    if (v.variant_images?.length) return getVariantImageUrl(v.variant_images[0]);
    if (typeof v.productId === 'object' && v.productId?.product_images?.length)
        return getProductImageUrl(v.productId.product_images[0]);
    return null;
};

// ─── Main Hook ────────────────────────────────────────────────────────────────
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
    const renderedIds = useRef(new Set());
    const initialCenterDone = useRef(false);
    const panModeRef = useRef(false);
    const showGridRef = useRef(false);

    const [zoom, setZoom] = useState(1);
    const [panMode, setPanMode] = useState(false);
    const [lockedIds, setLockedIds] = useState(new Set());
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [activeMenuConfig, setActiveMenuConfig] = useState(null);
    const [canvasReady, setCanvasReady] = useState(false);
    const [showGrid, setShowGrid] = useState(false);
    const [isProcessingBg, setIsProcessingBg] = useState(false);
    const [bgProgress, setBgProgress] = useState(0);

    // Keep refs in sync with state for use inside event handlers
    useEffect(() => { panModeRef.current = panMode; }, [panMode]);
    useEffect(() => {
        showGridRef.current = showGrid;
        if (fabricRef.current) fabricRef.current.requestRenderAll();
    }, [showGrid]);

    // ── BUG FIX: Apply background color changes to existing canvas ──────────
    useEffect(() => {
        if (!fabricRef.current) return;
        fabricRef.current.set({ backgroundColor: canvasBg });
        fabricRef.current.requestRenderAll();
    }, [canvasBg]);

    // ─── Initialize Fabric Canvas ─────────────────────────────────────────────
    useEffect(() => {
        if (!canvasRef.current) return;
        if (fabricRef.current) fabricRef.current.dispose();

        const canvas = new fabric.Canvas(canvasRef.current, {
            // ── BUG FIX: Use canvasBg prop instead of hardcoded color ──────
            width: initialWidth || window.innerWidth - 300,
            height: initialHeight || window.innerHeight - 150,
            backgroundColor: canvasBg,
            preserveObjectStacking: true,
            selection: true,
            uniformScaling: false
        });

        fabricRef.current = canvas;


        canvas.on('after:render', function () {
            if (!showGridRef.current) return;

            const lowerEl = canvas.lowerCanvasEl ?? canvas.getElement?.();
            if (!lowerEl) return;
            const ctx = lowerEl.getContext('2d');
            if (!ctx) return;

            const vpt = canvas.viewportTransform;
            const currentZoom = canvas.getZoom();

            const w = canvas.width;
            const h = canvas.height;

            // Work in screen space (ignore viewport transform for positioning)
            // but scale the grid cell size with zoom so it feels natural
            const gridSize = 40 * currentZoom;
            const offsetX = ((vpt[4] % gridSize) + gridSize) % gridSize; // always positive
            const offsetY = ((vpt[5] % gridSize) + gridSize) % gridSize;

            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0); // screen space

            ctx.beginPath();
            ctx.lineWidth = 0.5;
            ctx.strokeStyle = 'rgba(0,0,0,0.10)';

            for (let x = offsetX; x <= w; x += gridSize) {
                ctx.moveTo(x, 0);
                ctx.lineTo(x, h);
            }
            for (let y = offsetY; y <= h; y += gridSize) {
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
            }

            ctx.stroke();
            ctx.restore();
        });

        // ── Panning ──────────────────────────────────────────────────────────
        canvas.on('mouse:down', function (opt) {
            const evt = opt.e;
            const isTouch = evt.type === 'touchstart';
            const clientX = isTouch && evt.touches ? evt.touches[0].clientX : evt.clientX;
            const clientY = isTouch && evt.touches ? evt.touches[0].clientY : evt.clientY;

            if (panModeRef.current || evt.altKey) {
                this.isDragging = true;
                this.selection = false;
                this.lastPosX = clientX;
                this.lastPosY = clientY;
            }
        });

        canvas.on('mouse:move', function (opt) {
            if (!this.isDragging) return;
            const evt = opt.e;
            const isTouch = evt.type === 'touchmove';
            const clientX = isTouch && evt.touches ? evt.touches[0].clientX : evt.clientX;
            const clientY = isTouch && evt.touches ? evt.touches[0].clientY : evt.clientY;

            const vpt = this.viewportTransform;
            vpt[4] += clientX - this.lastPosX;
            vpt[5] += clientY - this.lastPosY;
            this.requestRenderAll();
            this.lastPosX = clientX;
            this.lastPosY = clientY;
            updateMenu();
        });

        canvas.on('mouse:up', function () {
            this.isDragging = false;
            this.selection = true;
        });

        // ── Scroll-to-zoom ───────────────────────────────────────────────────
        canvas.on('mouse:wheel', function (opt) {
            const delta = opt.e.deltaY;
            let newZoom = canvas.getZoom() * (0.999 ** delta);
            newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));
            canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, newZoom);
            opt.e.preventDefault();
            opt.e.stopPropagation();
            setZoom(newZoom);
            updateMenu();
        });

        // ── Pinch to zoom & two-finger pan ───────────────────────────────────
        let isPinching = false;
        let initialPinchDistance = null;
        let initialPinchZoom = null;
        let initialPanCenter = null;

        const handleTouchStart = (e) => {
            if (e.touches.length !== 2) return;
            isPinching = true;
            const [t1, t2] = e.touches;
            initialPinchDistance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
            initialPinchZoom = canvas.getZoom();
            initialPanCenter = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
            canvas.discardActiveObject();
            canvas.requestRenderAll();
            if (e.cancelable) e.preventDefault();
        };

        const handleTouchMove = (e) => {
            if (!isPinching || e.touches.length !== 2) return;
            if (e.cancelable) e.preventDefault();

            const [t1, t2] = e.touches;
            const currentCenter = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };

            // Pan
            if (initialPanCenter) {
                const vpt = canvas.viewportTransform;
                vpt[4] += currentCenter.x - initialPanCenter.x;
                vpt[5] += currentCenter.y - initialPanCenter.y;
                initialPanCenter = currentCenter;
            }

            // Zoom
            if (initialPinchDistance && initialPinchZoom) {
                const scale = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY) / initialPinchDistance;
                const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, initialPinchZoom * scale));
                const rect = canvas.wrapperEl.getBoundingClientRect();
                canvas.zoomToPoint(
                    { x: currentCenter.x - rect.left, y: currentCenter.y - rect.top },
                    newZoom
                );
                setZoom(newZoom);
            }

            canvas.requestRenderAll();
            updateMenu();
        };

        const handleTouchEnd = (e) => {
            if (e.touches.length < 2) {
                isPinching = false;
                initialPinchDistance = null;
                initialPinchZoom = null;
                initialPanCenter = null;
            }
        };

        const wrapper = canvas.wrapperEl;
        if (wrapper) {
            wrapper.addEventListener('touchstart', handleTouchStart, { passive: false });
            wrapper.addEventListener('touchmove', handleTouchMove, { passive: false });
            wrapper.addEventListener('touchend', handleTouchEnd);
        }

        // ── Active object floating menu ───────────────────────────────────────
        const updateMenu = () => {
            const activeObjects = canvas.getActiveObjects();
            if (activeObjects.length !== 1) {
                setActiveMenuConfig(null);
                return;
            }
            const obj = activeObjects[0];
            obj.setCoords();
            const tr = obj.oCoords?.tr;
            if (!tr) return;

            const isText = ['i-text', 'text', 'textbox'].includes(obj.type);
            setActiveMenuConfig({
                id: obj.id,
                type: isText ? 'text' : 'material',
                left: tr.x + 10,
                top: tr.y,
                quantity: obj.materialData?.quantity || 1,
                price: obj.materialData?.price || 0,
                scale: obj.scaleX,
                rotation: obj.angle,
                // ── BUG FIX: expose textColor and fontSize for text objects ──
                textColor: obj.fill,
                fontSize: obj.fontSize
            });
        };

        // ── Selection syncing ─────────────────────────────────────────────────
        const syncSelection = () => {
            const activeObjects = canvas.getActiveObjects();
            updateMenu();
            if (activeObjects.length > 0) {
                setSelectedIds(new Set(activeObjects.map(o => o.id).filter(Boolean)));
                if (activeObjects.length === 1 && activeObjects[0].materialData) {
                    onMaterialSelect(activeObjects[0].materialData);
                }
            } else {
                setSelectedIds(new Set());
            }
        };

        canvas.on('selection:created', syncSelection);
        canvas.on('selection:updated', syncSelection);
        canvas.on('selection:cleared', syncSelection);

        // ── Object modification syncing ───────────────────────────────────────
        canvas.on('object:modified', (e) => {
            const obj = e.target;
            if (!obj) return;

            if (obj.type === 'activeSelection') {
                obj.getObjects().forEach(item => {
                    const center = item.getCenterPoint();
                    if (!item.id) return;
                    onReposition(item.id, center.x, center.y);
                    onUpdateItem(item.id, { scaleX: item.scaleX, scaleY: item.scaleY, rotation: item.angle });
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

                // ── BUG FIX: also persist textColor and fontSize on modify ──
                if (['i-text', 'text', 'textbox'].includes(obj.type)) {
                    updates.text = obj.text;
                    updates.textColor = obj.fill;
                    updates.fontSize = obj.fontSize;
                }

                onUpdateItem(obj.id, updates);
            }
            updateMenu();
        });

        // ── Text change events ─────────────────────────────────────────────────
        const handleTextChanged = (e) => {
            const obj = e.target;
            if (obj?.id && ['i-text', 'text', 'textbox'].includes(obj.type)) {
                onUpdateItem(obj.id, {
                    text: obj.text,
                    // ── BUG FIX: persist color and size when text changes ──
                    textColor: obj.fill,
                    fontSize: obj.fontSize
                });
            }
        };

        canvas.on('text:changed', handleTextChanged);
        canvas.on('text:editing:exited', handleTextChanged);

        canvas.on('object:moving', updateMenu);
        canvas.on('object:scaling', updateMenu);
        canvas.on('object:rotating', updateMenu);

        // ── Responsive resize ─────────────────────────────────────────────────
        const handleResize = () => {
            const container = canvasContainerRef?.current
                || canvas.wrapperEl?.parentElement
                || canvasRef.current?.parentElement;
            if (container?.clientWidth > 0 && container?.clientHeight > 0) {
                canvas.setDimensions({ width: container.clientWidth, height: container.clientHeight });
                canvas.requestRenderAll();
            }
        };

        const resizeObserver = new ResizeObserver(handleResize);
        const observeTarget = canvasContainerRef?.current || canvas.wrapperEl?.parentElement;
        if (observeTarget) resizeObserver.observe(observeTarget);
        window.addEventListener('resize', handleResize);
        handleResize();

        setCanvasReady(true);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', handleResize);
            if (wrapper) {
                wrapper.removeEventListener('touchstart', handleTouchStart);
                wrapper.removeEventListener('touchmove', handleTouchMove);
                wrapper.removeEventListener('touchend', handleTouchEnd);
            }
            canvas.dispose();
            fabricRef.current = null;
            setCanvasReady(false);
            renderedIds.current.clear();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Auto-center all items on first load ──────────────────────────────────
    useEffect(() => {
        if (!fabricRef.current || !canvasReady || initialCenterDone.current || boardItems.length === 0) return;
        const canvas = fabricRef.current;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        boardItems.forEach(item => {
            const w = (item.w || DEFAULT_CARD_W) * (item.scaleX || item.scale || 1);
            const h = (item.h || DEFAULT_CARD_H) * (item.scaleY || item.scale || 1);
            if (item.x - w / 2 < minX) minX = item.x - w / 2;
            if (item.x + w / 2 > maxX) maxX = item.x + w / 2;
            if (item.y - h / 2 < minY) minY = item.y - h / 2;
            if (item.y + h / 2 > maxY) maxY = item.y + h / 2;
        });

        if (!isFinite(minX)) return;

        const contentW = maxX - minX;
        const contentH = maxY - minY;
        const padding = 40;
        const targetZoom = Math.min(
            (canvas.width - padding * 2) / Math.max(contentW, 1),
            (canvas.height - padding * 2) / Math.max(contentH, 1),
            1
        );
        const clampedZoom = Math.max(MIN_ZOOM, targetZoom);
        const cx = minX + contentW / 2;
        const cy = minY + contentH / 2;

        canvas.setViewportTransform([
            clampedZoom, 0, 0, clampedZoom,
            canvas.width / 2 - cx * clampedZoom,
            canvas.height / 2 - cy * clampedZoom
        ]);
        setZoom(clampedZoom);
        initialCenterDone.current = true;
        canvas.requestRenderAll();
    }, [boardItems, canvasReady]);

    // ─── Sync boardItems → Fabric objects ────────────────────────────────────
    useEffect(() => {
        if (!fabricRef.current || !canvasReady) return;
        const canvas = fabricRef.current;

        boardItems.forEach(item => {
            // ── BUG FIX: update existing objects instead of silently skipping ──
            if (renderedIds.current.has(item.id)) {
                const existing = canvas.getObjects().find(o => o.id === item.id);
                if (existing) {
                    const isText = ['i-text', 'text', 'textbox'].includes(existing.type);
                    if (isText) {
                        // Sync all text properties that might have changed externally
                        let dirty = false;
                        if (item.text !== undefined && existing.text !== item.text) { existing.set('text', item.text); dirty = true; }
                        if (item.textColor !== undefined && existing.fill !== item.textColor) { existing.set('fill', item.textColor); dirty = true; }
                        if (item.fontSize !== undefined && existing.fontSize !== item.fontSize) { existing.set('fontSize', item.fontSize); dirty = true; }
                        if (item.rotation !== undefined && existing.angle !== item.rotation) { existing.set('angle', item.rotation); dirty = true; }
                        if (dirty) canvas.requestRenderAll();
                    }
                }
                return;
            }

            renderedIds.current.add(item.id);

            // ── Internal note (sticky note style) ────────────────────────────
            if (item.type === 'internal-note') {
                const textObj = new fabric.Textbox(item.text || 'Internal Note', {
                    id: item.id,
                    left: item.x,
                    top: item.y,
                    originX: 'center',
                    originY: 'center',
                    fontFamily: 'Helvetica',
                    fill: item.textColor || '#6b4c10',
                    backgroundColor: '#ffeaa7',
                    padding: 16,
                    width: 200,
                    fontSize: item.fontSize || 20,
                    fontWeight: '500',
                    angle: item.rotation || 0,
                    scaleX: item.scaleX || item.scale || 1,
                    scaleY: item.scaleY || item.scale || 1,
                    lockMovementX: lockedIds.has(item.id),
                    lockMovementY: lockedIds.has(item.id),
                    selectable: !lockedIds.has(item.id),
                    isInternal: true,
                    cornerColor: '#e09a74',
                    cornerStyle: 'rect',
                    transparentCorners: false,
                    borderColor: '#e09a74'
                });
                canvas.add(textObj);

                // ── Regular text ──────────────────────────────────────────────────
            } else if (item.type === 'text') {
                const textObj = new fabric.IText(item.text || 'Add text', {
                    id: item.id,
                    left: item.x,
                    top: item.y,
                    // ── BUG FIX: consistent origin so x/y means center ────────
                    originX: 'center',
                    originY: 'center',
                    fontFamily: 'Helvetica',
                    fill: item.textColor || '#1a1a1a',
                    fontSize: item.fontSize || 32,
                    fontWeight: 'bold',
                    angle: item.rotation || 0,
                    scaleX: item.scaleX || item.scale || 1,
                    scaleY: item.scaleY || item.scale || 1,
                    lockMovementX: lockedIds.has(item.id),
                    lockMovementY: lockedIds.has(item.id),
                    selectable: !lockedIds.has(item.id),
                    cornerColor: '#e09a74',
                    cornerStyle: 'rect',
                    transparentCorners: false,
                    borderColor: '#e09a74'
                });
                canvas.add(textObj);

                // ── Material / product image ───────────────────────────────────────
            } else {
                const imgUrl = getUrl(item.material);
                const targetW = item.w || DEFAULT_CARD_W;
                const targetH = item.h || DEFAULT_CARD_H;

                if (imgUrl) {
                    fabric.Image.fromURL(imgUrl, { crossOrigin: 'anonymous' })
                        .then((img) => {
                            const scaleMath = Math.min(targetW / img.width, targetH / img.height);

                            img.set({
                                originX: 'center',
                                originY: 'center',
                                left: 0,
                                top: 0,
                                scaleX: scaleMath,
                                scaleY: scaleMath
                            });

                            const bgRect = new fabric.Rect({
                                originX: 'center',
                                originY: 'center',
                                left: 0,
                                top: 0,
                                width: targetW,
                                height: targetH,
                                fill: 'transparent',
                                rx: 10,
                                ry: 10
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
                        })
                        .catch(err => {
                            console.error(`Failed to load image for item ${item.id}:`, err);
                            // Fallback placeholder
                            const rect = new fabric.Rect({
                                id: item.id,
                                left: item.x,
                                top: item.y,
                                originX: 'center',
                                originY: 'center',
                                width: targetW,
                                height: targetH,
                                fill: '#ddd',
                                rx: 10,
                                ry: 10,
                                materialData: item.material
                            });
                            canvas.add(rect);
                            canvas.requestRenderAll();
                        });
                } else {
                    const rect = new fabric.Rect({
                        id: item.id,
                        left: item.x,
                        top: item.y,
                        originX: 'center',
                        originY: 'center',
                        width: targetW,
                        height: targetH,
                        fill: '#ddd',
                        rx: 10,
                        ry: 10,
                        materialData: item.material
                    });
                    canvas.add(rect);
                }
            }
        });

        // ── Remove deleted items ───────────────────────────────────────────────
        const currentIds = new Set(boardItems.map(i => i.id));
        const toRemove = canvas.getObjects().filter(o => o.id && !currentIds.has(o.id));
        if (toRemove.length) {
            toRemove.forEach(obj => {
                canvas.remove(obj);
                renderedIds.current.delete(obj.id);
                setSelectedIds(prev => { const n = new Set(prev); n.delete(obj.id); return n; });
            });
            canvas.requestRenderAll();
        }
    }, [boardItems, lockedIds, canvasReady]);

    // ─── Preload AI assets ────────────────────────────────────────────────────
    useEffect(() => {
        preload({ model: 'small' }).catch(err => console.warn('AI Preload failed:', err));
    }, []);

    // ─── Toolbar Actions ──────────────────────────────────────────────────────

    const toggleLock = useCallback(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        const activeObjects = canvas.getActiveObjects();
        if (!activeObjects.length) return;

        setLockedIds(prev => {
            const next = new Set(prev);
            activeObjects.forEach(obj => {
                if (!obj.id) return;
                const locked = next.has(obj.id);
                next[locked ? 'delete' : 'add'](obj.id);
                obj.set({
                    lockMovementX: !locked,
                    lockMovementY: !locked,
                    lockRotation: !locked,
                    lockScalingX: !locked,
                    lockScalingY: !locked,
                    hasControls: locked // show controls only when unlocked
                });
            });
            canvas.requestRenderAll();
            return next;
        });
    }, []);

    const bringForward = useCallback(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        canvas.getActiveObjects().forEach(obj => canvas.bringObjectForward(obj));
        canvas.requestRenderAll();
    }, []);

    const sendBackward = useCallback(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        canvas.getActiveObjects().forEach(obj => canvas.sendObjectBackwards(obj));
        canvas.requestRenderAll();
    }, []);

    const groupSelection = useCallback(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        const active = canvas.getActiveObject();
        if (active?.type === 'activeSelection') {
            active.toGroup();
            canvas.requestRenderAll();
        }
    }, []);

    const ungroupSelection = useCallback(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        const active = canvas.getActiveObject();
        if (active?.type === 'group') {
            active.toActiveSelection();
            canvas.requestRenderAll();
        }
    }, []);

    const zoomIn = useCallback(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        const newZoom = Math.min(MAX_ZOOM, canvas.getZoom() + ZOOM_STEP);
        canvas.setZoom(newZoom);
        setZoom(newZoom);
    }, []);

    const zoomOut = useCallback(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        const newZoom = Math.max(MIN_ZOOM, canvas.getZoom() - ZOOM_STEP);
        canvas.setZoom(newZoom);
        setZoom(newZoom);
    }, []);

    const resetZoom = useCallback(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        setZoom(1);
    }, []);

    const deleteSelection = useCallback(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        const activeObjects = canvas.getActiveObjects();
        if (!activeObjects.length) return;
        activeObjects.forEach(obj => {
            if (obj.id) onRemoveItem(obj.id);
            canvas.remove(obj);
        });
        canvas.discardActiveObject();
        canvas.requestRenderAll();
    }, [onRemoveItem]);

    // ─── Export High-Res ──────────────────────────────────────────────────────
    const exportHighRes = useCallback((fileName = 'moodboard', format = 'jpeg') => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        const objects = canvas.getObjects();
        if (!objects.length) return;

        const originalVPT = [...canvas.viewportTransform];
        const originalSelection = canvas.selection;

        // ── BUG FIX: Reset zoom/pan before calculating bounds for export ──────
        // This ensures export is zoom-independent
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

        // Hide internal notes from export
        const internalObjs = objects.filter(o => o.isInternal);
        internalObjs.forEach(o => o.set('opacity', 0));
        canvas.renderAll();

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        // Filter out internal objects from bounds calculation
        objects.filter(o => !o.isInternal).forEach(obj => {
            const br = obj.getBoundingRect(true, true);
            if (br.left < minX) minX = br.left;
            if (br.top < minY) minY = br.top;
            if (br.left + br.width > maxX) maxX = br.left + br.width;
            if (br.top + br.height > maxY) maxY = br.top + br.height;
        });

        const padding = 60;
        const left = isFinite(minX) ? minX - padding : 0;
        const top = isFinite(minY) ? minY - padding : 0;
        const width = isFinite(maxX) ? (maxX - minX) + padding * 2 : canvas.width;
        const height = isFinite(maxY) ? (maxY - minY) + padding * 2 : canvas.height;

        try {
            const dataURL = canvas.toDataURL({
                format,
                quality: 1.0,
                multiplier: 2,
                left, top, width, height,
                enableRetinaScaling: true
            });

            const link = document.createElement('a');
            link.download = `${fileName}-design.${format}`;
            link.href = dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Export failed:', err);
            alert('High-res export failed (possibly CORS). Try again or check image sources.');
        } finally {
            internalObjs.forEach(o => o.set('opacity', 1));
            // Restore original zoom and pan
            canvas.setViewportTransform(originalVPT);
            canvas.selection = originalSelection;
            canvas.renderAll();
        }
    }, []);

    // ─── Update single Fabric object properties ───────────────────────────────
    const updateFabricObject = useCallback((id, props) => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        const obj = canvas.getObjects().find(o => o.id === id);
        if (!obj) return;

        const mapped = { ...props };
        if (mapped.textColor) { mapped.fill = mapped.textColor; delete mapped.textColor; }
        if (mapped.scale) { mapped.scaleX = mapped.scale; mapped.scaleY = mapped.scale; delete mapped.scale; }

        obj.set(mapped);
        canvas.requestRenderAll();
        onUpdateItem(id, props);
    }, [onUpdateItem]);

    // ─── Background Removal ───────────────────────────────────────────────────
    const removeSelectedBackground = useCallback(async () => {
        const canvas = fabricRef.current;
        const activeObj = canvas?.getActiveObject();
        if (!activeObj || isProcessingBg) return;

        let imgObj = null;
        if (activeObj.type === 'group') {
            imgObj = activeObj._objects.find(o =>
                o.type === 'image' || o.constructor?.name?.includes('Image')
            );
        } else if (activeObj.type === 'image' || activeObj.constructor?.name?.includes('Image')) {
            imgObj = activeObj;
        }

        if (!imgObj?.getSrc) return;

        try {
            setIsProcessingBg(true);
            setBgProgress(1);

            let src = imgObj.getSrc();
            setBgProgress(5);
            src = await resizeImageForAI(src);

            const blob = await removeBackground(src, {
                progress: (key, current, total) => {
                    setBgProgress(10 + Math.round((current / total) * 80));
                },
                model: 'small'
            });

            setBgProgress(95);

            const reader = new FileReader();
            reader.onload = async (e) => {
                const dataUrl = e.target.result;
                const newImg = await fabric.Image.fromURL(dataUrl, { crossOrigin: 'anonymous' });

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
                    const idx = activeObj._objects.indexOf(imgObj);
                    if (idx > -1) {
                        activeObj.removeWithUpdate(imgObj);
                        activeObj.insertAt(newImg, idx);
                    }
                } else {
                    canvas.remove(imgObj);
                    canvas.add(newImg);
                    canvas.setActiveObject(newImg);
                }

                const objId = activeObj.id || imgObj.id;
                if (objId) {
                    onUpdateItem(objId, {
                        material: {
                            ...(activeObj.materialData || imgObj.materialData || {}),
                            photoUrl: dataUrl,
                            images: [dataUrl],
                            isCustomPhoto: true
                        }
                    });
                }

                canvas.requestRenderAll();
                setIsProcessingBg(false);
                setBgProgress(0);
            };
            reader.readAsDataURL(blob);

        } catch (error) {
            console.error('Background removal failed:', error);
            setIsProcessingBg(false);
            setBgProgress(0);
            alert('Background removal failed. Try with a smaller image or check your connection.');
        }
    }, [isProcessingBg, onUpdateItem]);

    // ─── Serialize canvas state ───────────────────────────────────────────────
    // ── BUG FIX: was incorrectly multiplying w/h by scaleX/scaleY in serialization ──
    const getSerializedState = useCallback(() => {
        const canvas = fabricRef.current;
        if (!canvas) return boardItems;

        // Temporarily discard active selection so grouped items return to canvas tree
        let activeSelectionObjs = null;
        const active = canvas.getActiveObject();
        if (active?.type === 'activeSelection') {
            activeSelectionObjs = active.getObjects();
            canvas.discardActiveObject();
        }

        const serialized = canvas.getObjects().map(fObj => {
            if (!fObj.id) return null;
            const existingMeta = boardItems.find(i => i.id === fObj.id) || {};

            if (fObj.isInternal || fObj.type === 'textbox') {
                return {
                    ...existingMeta,
                    id: fObj.id,
                    type: 'internal-note',
                    text: fObj.text,
                    textColor: fObj.fill,
                    fontSize: fObj.fontSize,
                    x: fObj.left,
                    y: fObj.top,
                    // ── BUG FIX: store scaleX/scaleY consistently ──────────
                    scaleX: fObj.scaleX,
                    scaleY: fObj.scaleY,
                    scale: fObj.scaleX,
                    rotation: fObj.angle
                };
            } else if (['i-text', 'text'].includes(fObj.type)) {
                return {
                    ...existingMeta,
                    id: fObj.id,
                    type: 'text',
                    text: fObj.text,
                    textColor: fObj.fill,
                    fontSize: fObj.fontSize,
                    x: fObj.left,
                    y: fObj.top,
                    scaleX: fObj.scaleX,
                    scaleY: fObj.scaleY,
                    scale: fObj.scaleX,
                    rotation: fObj.angle
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
                    // ── BUG FIX: store raw width, scale is separate ─────────
                    w: fObj.width,
                    h: fObj.height
                };
            }
        }).filter(Boolean);

        // Restore selection
        if (activeSelectionObjs) {
            const newSel = new fabric.ActiveSelection(activeSelectionObjs, { canvas });
            canvas.setActiveObject(newSel);
        }

        return serialized;
    }, [boardItems]);

    // ─── Return public API ────────────────────────────────────────────────────
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
        getSerializedState
    };
}