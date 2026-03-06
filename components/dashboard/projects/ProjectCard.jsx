'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, Edit2, Trash2, Check, Camera } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import useProjectStore from '@/store/useProjectStore';
import { useUpdateProject } from '@/hooks/useProject';
import { toast } from '@/components/ui/Toast';
import CoverSelectionModal from './CoverSelectionModal';

export default function ProjectCard({ project, onEdit, onDelete, href }) {
    const {
        _id,
        projectName,
        phase = 'Concept Design',
        status = 'Active'
    } = project;

    const [currentStatus, setCurrentStatus] = useState(status);
    const [currentPhase, setCurrentPhase] = useState(phase);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [isPhaseDropdownOpen, setIsPhaseDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const phaseDropdownRef = useRef(null);
    const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
    const updateProjectMutation = useUpdateProject();

    useEffect(() => {
        setCurrentStatus(status);
    }, [status]);

    useEffect(() => {
        setCurrentPhase(phase);
    }, [phase]);

    const STATUS_OPTIONS = ['Active', 'On hold', 'Completed', 'Canceled', 'Archived'];
    const PHASE_OPTIONS = [
        'Concept Design',
        'Schematic Design',
        'Design Development',
        'Specification',
        'Construction Admin',
        'Reselection Substitution'
    ];

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsStatusDropdownOpen(false);
            }
            if (phaseDropdownRef.current && !phaseDropdownRef.current.contains(event.target)) {
                setIsPhaseDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePhaseChange = (newPhase) => {
        if (newPhase === currentPhase) {
            setIsPhaseDropdownOpen(false);
            return;
        }

        const previousPhase = currentPhase;
        setCurrentPhase(newPhase);

        updateProjectMutation.mutate(
            { id: _id, data: { phase: newPhase } },
            {
                onSuccess: () => {
                    toast.success('Project phase updated');
                    setIsPhaseDropdownOpen(false);
                },
                onError: () => {
                    setCurrentPhase(previousPhase);
                    toast.error('Failed to update phase');
                    setIsPhaseDropdownOpen(false);
                }
            }
        );
    };

    const handleStatusChange = (newStatus) => {
        if (newStatus === currentStatus) {
            setIsStatusDropdownOpen(false);
            return;
        }

        const previousStatus = currentStatus;
        setCurrentStatus(newStatus); // Optimistic UI Update

        updateProjectMutation.mutate(
            { id: _id, data: { status: newStatus } },
            {
                onSuccess: () => {
                    toast.success('Project status updated');
                    setIsStatusDropdownOpen(false);
                },
                onError: () => {
                    setCurrentStatus(previousStatus); // Revert on failure
                    toast.error('Failed to update status');
                    setIsStatusDropdownOpen(false);
                }
            }
        );
    };

    const handleCoverSelect = (selection) => {
        const formData = new FormData();
        if (selection.type === 'file') {
            formData.append('coverImage', selection.file);
        } else {
            formData.append('coverImage', selection.url);
        }

        updateProjectMutation.mutate(
            { id: _id, data: formData },
            {
                onSuccess: () => {
                    toast.success('Project cover updated');
                    setIsCoverModalOpen(false);
                }
            }
        );
    };

    return (
        <div className="bg-white rounded-[24px] border border-gray-100 p-4 flex flex-col md:flex-row gap-4 hover:shadow-lg hover:border-gray-200 transition-all group relative h-full w-full mx-auto md:mx-0">
            {/* Absolute Action Buttons (Hover) */}
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(project); }}
                    className="p-2 bg-white shadow-md border border-gray-50 rounded-xl text-[#d9a88a] hover:bg-[#d9a88a] hover:text-white transition-all transform hover:scale-110"
                    title="Edit project"
                >
                    <Edit2 className="w-4 h-4" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(project._id); }}
                    className="p-2 bg-white shadow-md border border-gray-50 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all transform hover:scale-110"
                    title="Delete project"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Left Section */}
            <div className="flex-[1.2] flex flex-col min-w-0 p-2">
                <Link
                    href={href || `/dashboard/projects/${project._id}/moodboards`}
                    onClick={() => useProjectStore.getState().setActiveProject(project._id, project.projectName)}
                    className="flex items-center gap-2 group/title mb-6 w-max"
                >
                    <h3 className="text-[20px] font-extrabold text-[#2d3142] group-hover/title:text-gray-600 transition-colors truncate max-w-[200px]">
                        {projectName}
                    </h3>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover/title:translate-x-1 transition-transform" />
                </Link>

                <div className="mb-auto relative" ref={phaseDropdownRef}>
                    <span className="text-[10px] text-gray-400 font-bold mb-2 block tracking-wide">Project Phase</span>
                    <button
                        onClick={() => setIsPhaseDropdownOpen(!isPhaseDropdownOpen)}
                        className="flex items-center justify-between min-w-[140px] px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-extrabold text-[#2d3142] hover:bg-gray-50 transition-colors"
                    >
                        <span className="truncate max-w-[120px]">{currentPhase}</span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 ml-2 transition-transform ${isPhaseDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isPhaseDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-56 bg-white shadow-xl rounded-xl border border-gray-100 py-2 z-50">
                            {PHASE_OPTIONS.map((option) => (
                                <button
                                    key={option}
                                    onClick={() => handlePhaseChange(option)}
                                    className={`w-full text-left px-4 py-2 text-sm font-medium flex items-center justify-between hover:bg-gray-50 transition-colors ${currentPhase === option ? 'text-[#D9A88A] bg-gray-50' : 'text-gray-500'}`}
                                >
                                    {option}
                                    {currentPhase === option && <Check className="w-4 h-4 text-gray-400" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-8 relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#f4f5f7] rounded-full text-[13px] font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                        {currentStatus}
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isStatusDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-40 bg-white shadow-xl rounded-xl border border-gray-100 py-2 z-50">
                            {STATUS_OPTIONS.map((option) => (
                                <button
                                    key={option}
                                    onClick={() => handleStatusChange(option)}
                                    className={`w-full text-left px-4 py-2 text-sm font-medium flex items-center justify-between hover:bg-gray-50 transition-colors ${currentStatus === option ? 'text-[#D9A88A] bg-gray-50' : 'text-gray-500'
                                        }`}
                                >
                                    {option}
                                    {currentStatus === option && <Check className="w-4 h-4 text-gray-400" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Section */}
            <div className="flex-[1.4] bg-[#fafafb] rounded-[16px] flex items-center justify-between border border-gray-50 group-hover:border-gray-100 transition-colors relative min-w-0 overflow-hidden">
                {project.coverImage && (
                    <div className="absolute inset-0 z-0">
                        <Image src={project.coverImage} alt="" fill className="object-cover opacity-20" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#fafafb] via-[#fafafb]/80 to-transparent" />
                    </div>
                )}

                <div className="flex flex-col h-full justify-between gap-4 z-10 w-full min-w-0 pr-2 p-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-[#2d3142] text-[15px] truncate">Spec'd Brands</h4>
                        <button
                            onClick={() => setIsCoverModalOpen(true)}
                            className="p-1.5 bg-white shadow-sm rounded-lg text-gray-400 hover:text-[#d9a88a] transition-colors"
                            title="Change Project Cover"
                        >
                            {/* <Camera className="w-3.5 h-3.5" /> */}
                        </button>
                    </div>

                    <div className="mt-auto">
                        <Link
                            href="/productlist"
                            onClick={() => useProjectStore.getState().setActiveProject(project._id, project.projectName)}
                            className="inline-flex items-center justify-center px-4 py-2 bg-[#D9A88A] text-white text-[12px] font-bold rounded-full hover:bg-[#D9A88A] shadow-sm transition-colors whitespace-nowrap"
                        >
                            See all products
                        </Link>
                    </div>
                </div>

                {/* Circular indicator moved more to the right and absolutely positioned to slightly overlap? No, let's keep it in flex layout */}
                <div className="w-[70px] h-[70px] rounded-full border-[5px] border-[#f4f5f7] flex items-center justify-center shrink-0 bg-white z-20">
                    <span className="text-[9px] font-bold text-gray-400 text-center leading-tight px-1">
                        No orders yet
                    </span>
                </div>
            </div>

            <CoverSelectionModal
                isOpen={isCoverModalOpen}
                onClose={() => setIsCoverModalOpen(false)}
                onSelect={handleCoverSelect}
                isUploading={updateProjectMutation.isPending}
            />
        </div>
    );
}
