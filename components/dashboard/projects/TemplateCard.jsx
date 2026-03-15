'use client';

import { useState, useRef, useEffect } from 'react';
import { Trash2, MoreHorizontal, Briefcase, Edit2, ImagePlus, Ruler } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '@/lib/productUtils';
import { useDeleteTemplate, useUpdateTemplate } from '@/hooks/useTemplate';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { toast } from 'sonner';

export default function TemplateCard({ template, onUse }) {
    const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isUploadingCover, setIsUploadingCover] = useState(false);
    const optionsMenuRef = useRef(null);
    const coverInputRef = useRef(null);
    const deleteTemplateMutation = useDeleteTemplate();
    const updateTemplateMutation = useUpdateTemplate();

    const { _id, templateName, type, size, description, coverImage } = template;

    useEffect(() => {
        function handleClickOutside(event) {
            if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target)) {
                setIsOptionsMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDelete = async () => {
        deleteTemplateMutation.mutate(_id);
        setIsDeleteModalOpen(false);
    };

    const handleCoverImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        setIsUploadingCover(true);
        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target.result;
            updateTemplateMutation.mutate(
                { templateId: _id, data: { coverImage: dataUrl } },
                {
                    onSuccess: () => {
                        toast.success('Cover image updated!');
                        setIsUploadingCover(false);
                    },
                    onError: () => {
                        toast.error('Failed to update cover image');
                        setIsUploadingCover(false);
                    }
                }
            );
        };
        reader.readAsDataURL(file);
        setIsOptionsMenuOpen(false);
    };

    const coverUrl = getImageUrl(coverImage);

    return (
        <div className="bg-white rounded-[24px] border border-gray-100 p-4 flex flex-col md:flex-row gap-4 hover:shadow-lg hover:border-gray-200 transition-all group relative h-full w-full mx-auto md:mx-0">
            <div className="flex-[1.2] flex flex-col min-w-0 p-2 relative">
                <div className="absolute top-0 right-0 z-30" ref={optionsMenuRef}>
                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOptionsMenuOpen(!isOptionsMenuOpen); }}
                        className="p-1.5 text-gray-400 hover:text-[#2d3142] hover:bg-gray-100 rounded-lg transition-all"
                    >
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                    {isOptionsMenuOpen && (
                        <div className="absolute top-full right-0 mt-1 w-52 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.11)] border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                            <Link
                                href={`/dashboard/templates/${_id}/spaces`}
                                className="w-full text-left px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-[#d9a88a] flex items-center gap-2 transition-colors cursor-pointer"
                            >
                                <Edit2 className="w-4 h-4" /> Edit Spaces
                            </Link>
                            <button
                                onClick={(e) => { e.stopPropagation(); coverInputRef.current?.click(); }}
                                className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#d9a88a] flex items-center gap-2 transition-colors"
                            >
                                {isUploadingCover ? (
                                    <span className="w-4 h-4 border-2 border-[#d9a88a] border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <ImagePlus className="w-4 h-4" />
                                )}
                                Change Cover Image
                            </button>
                            <div className="border-t border-gray-100 my-1" />
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOptionsMenuOpen(false); setIsDeleteModalOpen(true); }}
                                className="w-full text-left px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
                            >
                                <Trash2 className="w-4 h-4" /> Delete Template
                            </button>
                        </div>
                    )}
                    {/* Hidden file input */}
                    <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCoverImageChange}
                    />
                </div>

                <div className="flex flex-col gap-0.5 mb-6 pr-8">
                    <h3 className="text-[20px] font-extrabold text-[#2d3142] truncate max-w-[200px]">
                        {templateName}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
                        <Briefcase className="w-4 h-4" />
                        <span>{type || 'No type'}</span>
                        {size && (
                            <>
                                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                <span>{size}</span>
                            </>
                        )}
                    </div>
                </div>

                <p className="text-sm text-gray-500 line-clamp-2 mb-6">
                    {description || 'No description provided for this template.'}
                </p>

                <div className="mt-auto flex items-center gap-3">
                    <button
                        onClick={() => onUse(template)}
                        className="inline-flex items-center justify-center px-6 py-2.5 bg-[#3c4153] text-white text-[13px] font-bold rounded-full hover:bg-[#2d3142] transition-colors shadow-sm"
                    >
                        Use Template
                    </button>
                    <Link
                        href={`/dashboard/templates/${_id}/spaces`}
                        className="inline-flex items-center justify-center px-6 py-2.5 bg-white border border-gray-200 text-[#2d3142] text-[13px] font-bold rounded-full hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Modify
                    </Link>
                </div>
            </div>

            <div className="flex-[1.4] bg-[#fafafb] rounded-[16px] flex items-center justify-between border border-gray-50 group-hover:border-gray-100 transition-colors relative min-w-0 overflow-hidden min-h-[160px]">
                {coverUrl ? (
                    <div className="absolute inset-0 z-0">
                        <Image src={coverUrl} alt="" fill className="object-cover opacity-80" />
                        <div className="absolute inset-0 bg-linear-to-r from-black/40 to-transparent" />
                    </div>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 text-gray-200">
                        <Briefcase className="w-16 h-16 opacity-10" />
                    </div>
                )}
                
                <div className="z-10 p-4 w-full h-full flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                            Template
                        </span>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Template"
                message={`Are you sure you want to delete "${templateName}"? This action cannot be undone.`}
                confirmText="Delete"
                type="danger"
            />
        </div>
    );
}
