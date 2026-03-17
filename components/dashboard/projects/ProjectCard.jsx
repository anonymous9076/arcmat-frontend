'use client';
import { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, Edit2, Trash2, Check, Camera, MessageCircle, AlertCircle, MoreHorizontal, Image as ImageIcon, Download, PlusSquare, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import useProjectStore from '@/store/useProjectStore';
import useAuthStore from '@/store/useAuthStore';
import { useUpdateProject } from '@/hooks/useProject';
import { toast } from '@/components/ui/Toast';
import CoverSelectionModal from './CoverSelectionModal';
import RetailerRatingModal from './RetailerRatingModal';
import { exportProjectToExcel } from '@/lib/exportUtils';
import { getImageUrl } from '@/lib/productUtils';
import { moodboardService } from '@/services/moodboardService';
import { useCreateTemplateFromProject } from '@/hooks/useTemplate';


export default function ProjectCard({ project, onEdit, onDelete, href, onOpenDiscussion }) {
    const { user } = useAuthStore();
    const router = useRouter();
    const isArchitect = user?.role === 'architect';

    const {
        _id,
        projectName,
        clientName,
        phase = 'Concept Design',
        status = 'Active',
        unreadMessages = 0,
        pendingApprovals = 0
    } = project;

    const [currentStatus, setCurrentStatus] = useState(status);
    const [currentPhase, setCurrentPhase] = useState(phase);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [isPhaseDropdownOpen, setIsPhaseDropdownOpen] = useState(false);
    const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
    const dropdownRef = useRef(null);
    const phaseDropdownRef = useRef(null);
    const optionsMenuRef = useRef(null);
    const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const updateProjectMutation = useUpdateProject();
    const createTemplateMutation = useCreateTemplateFromProject();

    useEffect(() => {
        setCurrentStatus(status);
    }, [status]);

    useEffect(() => {
        setCurrentPhase(phase);
    }, [phase]);

    const STATUS_OPTIONS = ['Active', 'On hold', 'Completed', 'Canceled', 'Archived'];
    const PHASE_OPTIONS = [
        'Concept Design',
        'Design Development',
        'Material Specification',
        'Construction',
        'Completed'
    ];

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsStatusDropdownOpen(false);
            }
            if (phaseDropdownRef.current && !phaseDropdownRef.current.contains(event.target)) {
                setIsPhaseDropdownOpen(false);
            }
            if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target)) {
                setIsOptionsMenuOpen(false);
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
                    if (newPhase === 'Project Completed') {
                        setIsRatingModalOpen(true);
                    }
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
                    if (newStatus === 'Completed') {
                        setIsRatingModalOpen(true);
                    }
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

    const handleCardClick = () => {
        setIsRedirecting(true);
        useProjectStore.getState().setActiveProject(_id, projectName);
        router.push(href || `/dashboard/projects/${_id}/moodboards`);
    };

    const handleDownloadProject = async (e) => {
            e.preventDefault();
            e.stopPropagation();

            try {
                setIsExporting(true);
                toast.loading('Fetching all project data...', { id: 'project-export-fetch' });

                // 1. Fetch moodboard list
                const listResponse = await moodboardService.getMoodboardList(_id);
                const spaces = listResponse?.data || [];

                if (spaces.length === 0) {
                    toast.dismiss('project-export-fetch');
                    toast.error('No spaces found in this project to export');
                    return;
                }

                // 2. Fetch full details for each moodboard (products, costs, images)
                const fullSpaces = await Promise.all(spaces.map(async (space) => {
                    const detailResponse = await moodboardService.getMoodboardById(space._id);
                    return detailResponse?.data;
                }));

                toast.dismiss('project-export-fetch');

                // 3. Trigger project-wide Excel export
                await exportProjectToExcel(project, fullSpaces.filter(s => s !== null));

            } catch (error) {
                console.error('Failed to download project:', error);
                toast.dismiss('project-export-fetch');
                toast.error('Failed to fetch project details for export');
            } finally {
                setIsExporting(false);
            }
        };

        const handleCreateTemplate = (e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOptionsMenuOpen(false);
            createTemplateMutation.mutate(_id);
        };

    return (
        <div
            onClick={handleCardClick}
            className="bg-white rounded-[24px] border border-gray-100 p-4 flex flex-col md:flex-row gap-4 hover:shadow-lg hover:border-gray-200 transition-all group relative h-full w-full mx-auto md:mx-0 cursor-pointer"
        >
            {/* Loader Overlay */}
            {isRedirecting && (
                <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-200 rounded-[24px]">
                    <Loader2 className="w-8 h-8 text-[#d9a88a] animate-spin" />
                </div>
            )}
            {/* Absolute Action Buttons (Hover) */}
            {isArchitect && (
                <div className="absolute top-4 right-4 z-30" ref={optionsMenuRef}>
                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOptionsMenuOpen(!isOptionsMenuOpen); }}
                        className="p-2 bg-white/90 shadow-md border border-gray-100 rounded-xl text-gray-500 hover:text-[#1a1a2e] hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100"
                        title="More options"
                    >
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                    {isOptionsMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.11)] border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOptionsMenuOpen(false); onEdit(project); }}
                                className="w-full text-left px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-[#d9a88a] flex items-center gap-2 transition-colors cursor-pointer"
                            >
                                <Edit2 className="w-4 h-4" /> Edit Details
                            </button>
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOptionsMenuOpen(false); setIsCoverModalOpen(true); }}
                                className="w-full text-left px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-[#d9a88a] flex items-center gap-2 transition-colors cursor-pointer"
                            >
                                <ImageIcon className="w-4 h-4" /> Change Cover
                            </button>
                            <button
                                onClick={handleDownloadProject}
                                disabled={isExporting}
                                className={`w-full text-left px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-[#d9a88a] flex items-center gap-2 transition-colors cursor-pointer ${isExporting ? 'opacity-50 animate-pulse' : ''}`}
                            >
                                <Download className="w-4 h-4" /> Download Project
                            </button>
                            <button
                                onClick={handleCreateTemplate}
                                className="w-full text-left px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-[#d9a88a] flex items-center gap-2 transition-colors cursor-pointer"
                            >
                                <PlusSquare className="w-4 h-4" /> Create Template
                            </button>
                            <div className="border-t border-gray-100 my-1" />
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOptionsMenuOpen(false); onDelete(project._id); }}
                                className="w-full text-left px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
                            >
                                <Trash2 className="w-4 h-4" /> Delete Project
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Left Section */}
            <div className="flex-[1.2] flex flex-col min-w-0 p-2">
                <div className="flex flex-col gap-0.5 mb-6">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Link
                            href={href || `/dashboard/projects/${project._id}/moodboards`}
                            onClick={(e) => {
                                e.stopPropagation();
                                useProjectStore.getState().setActiveProject(project._id, project.projectName);
                            }}
                            className="flex items-center gap-2 group/title w-max"
                        >
                            <h3 className="text-[20px] font-extrabold text-[#2d3142] group-hover/title:text-gray-600 transition-colors truncate max-w-[200px]">
                                {projectName}
                            </h3>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover/title:translate-x-1 transition-transform" />
                        </Link>

                        {/* Notification Badges & Discussion Shortcut */}
                        <div className="flex items-center gap-1.5 ml-1">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onOpenDiscussion?.(project);
                                }}
                                className={`flex items-center justify-center rounded-full px-2 py-1.5 border shadow-sm transition-all hover:scale-105 active:scale-95 ${unreadMessages > 0
                                    ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
                                    : 'bg-white text-gray-400 border-gray-100 hover:text-[#d9a88a] hover:border-[#d9a88a]/30'
                                    }`}
                                title={unreadMessages > 0 ? `${unreadMessages} unread message${unreadMessages > 1 ? 's' : ''}` : 'Open Project Discussion'}
                            >
                                <MessageCircle className="w-3.5 h-3.5 mr-1" />
                                <span className="text-[11px] font-bold leading-none">
                                    {unreadMessages > 0 ? unreadMessages : 'Discuss'}
                                </span>
                            </button>

                            {pendingApprovals > 0 && (
                                <div
                                    className="flex items-center justify-center bg-amber-50 text-amber-600 rounded-full px-2 py-0.5 border border-amber-100 shadow-sm"
                                    title={`${pendingApprovals} pending approval${pendingApprovals > 1 ? 's' : ''}`}
                                >
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    <span className="text-[10px] font-bold leading-none">{pendingApprovals}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    {clientName && (
                        <span className="text-sm text-gray-400 font-medium truncate max-w-[200px]">
                            Client: {clientName}
                        </span>
                    )}
                </div>

                <div className="mb-auto relative" ref={phaseDropdownRef}>
                    <span className="text-[10px] text-gray-400 font-bold mb-2 block tracking-wide">Project Phase</span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            isArchitect && setIsPhaseDropdownOpen(!isPhaseDropdownOpen);
                        }}
                        className={`flex items-center justify-between min-w-[140px] px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-extrabold text-[#2d3142] ${isArchitect ? 'hover:bg-gray-50 transition-colors cursor-pointer' : 'cursor-default'}`}
                        disabled={!isArchitect}
                    >
                        <span className="truncate max-w-[120px]">{currentPhase}</span>
                        {isArchitect && <ChevronDown className={`w-4 h-4 text-gray-400 ml-2 transition-transform ${isPhaseDropdownOpen ? 'rotate-180' : ''}`} />}
                    </button>

                    {isPhaseDropdownOpen && isArchitect && (
                        <div className="absolute top-full left-0 mt-1 w-56 bg-white shadow-xl rounded-xl border border-gray-100 py-2 z-50">
                            {PHASE_OPTIONS.map((option) => (
                                <button
                                    key={option}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePhaseChange(option);
                                    }}
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
                        onClick={(e) => {
                            e.stopPropagation();
                            isArchitect && setIsStatusDropdownOpen(!isStatusDropdownOpen);
                        }}
                        className={`inline-flex items-center gap-2 px-4 py-1.5 bg-[#f4f5f7] rounded-full text-[13px] font-bold text-gray-600 ${isArchitect ? 'hover:bg-gray-200 transition-colors cursor-pointer' : 'cursor-default'}`}
                        disabled={!isArchitect}
                    >
                        {currentStatus}
                        {isArchitect && <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />}
                    </button>

                    {isStatusDropdownOpen && isArchitect && (
                        <div className="absolute top-full left-0 mt-1 w-40 bg-white shadow-xl rounded-xl border border-gray-100 py-2 z-50">
                            {STATUS_OPTIONS.map((option) => (
                                <button
                                    key={option}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusChange(option);
                                    }}
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
                {getImageUrl(project.coverImage) && (
                    <div className="absolute inset-0 z-0">
                        <Image src={getImageUrl(project.coverImage)} alt="" fill className="object-cover opacity-80" />
                        <div className="absolute inset-0 bg-linear-to-r from-black/40 to-black/10 transition-colors" />
                    </div>
                )}

                <div className="flex flex-col h-full justify-between gap-4 z-10 w-full min-w-0 pr-2 p-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-[#2d3142] text-[15px] truncate">Spec'd Brands</h4>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsCoverModalOpen(true);
                            }}
                            className="p-1.5 bg-white shadow-sm rounded-lg text-gray-400 hover:text-[#d9a88a] transition-colors"
                            title="Change Project Cover"
                        >
                            <Camera className="w-3.5 h-3.5" />
                        </button>
                        <h4 className="font-extrabold text-white drop-shadow-md text-[15px] truncate max-w-[120px]">Spec's Overview</h4>
                    </div>

                    <div className="mt-auto">
                        {isArchitect && (
                            <Link
                                href="/productlist"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    useProjectStore.getState().setActiveProject(project._id, project.projectName);
                                }}
                                className="inline-flex items-center justify-center px-4 py-2 bg-[#D9A88A] text-white text-[12px] font-bold rounded-full hover:bg-[#D9A88A] shadow-sm transition-colors whitespace-nowrap"
                            >
                                See all products
                            </Link>
                        )}
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

            <RetailerRatingModal
                isOpen={isRatingModalOpen}
                onClose={() => setIsRatingModalOpen(false)}
                project={project}
                retailerId={project.retailers?.[0]?._id || project.retailers?.[0]}
            />
        </div>
    );
}
