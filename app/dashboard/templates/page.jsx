'use client';

import { useState, useEffect } from 'react';
import { useGetTemplates, useUseTemplate } from '@/hooks/useTemplate';
import TemplateCard from '@/components/dashboard/projects/TemplateCard';
import useAuthStore from '@/store/useAuthStore';
import { Search, Loader2, Briefcase, Plus, X } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';

export default function TemplatesPage() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [mounted, setMounted] = useState(false);
    const [isUseModalOpen, setIsUseModalOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [newProjectName, setNewProjectName] = useState('');
    const [clientName, setClientName] = useState('');

    const useTemplateMutation = useUseTemplate();

    useEffect(() => {
        setMounted(true);
    }, []);

    const { data: templatesData, isLoading } = useGetTemplates();

    const templates = Array.isArray(templatesData?.data) ? templatesData.data : [];

    const handleUseClick = (template) => {
        setSelectedTemplate(template);
        setNewProjectName(`${template.templateName} Copy`);
        setIsUseModalOpen(true);
    };

    const handleConfirmUse = async (e) => {
        e.preventDefault();
        if (!newProjectName.trim()) {
            toast.error('Project name is required');
            return;
        }

        useTemplateMutation.mutate(
            { 
                templateId: selectedTemplate._id, 
                data: { projectName: newProjectName, clientName } 
            },
            {
                onSuccess: (response) => {
                    setIsUseModalOpen(false);
                    router.push('/dashboard/projects');
                }
            }
        );
    };

    const filteredTemplates = templates.filter(template => 
        template.templateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!mounted) return null;

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto">
            <div className="mb-6 sm:mb-8">
                <h1 className="text-[28px] font-extrabold text-[#2d3142] tracking-tight">Project Templates</h1>
                <p className="text-gray-500 text-sm mt-1">Quickly start new projects using your saved configurations</p>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="relative shrink-0 flex-1 min-w-[200px] md:max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search templates..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 shadow-sm focus:border-[#d9a88a] focus:ring-1 focus:ring-[#d9a88a] rounded-2xl transition-all text-sm text-gray-600 font-medium outline-none"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                    <Loader2 className="w-12 h-12 text-[#d9a88a] animate-spin mb-4" />
                    <p className="text-gray-400 font-bold text-lg">Loading your templates...</p>
                </div>
            ) : filteredTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(400px,1fr))] gap-4 sm:gap-6 w-full">
                    {filteredTemplates.map(template => (
                        <TemplateCard
                            key={template._id}
                            template={template}
                            onUse={handleUseClick}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[40px] border border-dashed border-gray-200 text-center">
                    <div className="w-24 h-24 bg-gray-50 rounded-3xl flex items-center justify-center mb-8">
                        <Briefcase className="w-12 h-12 text-gray-200" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#2d3142] mb-3">No templates found</h3>
                    <p className="text-gray-400 font-medium max-w-sm mx-auto">
                        {searchTerm
                            ? "We couldn't find any templates matching your search."
                            : "Save a project as a template from the project card to see it here!"}
                    </p>
                </div>
            )}

            {/* Use Template Modal */}
            {isUseModalOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="px-8 pt-8 pb-4 flex items-center justify-between">
                            <h2 className="text-2xl font-extrabold text-[#2d3142]">Use Template</h2>
                            <button onClick={() => setIsUseModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleConfirmUse} className="px-8 pb-8 space-y-6">
                            <p className="text-gray-500 text-sm">
                                Create a new project based on <strong>{selectedTemplate?.templateName}</strong>. 
                                Spaces and estimations will be copied exactly.
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">New Project Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newProjectName}
                                        onChange={(e) => setNewProjectName(e.target.value)}
                                        className="w-full px-4 py-3 bg-[#f8f9fa] border border-transparent focus:bg-white focus:border-[#d9a88a] rounded-xl outline-none transition-all font-semibold text-[#2d3142]"
                                        placeholder="Enter project name..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Client Name (Optional)</label>
                                    <input
                                        type="text"
                                        value={clientName}
                                        onChange={(e) => setClientName(e.target.value)}
                                        className="w-full px-4 py-3 bg-[#f8f9fa] border border-transparent focus:bg-white focus:border-[#d9a88a] rounded-xl outline-none transition-all font-semibold text-[#2d3142]"
                                        placeholder="Enter client name..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsUseModalOpen(false)}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={useTemplateMutation.isPending}
                                    className="flex-1 py-3 px-4 bg-[#3c4153] hover:bg-[#2d3142] text-white rounded-xl font-bold shadow-lg shadow-gray-200 transition-all flex items-center justify-center gap-2"
                                >
                                    {useTemplateMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Plus className="w-4 h-4" />
                                    )}
                                    Create Project
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
