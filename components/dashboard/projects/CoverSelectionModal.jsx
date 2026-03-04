'use client';

import { useState } from 'react';
import { X, Upload, Check, Loader2, Image as ImageIcon } from 'lucide-react';
import Button from '@/components/ui/Button';
import { getProductImageUrl } from '@/lib/productUtils';
import Image from 'next/image';

export default function CoverSelectionModal({
    isOpen,
    onClose,
    onSelect,
    materials = [],
    isUploading = false
}) {
    const [selectedTab, setSelectedTab] = useState('materials');
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

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-[#2d3142]">Update Cover Image</h2>
                        <p className="text-sm text-gray-400 font-medium">Choose a material or upload a custom image</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="flex p-2 bg-gray-50 m-6 rounded-2xl">
                    <button
                        onClick={() => setSelectedTab('materials')}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${selectedTab === 'materials' ? 'bg-white text-[#d9a88a] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        From Materials
                    </button>
                    <button
                        onClick={() => setSelectedTab('upload')}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${selectedTab === 'upload' ? 'bg-white text-[#d9a88a] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Upload Custom
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    {selectedTab === 'materials' ? (
                        <div className="grid grid-cols-3 gap-4">
                            {materials.length > 0 ? (
                                materials.map((item, i) => {
                                    const m = item.material;
                                    const imgUrl = m.images?.length ? getProductImageUrl(m.images[0]) :
                                        m.variant_images?.length ? getProductImageUrl(m.variant_images[0]) : null;

                                    if (!imgUrl) return null;

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => onSelect({ type: 'url', url: imgUrl })}
                                            className="relative aspect-square rounded-2xl overflow-hidden border-2 border-transparent hover:border-[#d9a88a] transition-all group"
                                        >
                                            <Image src={imgUrl} alt="" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="col-span-3 py-12 flex flex-col items-center justify-center text-gray-300">
                                    <ImageIcon className="w-12 h-12 mb-4" />
                                    <p className="font-bold">No materials found in this board</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-[32px] py-12 px-6">
                            {previewUrl ? (
                                <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-6 group">
                                    <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                                    <button
                                        onClick={() => { setUploadFile(null); setPreviewUrl(null); }}
                                        className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur rounded-full text-red-500 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center cursor-pointer group">
                                    <div className="w-20 h-20 bg-[#fef7f2] rounded-3xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
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
                                    className="mt-6 bg-[#d9a88a] text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2"
                                >
                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    Set as Cover
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
