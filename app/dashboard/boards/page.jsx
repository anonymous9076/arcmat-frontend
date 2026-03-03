'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Layout, Filter, User, ArrowRight, FolderOpen, Loader2 } from 'lucide-react';
import Container from '@/components/ui/Container';
import { useGetAllMoodboards } from '@/hooks/useMoodboard';
import { useGetProjects } from '@/hooks/useProject';
import { getProductImageUrl } from '@/lib/productUtils';
import { useAuthStore } from '@/store/useAuthStore';
import useProjectStore from '@/store/useProjectStore';
import clsx from 'clsx';

// Thumbnail helper for moodboards
const getBoardThumbnail = (board) => {
    if (!board?.canvasState?.length) return null;
    const firstMaterial = board.canvasState.find(item => item.type === 'material');
    if (!firstMaterial?.material) return null;

    const m = firstMaterial.material;
    if (m.images?.length) return getProductImageUrl(m.images[0]);
    if (m.variant_images?.length) return getProductImageUrl(m.variant_images[0]);
    if (typeof m.productId === 'object' && m.productId?.product_images?.length)
        return getProductImageUrl(m.productId.product_images[0]);

    return null;
};

export default function AllBoardsPage() {
    const { user } = useAuthStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProject, setSelectedProject] = useState('all');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const { data: boardsData, isLoading: boardsLoading } = useGetAllMoodboards();
    const { data: projectsData } = useGetProjects({ enabled: mounted });

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-black text-[#2d3142] tracking-tight">All Moodboards</h1>
                    <p className="text-gray-500 mt-1 font-medium">Manage and view your visual inspirations across all projects.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/projects"
                        className="px-6 py-3 bg-[#fef7f2] text-[#d9a88a] rounded-2xl text-sm font-bold hover:bg-[#d9a88a] hover:text-white transition-all shadow-sm flex items-center gap-2"
                    >
                        <FolderOpen className="w-4 h-4" />
                        Projects
                    </Link>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm mb-8 flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search moodboards..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-[#d9a88a]/20 transition-all outline-none"
                    />
                </div>

                {/* Project Filter */}
                <div className="relative min-w-[240px]">
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
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Fetching your boards...</p>
                </div>
            ) : filteredBoards.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredBoards.map((board) => {
                        const thumb = getBoardThumbnail(board);
                        return (
                            <Link
                                key={board._id}
                                href="/dashboard/visualizer"
                                onClick={() => useProjectStore.getState().setActiveMoodboard(board._id, board.moodboard_name, board.projectId?._id, board.projectId?.projectName)}
                                className="group bg-white rounded-4xl p-4 border border-gray-100 hover:border-[#d9a88a]/30 hover:shadow-xl hover:shadow-[#d9a88a]/5 transition-all duration-500"
                            >
                                {/* Thumbnail */}
                                <div className="relative aspect-4/3 bg-[#f8f7f5] rounded-3xl overflow-hidden mb-5">
                                    {thumb ? (
                                        <Image
                                            src={thumb}
                                            alt={board.moodboard_name}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                                            <Layout className="w-10 h-10 text-gray-200" />
                                            <span className="text-[10px] text-gray-300 font-extrabold uppercase tracking-[0.2em]">No Items Added</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />

                                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                        <div className="bg-white/90 backdrop-blur p-2 rounded-xl shadow-lg text-[#d9a88a]">
                                            <ArrowRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="px-1 pb-1">
                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                        <h3 className="font-bold text-[#2d3142] group-hover:text-[#d9a88a] transition-colors truncate text-base">
                                            {board.moodboard_name}
                                        </h3>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-5 h-5 rounded-md bg-gray-50 flex items-center justify-center">
                                                <FolderOpen className="w-3 h-3 text-gray-400" />
                                            </div>
                                            <span className="text-xs text-gray-500 font-bold truncate max-w-[120px]">
                                                {board.projectId?.projectName || 'No Project'}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1.5 ml-auto">
                                            <User className="w-3 h-3 text-gray-300" />
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                                                {user?.fullName || 'Architect'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-4xl border border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-[#fef7f2] rounded-3xl flex items-center justify-center mb-6">
                        <Layout className="w-10 h-10 text-[#d9a88a]" />
                    </div>
                    <h3 className="text-xl font-bold text-[#2d3142] mb-2">No moodboards found</h3>
                    <p className="text-gray-400 font-medium max-w-xs text-center">
                        {searchQuery || selectedProject !== 'all'
                            ? "Try adjusting your filters or search query to find what you're looking for."
                            : "Start by creating your first moodboard within a project."}
                    </p>
                    {(searchQuery || selectedProject !== 'all') && (
                        <button
                            onClick={() => { setSearchQuery(''); setSelectedProject('all'); }}
                            className="mt-6 text-sm font-bold text-[#d9a88a] hover:underline uppercase tracking-widest"
                        >
                            Clear All Filters
                        </button>
                    )}
                </div>
            )}
        </Container>
    );
}
