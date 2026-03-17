'use client';

import { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import projectOptions from './project-options.json';
import Button from '@/components/ui/Button';
import { useCreateProject, useUpdateProject } from '@/hooks/useProject';
import { useGetTemplates, useUseTemplate, useUpdateTemplate } from '@/hooks/useTemplate';
import { Loader2, Briefcase, Plus } from 'lucide-react';
import { toast } from '@/components/ui/Toast';

export default function CreateProjectModal({ isOpen, onClose, project = null, isTemplate = false }) {
    const isEditMode = !!project;

    const [formData, setFormData] = useState({
        name: '',
        clientName: '',
        location: {
            city: '',
            country: 'India',
            address: ''
        },
        type: '',
        phase: '',
        size: '',
        budget: '',
        estimatedDuration: {
            month: '',
            year: ''
        },
        description: ''
    });

    const createProjectMutation = useCreateProject();
    const updateProjectMutation = useUpdateProject();
    const updateTemplateMutation = useUpdateTemplate();
    const useTemplateMutation = useUseTemplate();

    const [activeTab, setActiveTab] = useState('scratch'); // 'scratch' or 'template'
    const { data: templatesData, isLoading: isLoadingTemplates } = useGetTemplates({
        enabled: isOpen && !isEditMode && activeTab === 'template'
    });
    const [selectedTemplateId, setSelectedTemplateId] = useState('');

    useEffect(() => {
        if (project) {
            setFormData({
                name: (isTemplate ? project.templateName : project.projectName) || '',
                clientName: project.clientName || '',
                location: project.location || { city: '', country: 'India', address: '' },
                type: project.type || '',
                phase: project.phase || (isTemplate ? 'Concept Design' : ''),
                size: project.size || '',
                budget: project.budget || '',
                estimatedDuration: project.estimatedDuration || { month: '', year: '' },
                description: project.description || ''
            });
        } else {
            setFormData({
                name: '',
                clientName: '',
                location: { city: '', country: 'India', address: '' },
                type: '',
                phase: '',
                size: '',
                budget: '',
                estimatedDuration: { month: '', year: '' },
                description: ''
            });
        }
    }, [project, isOpen, isTemplate]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: { ...prev[parent], [child]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSelect = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isTemplate) {
            // Template Edit Mode Logic
            const payload = {
                templateName: formData.name,
                type: formData.type,
                size: formData.size,
                description: formData.description
            };
            updateTemplateMutation.mutate({ templateId: project._id, data: payload }, {
                onSuccess: () => {
                    onClose();
                }
            });
            return;
        }

        if (!formData.phase) {
            toast.error('Please select a project phase');
            return;
        }

        const payload = {
            projectName: formData.name,
            clientName: formData.clientName,
            location: {
                ...formData.location,
                city: formData.location.city,
                address: formData.location.address
            },
            type: formData.type,
            phase: formData.phase,
            size: formData.size,
            budget: formData.budget,
            estimatedDuration: formData.estimatedDuration,
            description: formData.description
        };

        if (isEditMode) {
            updateProjectMutation.mutate({ id: project._id, data: payload }, {
                onSuccess: () => {
                    onClose();
                }
            });
        } else if (activeTab === 'template' && selectedTemplateId) {
            useTemplateMutation.mutate({ 
                templateId: selectedTemplateId, 
                data: payload 
            }, {
                onSuccess: () => {
                    onClose();
                    resetForm();
                }
            });
        } else {
            createProjectMutation.mutate(payload, {
                onSuccess: () => {
                    onClose();
                    resetForm();
                }
            });
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            clientName: '',
            location: { city: '', country: 'India', address: '' },
            type: '',
            phase: '',
            size: '',
            budget: '',
            estimatedDuration: { month: '', year: '' },
            description: ''
        });
        setSelectedTemplateId('');
        setActiveTab('scratch');
    };

    const SelectionGrid = ({ options, selectedValue, onSelect, fieldName }) => (
        <div className="flex flex-wrap gap-2 mt-2">
            {options.map((option) => (
                <button
                    key={option}
                    type="button"
                    onClick={() => onSelect(fieldName, option)}
                    className={clsx(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                        selectedValue === option
                            ? "bg-[#4a4b57] text-white border-[#4a4b57]"
                            : "bg-[#f3f4f6] text-gray-600 border-transparent hover:bg-gray-200"
                    )}
                >
                    {option}
                </button>
            ))}
        </div>
    );

    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300">
            <div
                className="bg-white rounded-4xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 will-change-transform"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-8 bg-white border-b border-gray-50 shrink-0">
                    <h2 className="text-3xl font-black text-[#2d3142] tracking-tight">
                        {isTemplate ? 'Edit Template' : (isEditMode ? 'Edit Project' : 'New Project')}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 pt-6 space-y-8 custom-scrollbar overscroll-contain">
                    {!isEditMode && (
                        <div className="flex p-1 bg-gray-100 rounded-2xl">
                            <button
                                type="button"
                                onClick={() => setActiveTab('scratch')}
                                className={clsx(
                                    "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all",
                                    activeTab === 'scratch' ? "bg-white text-[#2d3142] shadow-sm" : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                Start from scratch
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('template')}
                                className={clsx(
                                    "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all",
                                    activeTab === 'template' ? "bg-white text-[#2d3142] shadow-sm" : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                Use a template
                            </button>
                        </div>
                    )}

                    {activeTab === 'template' && !isEditMode ? (
                        <section className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                            <label className="block text-xl font-bold text-[#2d3142]">Select a Template</label>
                            {isLoadingTemplates ? (
                                <div className="py-12 flex flex-col items-center justify-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                    <Loader2 className="w-8 h-8 text-[#d9a88a] animate-spin mb-2" />
                                    <p className="text-gray-400 font-bold text-sm">Loading templates...</p>
                                </div>
                            ) : templatesData?.data?.length > 0 ? (
                                <div className="grid grid-cols-1 gap-3">
                                    {templatesData.data.map((template) => (
                                        <button
                                            key={template._id}
                                            type="button"
                                            onClick={() => setSelectedTemplateId(template._id)}
                                            className={clsx(
                                                "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left",
                                                selectedTemplateId === template._id
                                                    ? "border-[#d9a88a] bg-[#fef7f2]"
                                                    : "border-gray-100 bg-white hover:border-gray-200"
                                            )}
                                        >
                                            <div className={clsx(
                                                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                                                selectedTemplateId === template._id ? "bg-[#d9a88a] text-white" : "bg-gray-100 text-gray-400"
                                            )}>
                                                <Briefcase className="w-6 h-6" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-[#2d3142] truncate">{template.templateName}</p>
                                                <p className="text-xs text-gray-400 font-medium truncate">{template.type || 'Standard Project'}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 flex flex-col items-center justify-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                    <Briefcase className="w-10 h-10 text-gray-200 mb-4" />
                                    <p className="text-gray-400 font-bold">No templates found</p>
                                    <button 
                                        type="button"
                                        onClick={() => setActiveTab('scratch')}
                                        className="mt-4 text-[#d9a88a] font-bold text-sm hover:underline"
                                    >
                                        Create one from scratch instead
                                    </button>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xl font-bold text-[#2d3142] mb-3">Project name</label>
                                    <input
                                        name="name"
                                        placeholder="e.g. Minimalist Villa"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full px-6 py-4 rounded-2xl bg-[#f3f4f6] border-transparent focus:bg-white focus:border-[#d9a88a] focus:ring-0 transition-all text-gray-700 placeholder:text-gray-400"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xl font-bold text-[#2d3142] mb-3">Client name</label>
                                    <input
                                        name="clientName"
                                        placeholder="e.g. John Doe"
                                        value={formData.clientName}
                                        onChange={handleChange}
                                        className="w-full px-6 py-4 rounded-2xl bg-[#f3f4f6] border-transparent focus:bg-white focus:border-[#d9a88a] focus:ring-0 transition-all text-gray-700 placeholder:text-gray-400"
                                    />
                                </div>
                                <section>
                                    <label className="block text-xl font-bold text-[#2d3142] mb-3">Phase</label>
                                    <SelectionGrid
                                        fieldName="phase"
                                        options={projectOptions.phases}
                                        selectedValue={formData.phase}
                                        onSelect={handleSelect}
                                    />
                                </section>
                            </div>
                        </section>
                    ) : (
                        <>
                            {!isTemplate && (
                                <p className="text-sm text-gray-500 leading-relaxed font-medium">
                                    Providing complete project info improves search results and Brand Rep follow-up.
                                </p>
                            )}

                            <section>
                                <label className="block text-xl font-bold text-[#2d3142] mb-3">
                                    {isTemplate ? 'Template name' : 'Project name'}
                                </label>
                                <input
                                    name="name"
                                    placeholder={isTemplate ? "e.g. Modern Workspace" : "e.g. Minimalist Villa"}
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-6 py-4 rounded-2xl bg-[#f3f4f6] border-transparent focus:bg-white focus:border-[#d9a88a] focus:ring-0 transition-all text-gray-700 placeholder:text-gray-400"
                                    required
                                />
                            </section>

                            {!isTemplate && (
                                <>
                                    <section>
                                        <label className="block text-xl font-bold text-[#2d3142] mb-3">Client name</label>
                                        <input
                                            name="clientName"
                                            placeholder="e.g. John Doe"
                                            value={formData.clientName}
                                            onChange={handleChange}
                                            className="w-full px-6 py-4 rounded-2xl bg-[#f3f4f6] border-transparent focus:bg-white focus:border-[#d9a88a] focus:ring-0 transition-all text-gray-700 placeholder:text-gray-400"
                                        />
                                    </section>

                                    <section>
                                        <label className="block text-xl font-bold text-[#2d3142] mb-3">Project Location</label>
                                        <div className="space-y-4">
                                            <input
                                                name="location.address"
                                                placeholder="Area, Building, or Address"
                                                value={formData.location.address}
                                                onChange={handleChange}
                                                className="w-full px-6 py-4 rounded-2xl bg-[#f3f4f6] border-transparent focus:bg-white focus:border-[#d9a88a] focus:ring-0 transition-all text-gray-700 placeholder:text-gray-400"
                                            />
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        name="location.city"
                                                        placeholder="City"
                                                        value={formData.location.city}
                                                        onChange={handleChange}
                                                        className="w-full px-6 py-4 rounded-2xl bg-[#f3f4f6] border-transparent focus:bg-white focus:border-[#d9a88a] focus:ring-0 transition-all text-gray-700 placeholder:text-gray-400"
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value="India"
                                                        readOnly
                                                        className="w-full px-6 py-4 rounded-2xl bg-[#f3f4f6] border-transparent text-gray-700 cursor-not-allowed font-medium opacity-60"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </>
                            )}

                            <section>
                                <label className="block text-xl font-bold text-[#2d3142] mb-3">Type</label>
                                <SelectionGrid
                                    fieldName="type"
                                    options={projectOptions.types}
                                    selectedValue={formData.type}
                                    onSelect={handleSelect}
                                />
                            </section>

                            {!isTemplate && (
                                <section>
                                    <label className="block text-xl font-bold text-[#2d3142] mb-3">Phase</label>
                                    <SelectionGrid
                                        fieldName="phase"
                                        options={projectOptions.phases}
                                        selectedValue={formData.phase}
                                        onSelect={handleSelect}
                                    />
                                </section>
                            )}

                            <section>
                                <div className="flex items-baseline gap-2 mb-3">
                                    <label className="text-xl font-bold text-[#2d3142]">Size</label>
                                    <span className="text-sm text-gray-400 font-medium">(The size of the entire project)</span>
                                </div>
                                <SelectionGrid
                                    fieldName="size"
                                    options={projectOptions.sizes}
                                    selectedValue={formData.size}
                                    onSelect={handleSelect}
                                />
                            </section>

                            {!isTemplate && (
                                <section>
                                    <label className="block text-xl font-bold text-[#2d3142] mb-3">Budget Range</label>
                                    <SelectionGrid
                                        fieldName="budget"
                                        options={projectOptions.budgets}
                                        selectedValue={formData.budget}
                                        onSelect={handleSelect}
                                    />
                                </section>
                            )}

                            {!isTemplate && (
                                <section>
                                    <div className="flex items-baseline gap-2 mb-3">
                                        <label className="text-xl font-bold text-[#2d3142]">Estimated completion date</label>
                                        <span className="text-sm text-gray-400 font-medium">(Project end date)</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="relative">
                                            <select
                                                name="estimatedDuration.month"
                                                value={formData.estimatedDuration.month}
                                                onChange={handleChange}
                                                className="w-full px-6 py-4 rounded-2xl bg-[#f3f4f6] border-transparent focus:bg-white focus:border-[#d9a88a] focus:ring-0 transition-all text-gray-700 appearance-none cursor-pointer"
                                            >
                                                <option value="">Month</option>
                                                {projectOptions.months.map((m, index) => (
                                                    <option key={m} value={index + 1}>{m}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none w-5 h-5 text-gray-400" />
                                        </div>
                                        <div className="relative">
                                            <select
                                                name="estimatedDuration.year"
                                                value={formData.estimatedDuration.year}
                                                onChange={handleChange}
                                                className="w-full px-6 py-4 rounded-2xl bg-[#f3f4f6] border-transparent focus:bg-white focus:border-[#d9a88a] focus:ring-0 transition-all text-gray-700 appearance-none cursor-pointer"
                                            >
                                                <option value="">Year</option>
                                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none w-5 h-5 text-gray-400" />
                                        </div>
                                    </div>
                                </section>
                            )}

                            <section>
                                <div className="flex justify-between mb-3">
                                    <label className="text-xl font-bold text-[#2d3142]">Project Description</label>
                                    <span className="text-sm text-gray-400 font-medium">{formData.description.length}/500 characters</span>
                                </div>
                                <textarea
                                    name="description"
                                    placeholder="Enter description here..."
                                    value={formData.description}
                                    onChange={handleChange}
                                    maxLength={500}
                                    rows={4}
                                    className="w-full px-6 py-4 rounded-2xl bg-[#f3f4f6] border-transparent focus:bg-white focus:border-[#d9a88a] focus:ring-0 transition-all text-gray-700 placeholder:text-gray-400 resize-none"
                                />
                            </section>
                        </>
                    )}

                    <div className="h-4" />
                </form>

                <div className="p-8 pt-0 bg-white">
                    <Button
                        type="submit"
                        disabled={createProjectMutation.isPending || updateProjectMutation.isPending || useTemplateMutation.isPending}
                        onClick={handleSubmit}
                        className="w-full bg-[#d9a88a] hover:bg-white border hover:border-[#d9a88a] hover:text-[#d9a88a] text-white py-5 rounded-2xl text-lg font-bold transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isTemplate 
                            ? (updateTemplateMutation.isPending ? 'Updating Template...' : 'Update Template')
                            : (isEditMode
                                ? (updateProjectMutation.isPending ? 'Updating...' : 'Update Project')
                                : (activeTab === 'template' 
                                    ? (useTemplateMutation.isPending ? 'Creating from Template...' : 'Create Project from Template')
                                    : (createProjectMutation.isPending ? 'Creating...' : 'Create Project')))}
                    </Button>
                </div>
            </div>
        </div>
    );
}
