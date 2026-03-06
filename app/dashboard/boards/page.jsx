'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Layout, Filter, User, ArrowRight, FolderOpen, Loader2, Plus, ArrowLeft } from 'lucide-react';
import Container from '@/components/ui/Container';
import { useGetAllMoodboards, useDeleteMoodboard } from '@/hooks/useMoodboard';
import { useGetProjects } from '@/hooks/useProject';
import { getProductImageUrl } from '@/lib/productUtils';
import { useAuthStore } from '@/store/useAuthStore';
import useProjectStore from '@/store/useProjectStore';
import MoodboardCard from '@/components/dashboard/projects/MoodboardCard';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import clsx from 'clsx';

// Deletion logic and filter state handled in the component

export default function AllBoardsPage() {
    const { user } = useAuthStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProject, setSelectedProject] = useState('all');
    const [mounted, setMounted] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [moodboardToDelete, setMoodboardToDelete] = useState(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const { data: boardsData, isLoading: boardsLoading } = useGetAllMoodboards();
    const { data: projectsData } = useGetProjects({ enabled: mounted });
    const deleteMutation = useDeleteMoodboard();

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

    const allBoards = boardsData?.data || [];
    const allProjects = projectsData?.data || [];

    // Filter logic
    const filteredBoards = allBoards.filter(board => {
        const matchesSearch = board.moodboard_name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesProject = selectedProject === 'all' || board.projectId?._id === selectedProject;
        return matchesSearch && matchesProject;
    });

    if (!mounted) return null;

    return (
        <Container className="py-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-8 md:mb-10 text-center md:text-left">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-[#2d3142] tracking-tight">All Spaces</h1>
                    <p className="text-sm md:text-base text-gray-500 mt-1 font-medium">Manage and view your visual inspirations across all projects.</p>
                </div>

                <div className="flex items-center justify-center md:justify-start gap-3">
                    <Link
                        href="/dashboard/projects"
                        className="w-full sm:w-auto justify-center px-6 py-3 bg-[#fef7f2] text-[#d9a88a] rounded-2xl text-sm font-bold hover:bg-[#d9a88a] hover:text-white transition-all shadow-sm flex items-center gap-2"
                    >
                        <FolderOpen className="w-4 h-4" />
                        Projects
                    </Link>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center">
                {/* Search */}
                <div className="relative w-full md:flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search spaces..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-[#d9a88a]/20 transition-all outline-none"
                    />
                </div>

                {/* Project Filter */}
                <div className="relative w-full md:min-w-[240px] md:w-auto">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="w-full pl-11 pr-10 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#d9a88a]/20 transition-all outline-none appearance-none cursor-pointer"
                    >
                        <option value="all">All Projects</option>
                        {allProjects.map(project => (
                            <option key={project._id} value={project._id}>
                                {project.projectName}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            {boardsLoading ? (
                <div className="flex flex-col items-center justify-center py-32">
                    <Loader2 className="w-12 h-12 text-[#d9a88a] animate-spin mb-4" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Fetching your spaces...</p>
                </div>
            ) : filteredBoards.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                    {filteredBoards.map((board) => (
                        <MoodboardCard
                            key={board._id}
                            moodboard={board}
                            projectId={board.projectId?._id}
                            onDelete={handleDeleteClick}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 md:py-24 px-4 bg-white rounded-4xl border border-dashed border-gray-200">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-[#fef7f2] rounded-3xl flex items-center justify-center mb-6">
                        <Layout className="w-8 h-8 md:w-10 md:h-10 text-[#d9a88a]" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-[#2d3142] mb-2 text-center">No spaces found</h3>
                    <p className="text-sm md:text-base text-gray-400 font-medium max-w-xs text-center">
                        {searchQuery || selectedProject !== 'all'
                            ? "Try adjusting your filters or search query to find what you're looking for."
                            : "Start by creating your first space within a project."}
                    </p>
                    {(searchQuery || selectedProject !== 'all') && (
                        <button
                            onClick={() => { setSearchQuery(''); setSelectedProject('all'); }}
                            className="mt-6 text-xs md:text-sm font-bold text-[#d9a88a] hover:underline uppercase tracking-widest"
                        >
                            Clear All Filters
                        </button>
                    )}
                </div>
            )}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Space"
                message="Are you sure you want to delete this space and its associated costs? This action cannot be undone."
                confirmText="Delete"
                type="danger"
            />
        </Container>
    );
}
