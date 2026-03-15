'use client';

import { useState } from 'react';
import { X, Upload, Check, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Image from 'next/image';

export default function CoverSelectionModal({
    isOpen,
    onClose,
    onSelect,
    isUploading = false
}) {
    const [uploadFile, setUploadFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setUploadFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUploadClick = () => {
        if (uploadFile) {
            onSelect({ type: 'file', file: uploadFile });
        }
    };

    const handleClose = () => {
        setUploadFile(null);
        setPreviewUrl(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[32px] w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-[#2d3142]">Update Cover Image</h2>
                        <p className="text-sm text-gray-400 font-medium">Upload a custom image for your cover</p>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-[32px] py-12 px-6 bg-gray-50/50">
                        {(typeof previewUrl === 'string' && previewUrl.trim()) ? (
                            <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-6 group shadow-md">
                                <Image src={previewUrl.trim()} alt="Preview" fill className="object-cover" />
                                <button
                                    onClick={() => { setUploadFile(null); setPreviewUrl(null); }}
                                    className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur rounded-full text-red-500 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center cursor-pointer group w-full py-8">
                                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                                    <Upload className="w-8 h-8 text-[#d9a88a]" />
                                </div>
                                <p className="text-lg font-bold text-[#2d3142]">Click to upload</p>
                                <p className="text-sm text-gray-400 font-medium mt-1">PNG, JPG or WEBP (Max 5MB)</p>
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                        )}

                        {uploadFile && (
                            <Button
                                onClick={handleUploadClick}
                                disabled={isUploading}
                                className="mt-2 bg-[#d9a88a] text-white px-10 py-3.5 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                            >
                                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                Set as Cover Image
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
