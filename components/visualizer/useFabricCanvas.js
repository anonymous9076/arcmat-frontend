'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { getProductImageUrl, getVariantImageUrl, getProductName, getProductCategory } from '@/lib/productUtils';

const DEFAULT_CARD_W = 148;
const DEFAULT_CARD_H = 172;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

export function useFabricCanvas({
    boardItems,
    onUpdateItem,
    onRemoveItem,
    onReposition,
    onMaterialSelect,
    initialWidth,
    initialHeight
}) {
    const canvasRef = useRef(null);
    const fabricRef = useRef(null);
    const [zoom, setZoom] = useState(1);
    const [panMode, setPanMode] = useState(false);
    const panModeRef = useRef(panMode);
    useEffect(() => { panModeRef.current = panMode; }, [panMode]);
    const [lockedIds, setLockedIds] = useState(new Set());
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [activeMenuConfig, setActiveMenuConfig] = useState(null);
    const [canvasReady, setCanvasReady] = useState(false);

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

        // --- Zooming ---
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
            const wrapper = canvasRef.current?.parentElement;
            if (wrapper) {
                canvas.setDimensions({ width: wrapper.clientWidth, height: wrapper.clientHeight });
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();

        setCanvasReady(true);

        return () => {
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
                        const scaleMath = Math.min(scaleX, scaleY) * 0.85;

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
                            fill: 'white',
                            rx: 16,
                            ry: 16,
                            shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.15)', blur: 20, offsetY: 10 }),
                            stroke: '#fff',
                            strokeWidth: 2
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
    const deleteSelection = useCallback(() => {
        if (!fabricRef.current) return;
        const canvas = fabricRef.current;
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length) {
            activeObjects.forEach(obj => { if (obj.id) onRemoveItem(obj.id); });
            canvas.discardActiveObject();
            canvas.requestRenderAll();
        }
    }, [onRemoveItem]);

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

    const bringForward = useCallback(() => { if (fabricRef.current?.getActiveObject()) { fabricRef.current.bringObjectForward(fabricRef.current.getActiveObject()); fabricRef.current.requestRenderAll(); } }, []);
    const sendBackward = useCallback(() => { if (fabricRef.current?.getActiveObject()) { fabricRef.current.sendObjectBackwards(fabricRef.current.getActiveObject()); fabricRef.current.requestRenderAll(); } }, []);
    const groupSelection = useCallback(() => { if (!fabricRef.current) return; const canvas = fabricRef.current; if (canvas.getActiveObject()?.type === 'activeSelection') { canvas.getActiveObject().toGroup(); canvas.requestRenderAll(); } }, []);
    const ungroupSelection = useCallback(() => { if (!fabricRef.current) return; const activeObj = fabricRef.current.getActiveObject(); if (activeObj?.type === 'group') { activeObj.toActiveSelection(); fabricRef.current.requestRenderAll(); } }, []);
    const zoomIn = useCallback(() => { if (!fabricRef.current) return; let newZoom = fabricRef.current.getZoom() + ZOOM_STEP; if (newZoom > MAX_ZOOM) newZoom = MAX_ZOOM; fabricRef.current.setZoom(newZoom); setZoom(newZoom); }, []);
    const zoomOut = useCallback(() => { if (!fabricRef.current) return; let newZoom = fabricRef.current.getZoom() - ZOOM_STEP; if (newZoom < MIN_ZOOM) newZoom = MIN_ZOOM; fabricRef.current.setZoom(newZoom); setZoom(newZoom); }, []);
    const resetZoom = useCallback(() => { if (!fabricRef.current) return; fabricRef.current.setViewportTransform([1, 0, 0, 1, 0, 0]); setZoom(1); }, []);

    // --- Export High-Res ---
    const exportHighRes = useCallback((fileName = 'moodboard', format = 'png') => {
        if (!fabricRef.current) return;
        const canvas = fabricRef.current;
        const objects = canvas.getObjects();
        if (!objects.length) return;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        objects.forEach(obj => {
            const br = obj.getBoundingRect(true, true);
            if (br.left < minX) minX = br.left;
            if (br.top < minY) minY = br.top;
            if (br.left + br.width > maxX) maxX = br.left + br.width;
            if (br.top + br.height > maxY) maxY = br.top + br.height;
        });

        const pad = 50;
        minX -= pad; minY -= pad; maxX += pad; maxY += pad;
        const width = maxX - minX;
        const height = maxY - minY;
        const multiplier = 300 / 72;

        canvas.discardActiveObject();
        canvas.renderAll();

        try {
            const dataURL = canvas.toDataURL({ format, quality: 1, multiplier, left: minX, top: minY, width, height, enableRetinaScaling: true });
            const link = document.createElement('a');
            link.download = `${fileName}-highres.${format}`;
            link.href = dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error("Export failed:", err);
            alert("High-Res export failed (possibly due to CORS images).");
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

    return {
        canvasRef,
        zoom,
        panMode,
        setPanMode,
        lockedIds,
        selectedIds,
        zoomIn,
        zoomOut,
        resetZoom,
        deleteSelection,
        toggleLock,
        bringForward,
        sendBackward,
        groupSelection,
        ungroupSelection,
        exportHighRes,
        updateFabricObject,
        activeMenuConfig
    };
}