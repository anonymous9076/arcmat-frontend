'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGetMoodboardsByProject, useDeleteMoodboard } from '@/hooks/useMoodboard';
import { useGetProject } from '@/hooks/useProject';
import MoodboardCard from '@/components/dashboard/projects/MoodboardCard';
import CreateMoodboardModal from '@/components/dashboard/projects/CreateMoodboardModal';
import { Loader2, Plus, ArrowLeft, Layout } from 'lucide-react';
import Button from '@/components/ui/Button';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

export default function MoodboardsPage() {
    const { projectId } = useParams();
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [moodboardToDelete, setMoodboardToDelete] = useState(null);

    const { data: projectData, isLoading: projectLoading } = useGetProject(projectId);
    const { data: moodboardsData, isLoading: moodboardsLoading } = useGetMoodboardsByProject(projectId);
    const deleteMutation = useDeleteMoodboard();

    const moodboards = moodboardsData?.data || [];
    const project = projectData?.data;

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

    if (projectLoading || moodboardsLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-[#d9a88a] animate-spin mb-4" />
                <p className="text-gray-400 font-bold">Loading moodboards...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-400 hover:text-[#d9a88a] font-bold mb-8 transition-colors group"
            >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                Back to Projects
            </button>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black text-[#2d3142] mb-2 tracking-tight">
                        {project?.projectName} <span className="text-[#d9a88a]">/ Moodboards</span>
                    </h1>
                    <p className="text-gray-400 font-medium">
                        Concepts and budget estimations for this project.
                    </p>
                </div>
                <Button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-[#d9a88a] text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 transition-all shadow-lg shadow-orange-100 hover:scale-105 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    New Moodboard
                </Button>
            </div>

            {moodboards.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {moodboards.map(mb => (
                        <MoodboardCard
                            key={mb._id}
                            moodboard={mb}
                            projectId={projectId}
                            onDelete={handleDeleteClick}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[40px] border border-dashed border-gray-200 text-center">
                    <div className="w-24 h-24 bg-[#fef7f2] rounded-3xl flex items-center justify-center mb-8">
                        <Layout className="w-12 h-12 text-[#d9a88a]" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#2d3142] mb-3">No moodboards yet</h3>
                    <p className="text-gray-400 font-medium max-w-sm mx-auto mb-10">
                        Start by creating your first moodboard to organize your design ideas and costs.
                    </p>
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-[#d9a88a] text-white px-10 py-4 rounded-2xl font-black"
                    >
                        Create Your First Moodboard
                    </Button>
                </div>
            )}

            <CreateMoodboardModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                projectId={projectId}
            />

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Moodboard"
                message="Are you sure you want to delete this moodboard and its associated costs? This action cannot be undone."
                confirmText="Delete"
                type="danger"
            />
        </div>
    );
}
