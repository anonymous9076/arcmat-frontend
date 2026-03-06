'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGetProjects } from '@/hooks/useProject';
import { useGetUsers } from '@/hooks/useAuth';
import ProjectCard from '@/components/dashboard/projects/ProjectCard';
import Container from '@/components/ui/Container';
import { HardHat, ChevronLeft, Loader2, Search, Filter } from 'lucide-react';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export default function ArchitectProjectsPage() {
    const { architectId } = useParams();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch Architect Details
    const { data: usersData, isLoading: isUserLoading } = useGetUsers({
        role: 'architect',
        limit: 100 // Try to get enough to find the one we need
    });
    const architect = usersData?.users?.find(u => u._id === architectId);

    // Fetch Projects for this Architect
    const { data: projectsData, isLoading: isProjectsLoading } = useGetProjects({
        architectId: architectId,
        enabled: !!architectId
    });

    const projects = projectsData?.data || [];

    const filteredProjects = projects.filter(project =>
        project.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.location?.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isLoading = isUserLoading || isProjectsLoading;

    return (
        <Container className="py-8">
            {/* Header / Breadcrumbs */}
            <div className="mb-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#e09a74] transition-colors mb-4 group"
                >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to User Management
                </button>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                            <HardHat className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {architect ? `${architect.name}'s Projects` : 'Architect Projects'}
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">
                                Viewing all projects managed by {architect?.name || 'this architect'}.
                            </p>
                        </div>
                    </div>

                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#e09a74] transition-colors text-sm"
                        />
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 text-[#e09a74] animate-spin mb-4" />
                    <p className="text-gray-400 font-medium">Loading projects...</p>
                </div>
            ) : filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <div key={project._id} className="relative">
                            <ProjectCard
                                project={project}
                                href={`/dashboard/users/projects/${project._id}/moodboards`}
                                onEdit={() => { }} // Read-only for now or link to real edit
                                onDelete={() => { }}
                            />
                            {/* Override link for admin context if needed, but ProjectCard links internally */}
                            {/* If we want to stay in admin context, we might need a custom card or modified ProjectCard */}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-dashed border-gray-200 py-20 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <HardHat className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No projects found</h3>
                    <p className="text-gray-500 max-w-xs mx-auto">
                        This architect hasn't created any projects yet or none match your search.
                    </p>
                </div>
            )}
        </Container>
    );
}
