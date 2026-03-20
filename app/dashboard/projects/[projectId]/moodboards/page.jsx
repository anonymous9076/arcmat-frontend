'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDeleteMoodboard } from '@/hooks/useMoodboard';
import { useGetProject, useCompleteProject, useMarkNotificationsRead } from '@/hooks/useProject';
import { useAuth } from '@/hooks/useAuth';
import MoodboardCard from '@/components/dashboard/projects/MoodboardCard';
import CreateMoodboardModal from '@/components/dashboard/projects/CreateMoodboardModal';
import InviteClientModal from '@/components/dashboard/projects/InviteClientModal';
import PrivacySettingsModal from '@/components/dashboard/projects/PrivacySettingsModal';
import { Loader2, Plus, ArrowLeft, Layout, Search, ChevronDown, Filter, Shield } from 'lucide-react';
import Button from '@/components/ui/Button';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Container from '@/components/ui/Container';
import { CheckCircle } from 'lucide-react';

export default function MoodboardsPage() {
    const { projectId } = useParams();
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [moodboardToDelete, setMoodboardToDelete] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

    const { user } = useAuth();
    const isArchitect = user?.role === 'architect';
    const isContractor = user?.professionalType === 'Contractor / Builder';

    useEffect(() => {
        if (isContractor) {
            toast.error("Contractors do not have access to Spaces.");
            router.push('/dashboard/projects');
        }
    }, [isContractor, router]);

    const { data: projectData, isLoading: projectLoading } = useGetProject(projectId, { includeSpaces: true });
    const deleteMutation = useDeleteMoodboard();
    const completeMutation = useCompleteProject();
    const { mutate: markNotificationsRead } = useMarkNotificationsRead();

    const project = projectData?.data;
    const moodboards = project?.moodboards || [];

    // Mark all project-level notifications as read when entering the project spaces page
    useEffect(() => {
        if (projectId && user) {
            markNotificationsRead({ id: projectId });
        }
    }, [projectId, user, markNotificationsRead]);

    const handleDeleteClick = (id) => {
        setMoodboardToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (moodboardToDelete) {
            deleteMutation.mutate(moodboardToDelete);
            setIsDeleteModalOpen(false);
        }
    };

    const handleConfirmComplete = async () => {
        completeMutation.mutate(projectId, {
            onSuccess: () => {
                setIsCompleteModalOpen(false);
            }
        });
    };

    const filteredMoodboards = moodboards
        .filter(mb => {
            if (!isArchitect && project?.privacyControls) {
                const { showMoodboards, showMaterials, showRenders } = project.privacyControls;
                if (showMoodboards === false && showMaterials === false && showRenders === false) {
                    return false;
                }
            }
            return mb.moodboard_name?.toLowerCase().includes(searchQuery.toLowerCase());
        })
        .sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
            if (sortBy === 'name') return a.moodboard_name.localeCompare(b.moodboard_name);
            return 0;
        });

    if (projectLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-[#d9a88a] animate-spin mb-4" />
                <p className="text-gray-400 font-bold">Loading spaces...</p>
            </div>
        );
    }

    return (
        <Container className="py-8">
            <div className="flex items-center justify-between mb-10">
                <button
                    onClick={() => router.push('/dashboard/projects')}
                    className="flex items-center gap-2 text-gray-400 hover:text-[#d9a88a] font-bold transition-colors group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    Back to Projects
                </button>

                {isArchitect && (
                    <div className="flex items-center gap-4">
                        {/* {project?.status !== 'Completed' && (
                            <Button
                                onClick={() => setIsCompleteModalOpen(true)}
                                disabled={completeMutation.isPending}
                                className="bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-600 hover:text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-sm text-sm disabled:opacity-50"
                            >
                                {completeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                Complete Project
                            </Button>
                        )} */}
                        <Button
                            onClick={() => setIsPrivacyModalOpen(true)}
                            className="bg-white border text-gray-700 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 text-sm"
                        >
                            <Shield className="w-4 h-4 text-[#d9a88a]" />
                            Client Settings
                        </Button>
                        <Button
                            onClick={() => setIsInviteModalOpen(true)}
                            className="bg-[#2d3142] hover:bg-white hover:text-[#2d3142] border border-[#2d3142] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 text-sm"
                        >
                            Invite Client
                        </Button>
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-[#d9a88a] hover:bg-white hover:text-[#d9a88a] border border-[#d9a88a] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2  shadow-lg shadow-orange-100 text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            New Space
                        </Button>
                    </div>
                )}
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-[#fef7f2] flex items-center justify-center">
                            <Layout className="w-5 h-5 text-[#d9a88a]" />
                        </div>
                        <h1 className="text-3xl font-black text-[#2d3142] tracking-tight">
                            {project?.projectName} <span className="text-[#d9a88a]">Spaces</span>
                        </h1>
                    </div>
                    <p className="text-gray-500 font-medium ml-1">
                        Conceptual designs and project estimations.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search spaces..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 w-48 focus:ring-2 focus:ring-[#d9a88a]/20 transition-all outline-none"
                        />
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                            className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-2xl text-sm font-bold text-gray-500 hover:text-[#d9a88a] transition-all"
                        >
                            <Filter className="w-4 h-4" />
                            {sortBy === 'newest' ? 'Newest' : 'Name'}
                            <ChevronDown className={`w-4 h-4 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isSortDropdownOpen && (
                            <div className="absolute top-full right-0 mt-2 w-40 bg-white shadow-2xl rounded-2xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                                <button
                                    onClick={() => { setSortBy('newest'); setIsSortDropdownOpen(false); }}
                                    className={`w-full text-left px-4 py-2 text-sm font-bold transition-colors ${sortBy === 'newest' ? 'text-[#d9a88a] bg-[#fef7f2]' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    Newest
                                </button>
                                <button
                                    onClick={() => { setSortBy('name'); setIsSortDropdownOpen(false); }}
                                    className={`w-full text-left px-4 py-2 text-sm font-bold transition-colors ${sortBy === 'name' ? 'text-[#d9a88a] bg-[#fef7f2]' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    Name
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {filteredMoodboards.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredMoodboards.map(mb => (
                        <MoodboardCard
                            key={mb._id}
                            moodboard={mb}
                            projectId={projectId}
                            onDelete={handleDeleteClick}
                            isArchitect={isArchitect}
                            projectPrivacy={project?.privacyControls}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[40px] border border-dashed border-gray-200 text-center">
                    <div className="w-24 h-24 bg-[#fef7f2] rounded-3xl flex items-center justify-center mb-8">
                        <Layout className="w-12 h-12 text-[#d9a88a]" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#2d3142] mb-3">
                        {searchQuery ? 'No matching spaces' : 'No spaces yet'}
                    </h3>
                    <p className="text-gray-400 font-medium max-w-sm mx-auto mb-10">
                        {searchQuery ? `We couldn't find any spaces matching "${searchQuery}"` : 'Start by creating your first space to organize your design ideas and costs.'}
                    </p>
                    {!searchQuery && isArchitect && (
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-[#d9a88a] text-white px-10 py-4 rounded-2xl font-black"
                        >
                            Create Your First Space
                        </Button>
                    )}
                </div>
            )}

            <CreateMoodboardModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                projectId={projectId}
            />

            <InviteClientModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                projectId={projectId}
                projectName={project?.projectName}
            />

            <PrivacySettingsModal
                isOpen={isPrivacyModalOpen}
                onClose={() => setIsPrivacyModalOpen(false)}
                project={project}
            />

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Space"
                message="Are you sure you want to delete this space and its associated costs? This action cannot be undone."
                confirmText="Delete"
                type="danger"
            />

            <ConfirmationModal
                isOpen={isCompleteModalOpen}
                onClose={() => setIsCompleteModalOpen(false)}
                onConfirm={handleConfirmComplete}
                title="Complete Project"
                message="Are you sure you want to finalize this project? All current materials across all spaces will be marked as 'Specified' and the project phase will be updated to Completed."
                confirmText={completeMutation.isPending ? "Completing..." : "Complete Project"}
                type="primary"
            // Using primary instead of danger, since danger is red, success/primary is better.
            />
        </Container>
    );
}
