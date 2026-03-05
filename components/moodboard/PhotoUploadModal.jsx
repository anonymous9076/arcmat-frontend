'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Upload, ImagePlus } from 'lucide-react';

export default function PhotoUploadModal({ isOpen, onClose, onAdd }) {
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef(null);

    const reset = () => {
        setFile(null);
        setPreviewUrl(null);
        setTitle('');
        setDescription('');
        setPrice(0);
        setQuantity(1);
    };

    const handleClose = () => { reset(); onClose(); };

    const handleFile = (f) => {
        if (!f || !f.type.startsWith('image/')) return;
        setFile(f);
        setPreviewUrl(URL.createObjectURL(f));
        if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files?.[0]);
    }, []);

    const compressImage = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const max_size = 1200;

                    if (width > height) {
                        if (width > max_size) {
                            height *= max_size / width;
                            width = max_size;
                        }
                    } else {
                        if (height > max_size) {
                            width *= max_size / height;
                            height = max_size;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/webp', 0.8));
                };
                img.onerror = (e) => reject(e);
            };
            reader.onerror = (e) => reject(e);
        });
    };

    const handleAdd = async () => {
        if (!file || !title.trim()) return;
        try {
            // Compress to base64 webp so it can be saved persistently in MongoDB
            const base64Url = await compressImage(file);

            // onAdd expects { file: null, previewUrl: <persistent url>, title, description, price, quantity }
            onAdd({
                file: null,
                previewUrl: base64Url,
                title: title.trim(),
                description: description.trim(),
                price: Number(price) || 0,
                quantity: Number(quantity) || 1
            });
            reset();
            onClose();
        } catch (error) {
            console.error("Error compressing image:", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-black text-[#1a1a2e]">Add an image or video</h2>
                    <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-4 space-y-4">
                    {/* Drop zone / Preview */}
                    <div
                        onClick={() => !previewUrl && inputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        className={`relative w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 border-dashed transition-all cursor-pointer ${dragging ? 'border-[#d9a88a] bg-[#fef7f2]' : previewUrl ? 'border-transparent' : 'border-gray-200 hover:border-[#d9a88a] hover:bg-[#fef7f2]/50'}`}
                    >
                        {previewUrl ? (
                            <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    onClick={(e) => { e.stopPropagation(); setFile(null); setPreviewUrl(null); }}
                                    className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-xl shadow text-gray-500 hover:text-red-500 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                                    className="absolute bottom-2 right-2 p-2 bg-white/90 rounded-xl shadow text-gray-500 hover:text-[#d9a88a] transition-colors"
                                    title="Change image"
                                >
                                    <ImagePlus className="w-4 h-4" />
                                </button>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                                <Upload className="w-10 h-10" />
                                <p className="text-sm font-semibold text-center">Drag & drop or click to upload</p>
                                <p className="text-xs text-center">PNG, JPG, WEBP up to 20MB</p>
                            </div>
                        )}
                        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
                    </div>

                    {/* Title */}
                    <div className="border-b border-gray-100 pb-3">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Add title *</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. wooden board"
                            className="w-full text-sm text-gray-800 font-medium bg-transparent focus:outline-none placeholder:text-gray-300"
                        />
                    </div>

                    {/* Description */}
                    <div className="border-b border-gray-100 pb-3">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Add description</label>
                        <input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional note…"
                            className="w-full text-sm text-gray-600 bg-transparent focus:outline-none placeholder:text-gray-300"
                        />
                    </div>

                    {/* Price & Quantity */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="border-b border-gray-100 pb-3">
                            <label className="block text-xs font-bold text-gray-500 mb-1">Quantity</label>
                            <input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="w-full text-sm text-gray-800 font-medium bg-transparent focus:outline-none"
                            />
                        </div>
                        <div className="border-b border-gray-100 pb-3">
                            <label className="block text-xs font-bold text-gray-500 mb-1">Price (₹)</label>
                            <input
                                type="number"
                                min="0"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full text-sm text-gray-800 font-medium bg-transparent focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
                    <button onClick={handleClose} className="px-5 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-50 rounded-xl transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleAdd}
                        disabled={!file || !title.trim()}
                        className="px-6 py-2.5 bg-[#1a1a2e] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl hover:bg-[#2d2d4a] transition-colors"
                    >
                        Add
                    </button>
                </div>
            </div>
        </div>
    );
}
