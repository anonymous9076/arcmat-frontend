'use client';

import { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import projectOptions from './project-options.json';
import Button from '@/components/ui/Button';
import { useCreateProject, useUpdateProject } from '@/hooks/useProject';

export default function CreateProjectModal({ isOpen, onClose, project = null }) {
    const isEditMode = !!project;

    const [formData, setFormData] = useState({
        name: '',
        location: {
            city: '',
            country: 'India'
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

    useEffect(() => {
        if (project) {
            setFormData({
                name: project.projectName || '',
                location: project.location || { city: '', country: 'India' },
                type: project.type || '',
                phase: project.phase || '',
                size: project.size || '',
                budget: project.budget || '',
                estimatedDuration: project.estimatedDuration || { month: '', year: '' },
                description: project.description || ''
            });
        } else {
            setFormData({
                name: '',
                location: { city: '', country: 'India' },
                type: '',
                phase: '',
                size: '',
                budget: '',
                estimatedDuration: { month: '', year: '' },
                description: ''
            });
        }
    }, [project, isOpen]);

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

        if (!formData.phase) {
            toast.error('Please select a project phase');
            return;
        }

        const payload = {
            projectName: formData.name,
            location: formData.location,
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
        } else {
            createProjectMutation.mutate(payload, {
                onSuccess: () => {
                    onClose();
                    setFormData({
                        name: '',
                        location: { city: '', country: 'India' },
                        type: '',
                        phase: '',
                        size: '',
                        budget: '',
                        estimatedDuration: { month: '', year: '' },
                        description: ''
                    });
                }
            });
        }
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
                        {isEditMode ? 'Edit Project' : 'New Project'}
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
                    <p className="text-sm text-gray-500 leading-relaxed font-medium">
                        Providing complete project info improves search results and Brand Rep follow-up.
                    </p>

                    <section>
                        <label className="block text-xl font-bold text-[#2d3142] mb-3">Project name</label>
                        <input
                            name="name"
                            placeholder="Project name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-6 py-4 rounded-2xl bg-[#f3f4f6] border-transparent focus:bg-white focus:border-[#d9a88a] focus:ring-0 transition-all text-gray-700 placeholder:text-gray-400"
                            required
                        />
                    </section>

                    <section>
                        <label className="block text-xl font-bold text-[#2d3142] mb-3">Location</label>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">City</label>
                                <div className="relative">
                                    <select
                                        name="location.city"
                                        value={formData.location.city}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData(prev => ({
                                                ...prev,
                                                location: { ...prev.location, city: value }
                                            }));
                                        }}
                                        className="w-full px-6 py-4 rounded-2xl bg-[#f3f4f6] border-transparent focus:bg-white focus:border-[#d9a88a] focus:ring-0 transition-all text-gray-700 appearance-none cursor-pointer"
                                    >
                                        <option value="">Select City</option>
                                        {projectOptions.cities.map(city => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none w-5 h-5 text-gray-400" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">Country</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value="India"
                                        readOnly
                                        className="w-full px-6 py-4 rounded-2xl bg-[#f3f4f6] border-transparent text-gray-700 cursor-not-allowed font-medium"
                                    />
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                        <span className="text-xs font-bold text-[#d9a88a] uppercase tracking-wider">Fixed</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <label className="block text-xl font-bold text-[#2d3142] mb-3">Type</label>
                        <SelectionGrid
                            fieldName="type"
                            options={projectOptions.types}
                            selectedValue={formData.type}
                            onSelect={handleSelect}
                        />
                    </section>

                    <section>
                        <label className="block text-xl font-bold text-[#2d3142] mb-3">Phase</label>
                        <SelectionGrid
                            fieldName="phase"
                            options={projectOptions.phases}
                            selectedValue={formData.phase}
                            onSelect={handleSelect}
                        />
                    </section>

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

                    <section>
                        <div className="flex items-baseline gap-2 mb-3">
                            <label className="text-xl font-bold text-[#2d3142]">Budget</label>
                            <span className="text-sm text-gray-400 font-medium">(Budget for the entire project)</span>
                        </div>
                        <div className="relative">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 text-xl font-medium">₹</span>
                            <input
                                name="budget"
                                type="text"
                                placeholder="Enter budget"
                                value={formData.budget}
                                onChange={handleChange}
                                className="w-full pl-12 pr-6 py-4 rounded-2xl bg-[#f3f4f6] border-transparent focus:bg-white focus:border-[#d9a88a] focus:ring-0 transition-all text-gray-700 placeholder:text-gray-400"
                            />
                        </div>
                    </section>

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

                    <div className="h-4" />
                </form>

                <div className="p-8 pt-0 bg-white">
                    <Button
                        type="submit"
                        disabled={createProjectMutation.isPending || updateProjectMutation.isPending}
                        onClick={handleSubmit}
                        className="w-full bg-[#d9a88a] hover:bg-white border hover:border-[#d9a88a] hover:text-[#d9a88a] text-white py-5 rounded-2xl text-lg font-bold transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isEditMode
                            ? (updateProjectMutation.isPending ? 'Updating...' : 'Update Project')
                            : (createProjectMutation.isPending ? 'Creating...' : 'Create Project')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
