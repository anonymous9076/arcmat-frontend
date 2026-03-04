'use client';

import { useState, useEffect } from 'react';
import { useGetProjects } from '@/hooks/useProject';
import ProjectCard from '@/components/dashboard/projects/ProjectCard';
import useAuthStore from '@/store/useAuthStore';
import { Grid, List, Search, Filter, Loader2, Plus, AlertTriangle, ChevronDown } from 'lucide-react';
import Button from '@/components/ui/Button';
import CreateProjectModal from '@/components/dashboard/sidebar/CreateProjectModal';
import { useDeleteProject } from '@/hooks/useProject';
import { toast } from '@/components/ui/Toast';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

export default function AllProjectsPage() {
    const { user } = useAuthStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState(null);
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState('All');

    const deleteProjectMutation = useDeleteProject();

    useEffect(() => {
        setMounted(true);
    }, []);

    const { data: projectsData, isLoading } = useGetProjects({
        enabled: mounted && !!user
    });

    const projects = projectsData?.data || [];

    const handleEdit = (project) => {
        setEditingProject(project);
        setIsProjectModalOpen(true);
    };

    const handleDeleteClick = (project) => {
        setProjectToDelete(project);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (projectToDelete) {
            deleteProjectMutation.mutate(projectToDelete._id);
            setProjectToDelete(null);
        }
    };

    const closeProjectModal = () => {
        setIsProjectModalOpen(false);
        setEditingProject(null);
    };

    const filteredProjects = projects.filter(project => {
        const matchesSearch = project.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.location?.city?.toLowerCase().includes(searchTerm.toLowerCase());

        // Default project status to 'Active' if it doesn't exist
        const projectStatus = project.status || 'Active';
        const matchesTab = activeTab === 'All' || projectStatus === activeTab;

        return matchesSearch && matchesTab;
    });

    if (!mounted) return null;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-[28px] font-extrabold text-[#2d3142] tracking-tight">
                    Projects
                </h1>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                    {['All', 'Active', 'On hold', 'Completed', 'Canceled', 'Archived'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setActiveTab(status)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === status
                                ? 'bg-[#2d3142] text-white hover:bg-gray-800'
                                : 'bg-[#f4f5f7] text-gray-500 hover:bg-gray-200'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                    <div className="relative ml-4 shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-[#f4f5f7] border border-transparent focus:bg-white focus:border-[#d9a88a] focus:ring-1 focus:ring-[#d9a88a] rounded-full transition-all text-sm text-gray-600 font-medium w-48 md:w-64 outline-none"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <button className="flex items-center gap-1.5 text-sm text-gray-500 font-medium hover:text-gray-700 transition-colors">
                        Last updated
                        <ChevronDown className="w-4 h-4" />
                    </button>
                    <Button
                        onClick={() => setIsProjectModalOpen(true)}
                        className="bg-[#3c4153] hover:bg-[#2d3142] text-white px-5 py-2.5 rounded-full font-semibold flex items-center gap-2 transition-all active:scale-95 text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        New project
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                    <Loader2 className="w-12 h-12 text-[#d9a88a] animate-spin mb-4" />
                    <p className="text-gray-400 font-bold text-lg">Loading your projects...</p>
                </div>
            ) : filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProjects.map(project => (
                        <ProjectCard
                            key={project._id}
                            project={project}
                            onEdit={handleEdit}
                            onDelete={() => handleDeleteClick(project)}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[40px] border border-dashed border-gray-200 text-center">
                    <div className="w-24 h-24 bg-[#fef7f2] rounded-3xl flex items-center justify-center mb-8">
                        <Plus className="w-12 h-12 text-[#d9a88a]" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#2d3142] mb-3">No projects found</h3>
                    <p className="text-gray-400 font-medium max-w-sm mx-auto mb-10">
                        {searchTerm
                            ? "We couldn't find any projects matching your search term. Try another word?"
                            : "You haven't created any projects yet. Start by creating your first project!"}
                    </p>
                </div>
            )}

            <CreateProjectModal
                isOpen={isProjectModalOpen}
                onClose={closeProjectModal}
                project={editingProject}
            />

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Project"
                message={`Are you sure you want to delete "${projectToDelete?.projectName}"? This action cannot be undone.`}
                confirmText="Delete"
                type="danger"
            />
        </div>
    );
}
