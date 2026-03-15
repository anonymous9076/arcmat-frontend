'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGetMoodboardTemplates, useUpdateTemplate, useUpdateMoodboardTemplate, TEMPLATE_KEYS } from '@/hooks/useTemplate';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { projectTemplateService } from '@/services/projectTemplateService';
import { 
    LayoutDashboard, Plus, Search, Loader2, ArrowLeft, 
    MoreHorizontal, Edit2, Trash2, ChevronRight, Briefcase, Check, X
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';
import { getImageUrl, getProductThumbnail } from '@/lib/productUtils';
import Container from '@/components/ui/Container';
import CreateProjectModal from '@/components/dashboard/sidebar/CreateProjectModal';

export default function TemplateSpacesPage() {
    const { templateId } = useParams();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [renamingSpaceId, setRenamingSpaceId] = useState(null);
    const [renameValue, setRenameValue] = useState('');

    // Fetch Template Basic Info
    const { data: templateData, isLoading: isLoadingTemplate } = useQuery({
        queryKey: ['project-templates', 'detail', templateId],
        queryFn: () => projectTemplateService.getTemplates().then(res => res.data.find(t => t._id === templateId)),
        enabled: !!templateId
    });

    // Fetch Template Moodboards
    const { data: spacesData, isLoading: isLoadingSpaces } = useGetMoodboardTemplates(templateId);
    const spaces = Array.isArray(spacesData?.data) ? spacesData.data : [];

    const updateSpaceMutation = useUpdateMoodboardTemplate();
    const queryClient = useQueryClient();

    const handleStartRename = (space) => {
        setRenamingSpaceId(space._id);
        setRenameValue(space.moodboard_name);
    };

    const handleSaveRename = () => {
        if (!renameValue.trim()) return;
        updateSpaceMutation.mutate({ 
            spaceId: renamingSpaceId, 
            data: { moodboard_name: renameValue } 
        }, {
            onSuccess: () => {
                setRenamingSpaceId(null);
                queryClient.invalidateQueries({ queryKey: TEMPLATE_KEYS.all });
                toast.success('Space renamed');
            }
        });
    };

    // Extract up to 4 product thumbnail URLs from estimation productIds
    const getPreviewImages = (space) => {
        const products = space?.estimation?.productIds || [];
        return products
            .slice(0, 4)
            .map(p => getProductThumbnail(p))
            .filter(Boolean);
    };

    const filteredSpaces = spaces.filter(space =>
        space.moodboard_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoadingTemplate || isLoadingSpaces) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 text-[#d9a88a] animate-spin mb-3" />
                <p className="text-gray-400 font-semibold text-sm">Loading template spaces...</p>
            </div>
        );
    }

    const template = templateData;

    return (
        <div className="min-h-screen bg-[#fafafb] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
                <Container className="py-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => router.push('/dashboard/templates')}
                                className="p-2.5 bg-gray-50 text-gray-400 hover:text-[#2d3142] hover:bg-gray-100 rounded-xl transition-all"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Briefcase className="w-4 h-4 text-gray-400" />
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Template Editor</span>
                                </div>
                                <h1 className="text-2xl font-black text-[#2d3142] tracking-tight">{template?.templateName}</h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsEditModalOpen(true)}
                                className="px-5 py-2.5 bg-[#3c4153] text-white rounded-xl font-bold text-sm shadow-lg shadow-gray-200 hover:bg-[#2d3142] transition-all flex items-center gap-2"
                            >
                                <Edit2 className="w-4 h-4" /> Edit Template
                            </button>
                            <div className="relative shrink-0 flex-1 min-w-[200px] md:max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search spaces in template..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-[#d9a88a] rounded-xl transition-all text-sm font-medium outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </Container>
            </div>

            <Container className="mt-8">
                {filteredSpaces.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredSpaces.map((space) => (
                            <div 
                                key={space._id}
                                className="group bg-white rounded-[32px] border border-gray-100 overflow-hidden hover:shadow-2xl hover:border-[#d9a88a]/30 transition-all duration-500 flex flex-col h-full"
                            >
                                {/* card image - 2x2 product grid like MoodboardCard */}
                                <div className="aspect-square relative overflow-hidden bg-gray-50 group/preview">
                                    {getImageUrl(space.coverImage) ? (
                                        <Image 
                                            src={getImageUrl(space.coverImage)} 
                                            alt={space.moodboard_name}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                    ) : (() => {
                                        const previewImages = getPreviewImages(space);
                                        return previewImages.length > 0 ? (
                                            <div className="h-full w-full grid grid-cols-2 grid-rows-2 gap-[2px]">
                                                {previewImages.length === 1 && (
                                                    <div className="col-span-2 row-span-2 relative h-full w-full">
                                                        <Image src={previewImages[0]} alt="" fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                                                    </div>
                                                )}
                                                {previewImages.length === 2 && (
                                                    <>
                                                        <div className="row-span-2 relative h-full w-full"><Image src={previewImages[0]} alt="" fill className="object-cover" /></div>
                                                        <div className="row-span-2 relative h-full w-full"><Image src={previewImages[1]} alt="" fill className="object-cover" /></div>
                                                    </>
                                                )}
                                                {previewImages.length === 3 && (
                                                    <>
                                                        <div className="row-span-2 relative h-full w-full"><Image src={previewImages[0]} alt="" fill className="object-cover" /></div>
                                                        <div className="relative h-full w-full"><Image src={previewImages[1]} alt="" fill className="object-cover" /></div>
                                                        <div className="relative h-full w-full"><Image src={previewImages[2]} alt="" fill className="object-cover" /></div>
                                                    </>
                                                )}
                                                {previewImages.length >= 4 && previewImages.map((img, i) => (
                                                    <div key={i} className="relative h-full w-full">
                                                        <Image src={img} alt="" fill className="object-cover" />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <LayoutDashboard className="w-12 h-12 text-gray-200" />
                                            </div>
                                        );
                                    })()}
                                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    
                                    {/* Quick Edit Overlay */}
                                    <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                        <button 
                                            onClick={() => router.push(`/dashboard/templates/${templateId}/spaces/${space._id}`)}
                                            className="w-full py-3 bg-white text-[#2d3142] rounded-2xl font-bold text-sm shadow-xl hover:bg-[#2d3142] hover:text-white transition-all flex items-center justify-center gap-2"
                                        >
                                            <Edit2 className="w-4 h-4" /> Edit Space Template
                                        </button>
                                    </div>
                                </div>

                                {/* content */}
                                <div className="p-6 flex flex-col flex-1">
                                        {renamingSpaceId === space._id ? (
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <input 
                                                    autoFocus
                                                    value={renameValue}
                                                    onChange={e => setRenameValue(e.target.value)}
                                                    onKeyDown={e => { if (e.key === 'Enter') handleSaveRename(); if (e.key === 'Escape') setRenamingSpaceId(null); }}
                                                    onClick={e => e.stopPropagation()}
                                                    className="w-full font-bold text-lg text-[#2d3142] bg-gray-50 border-b-2 border-[#d9a88a] focus:outline-none"
                                                />
                                                <button onClick={(e) => { e.stopPropagation(); handleSaveRename(); }} className="p-1 text-green-600"><Check className="w-4 h-4" /></button>
                                                <button onClick={(e) => { e.stopPropagation(); setRenamingSpaceId(null); }} className="p-1 text-red-400"><X className="w-4 h-4" /></button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between gap-4 w-full group/name">
                                                <h3 className="font-bold text-lg text-[#2d3142] leading-tight group-hover:text-[#d9a88a] transition-colors line-clamp-1">
                                                    {space.moodboard_name}
                                                </h3>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleStartRename(space); }}
                                                    className="p-1.5 opacity-0 group-hover/name:opacity-100 bg-gray-50 text-gray-400 hover:text-[#d9a88a] rounded-lg transition-all"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    
                                    <div className="mt-auto pt-4 flex items-center justify-between">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                            {space.canvasState?.length || 0} Elements
                                        </span>
                                        <button 
                                            onClick={() => router.push(`/dashboard/templates/${templateId}/spaces/${space._id}`)}
                                            className="p-2 text-gray-300 hover:text-[#d9a88a] transition-colors"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-[40px] border border-dashed border-gray-200 p-20 flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6">
                            <LayoutDashboard className="w-10 h-10 text-gray-200" />
                        </div>
                        <h2 className="text-xl font-bold text-[#2d3142] mb-2">No spaces found</h2>
                        <p className="text-gray-400 max-w-sm mx-auto">
                            {searchTerm 
                                ? "No template spaces match your search criteria." 
                                : "This template has no spaces yet."}
                        </p>
                    </div>
                )}
            </Container>

            {isEditModalOpen && (
                <CreateProjectModal 
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    project={template}
                    isTemplate={true}
                />
            )}
        </div>
    );
}
