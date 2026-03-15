'use client';

import React, { useState } from 'react';
import { useGetArchitectsWithRenders, useGetArchitectRenders, useAddToFeaturedGallery, useRemoveFromFeaturedGallery } from '@/hooks/useInspirationGallery';
import { ArrowLeft, Plus, Trash2, ImageIcon } from 'lucide-react';
import Image from 'next/image';

const ArchitectList = ({ onSelectArchitect }) => {
    const { data: architects, isLoading, error } = useGetArchitectsWithRenders();

    if (isLoading) return <div className="py-8 text-center text-gray-500">Loading architects...</div>;
    if (error) return <div className="py-8 text-center text-red-500">Failed to load architects</div>;
    if (!architects || architects.length === 0) return <div className="py-8 text-center text-gray-500">No architects have uploaded renders yet.</div>;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {architects.map((arch) => (
                <div 
                    key={arch._id} 
                    onClick={() => onSelectArchitect(arch)}
                    className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center cursor-pointer hover:border-[#d9a88a] hover:shadow-md transition-all text-center"
                >
                    <div className="w-20 h-20 rounded-full bg-gray-100 mb-4 overflow-hidden relative">
                        {arch.profile ? (
                            <Image src={arch.profile} alt={arch.name} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl font-bold bg-gray-200">
                                {arch.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg line-clamp-1">{arch.name}</h3>
                    <p className="text-sm text-gray-500 mb-4">{arch.professionalType || 'Architect'}</p>
                    
                    <div className="mt-auto px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100">
                        {arch.renderCount} {arch.renderCount === 1 ? 'Render' : 'Renders'} Available
                    </div>
                </div>
            ))}
        </div>
    );
};

const ArchitectRenders = ({ architect, onBack }) => {
    const { data: renders, isLoading } = useGetArchitectRenders(architect._id);
    const { mutate: addToGallery, isPending: isAdding } = useAddToFeaturedGallery();
    const { mutate: removeFromGallery, isPending: isRemoving } = useRemoveFromFeaturedGallery();

    const handleToggleFeatured = (render) => {
        if (render.isFeatured) {
            removeFromGallery(render.public_id);
        } else {
            addToGallery({
                renderId: render.public_id,
                imageUrl: render.imageUrl,
                title: render.title || render.projectName,
                architectId: architect._id,
                projectId: render.projectId
            });
        }
    };

    if (isLoading) return <div className="py-8 text-center text-gray-500">Loading renders...</div>;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4 border-b border-gray-200 pb-4">
                <button 
                    onClick={onBack}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden relative">
                        {architect.profile ? (
                            <Image src={architect.profile} alt={architect.name} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold bg-gray-200">
                                {architect.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900 text-lg">{architect.name}'s Renders</h2>
                        <p className="text-xs text-gray-500">Select renders to feature on the homepage Inspiration Gallery</p>
                    </div>
                </div>
            </div>

            {!renders || renders.length === 0 ? (
                <div className="py-12 text-center text-gray-500">This architect has no renders available.</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {renders.map((render) => (
                        <div key={render._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm group">
                            <div className="relative aspect-video bg-gray-100 w-full overflow-hidden">
                                {render.imageUrl ? (
                                    <Image src={render.imageUrl} alt={render.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <ImageIcon className="w-8 h-8 text-gray-300" />
                                    </div>
                                )}
                                
                                <div className="absolute top-2 right-2 flex gap-2">
                                    {render.isFeatured && (
                                        <span className="px-2.5 py-1 bg-green-500 text-white text-[10px] font-bold tracking-wider uppercase rounded-md shadow-sm">
                                            Featured
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="p-4">
                                <h4 className="font-semibold text-gray-900 line-clamp-1">{render.title}</h4>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-1">Project: {render.projectName}</p>
                                
                                <button
                                    onClick={() => handleToggleFeatured(render)}
                                    disabled={isAdding || isRemoving}
                                    className={`mt-4 w-full py-2 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                                        render.isFeatured 
                                            ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' 
                                            : 'bg-[#faf0ea] text-[#d9a88a] border border-[#d9a88a]/30 hover:bg-[#d9a88a] hover:text-white'
                                    } disabled:opacity-50`}
                                >
                                    {render.isFeatured ? (
                                        <>
                                            <Trash2 className="w-4 h-4" /> Remove from Homepage
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4" /> Add to Homepage
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default function InspirationGalleryAdmin() {
    const [selectedArchitect, setSelectedArchitect] = useState(null);

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-hidden min-h-[500px]">
            {selectedArchitect ? (
                <ArchitectRenders 
                    architect={selectedArchitect} 
                    onBack={() => setSelectedArchitect(null)} 
                />
            ) : (
                <div className="flex flex-col gap-6">
                    <div>
                        <h2 className="font-bold text-gray-900 text-lg">Architect Renders</h2>
                        <p className="text-sm text-gray-500">Select an architect to view and feature their project renders.</p>
                    </div>
                    
                    <ArchitectList onSelectArchitect={setSelectedArchitect} />
                </div>
            )}
        </div>
    );
}
