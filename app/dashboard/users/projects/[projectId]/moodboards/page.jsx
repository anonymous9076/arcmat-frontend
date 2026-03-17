'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGetProject } from '@/hooks/useProject';
import MoodboardCard from '@/components/dashboard/projects/MoodboardCard';
import Container from '@/components/ui/Container';
import { Layout, ChevronLeft, Loader2, Search } from 'lucide-react';

export default function ProjectMoodboardsPage() {
    const { projectId } = useParams();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');

    const { data: projectData, isLoading: projectLoading } = useGetProject(projectId, { includeSpaces: true });
    const project = projectData?.data;
    const moodboards = project?.moodboards || [];

    const filteredMoodboards = moodboards.filter(mb =>
        mb.moodboard_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isLoading = projectLoading;

    return (
        <Container className="py-8">
            <div className="mb-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#e09a74] transition-colors mb-4 group"
                >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Projects List
                </button>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#e09a74]">
                            <Layout className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {project ? `${project.projectName} Spaces` : 'Project Spaces'}
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">
                                Viewing all spaces (moodboards) within this project.
                            </p>
                        </div>
                    </div>

                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search spaces..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#e09a74] transition-colors text-sm"
                        />
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 text-[#d9a88a] animate-spin mb-4" />
                    <p className="text-gray-400 font-medium">Loading spaces...</p>
                </div>
            ) : filteredMoodboards.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredMoodboards.map(mb => (
                        <div key={mb._id} className="relative">
                            <MoodboardCard
                                moodboard={mb}
                                projectId={projectId}
                                onDelete={() => { }} // Read-only view for admin here
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-dashed border-gray-200 py-20 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Layout className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No spaces found</h3>
                    <p className="text-gray-500 max-w-xs mx-auto">
                        This project doesn't have any spaces (moodboards) yet.
                    </p>
                </div>
            )}
        </Container>
    );
}
