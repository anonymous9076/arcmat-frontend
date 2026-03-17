"use client";

import { useState } from "react";
import Image from "next/image";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import { useGetFeaturedGallery } from "@/hooks/useInspirationGallery";
import { ImageIcon } from "lucide-react";

const InspirationGalleryPage = () => {
    const [visibleCount, setVisibleCount] = useState(8);

    const { data: galleryItems, isLoading, error } = useGetFeaturedGallery();

    const visibleItems = (galleryItems || []).slice(0, visibleCount);

    if (isLoading) {
        return (
            <section className="bg-[#ece6df] py-16">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 md:p-8">
                    {[...Array(8)].map((_, i) => (
                        <div
                            key={i}
                            className={`h-[350px] bg-gray-300 animate-pulse rounded-xl ${
                                i % 2 !== 0 ? "mt-10" : ""
                            }`}
                        />
                    ))}
                </div>
            </section>
        );
    }

    if (error || !galleryItems || galleryItems.length === 0) {
        return (
            <section className="bg-white py-24">
                <Container>
                    <div className="flex flex-col items-center justify-center text-center gap-4 py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <ImageIcon className="w-16 h-16 text-gray-300" />
                        <h2 className="text-2xl font-bold text-gray-500">No Inspiration Images Yet</h2>
                        <p className="text-gray-400 max-w-sm">
                            The admin hasn't featured any renders yet. Check back soon for curated inspiration.
                        </p>
                    </div>
                </Container>
            </section>
        );
    }

    return (
        <section className="bg-white py-16 relative">
            {/* Gallery */}
            <div className="p-4 md:p-8 bg-[#ece6df]">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[...Array(4)].map((_, colIndex) => (
                        <div
                            key={colIndex}
                            className={`flex flex-col gap-4
                                ${colIndex === 1 || colIndex === 3 ? "mt-10" : ""}
                                ${colIndex >= 2 ? "hidden lg:flex" : "flex"}
                            `}
                        >
                            {visibleItems
                                .filter((_, index) => index % 4 === colIndex)
                                .map((item) => (
                                    <GalleryCard key={item._id} item={item} />
                                ))}
                        </div>
                    ))}
                </div>

                {/* Show More / Show Less */}
                <div className="flex justify-center gap-4 mt-12 mb-20" id="gallery-start">
                    {visibleCount < galleryItems.length && (
                        <Button
                            text="Show More"
                            onClick={() => setVisibleCount((p) => p + 8)}
                            className="bg-white hover:bg-[#d69e76] hover:text-white border-[#d69e76] border text-[#d69e76] font-medium py-3 px-10 h-auto shadow-sm text-lg rounded-full"
                        />
                    )}
                    {visibleCount > 8 && (
                        <Button
                            text="Show Less"
                            onClick={() => {
                                setVisibleCount(8);
                                document.getElementById("gallery-start")?.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="bg-white hover:bg-[#d69e76] hover:text-white border-[#d69e76] border text-[#d69e76] font-medium py-3 px-10 h-auto shadow-sm text-lg rounded-full"
                        />
                    )}
                </div>
            </div>
        </section>
    );
};

const GalleryCard = ({ item }) => {
    const architectName = item.architectId?.name || "Architect";
    const title = item.title || "Inspiration";
    const imageUrl = item.imageUrl;

    return (
        <div className="relative h-[350px] overflow-hidden rounded-xl cursor-pointer group bg-gray-200 shadow-md hover:shadow-xl transition-shadow duration-300 block">
            {/* Skeleton behind image */}
            <div className="absolute inset-0 animate-pulse bg-gray-300 z-0" />

            {imageUrl ? (
                <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    className="relative z-10 object-cover transition-all duration-700 ease-in-out group-hover:scale-110"
                    unoptimized
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                </div>
            )}

            {/* Hover Overlay */}
            <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#d69e76] mb-1">
                        {architectName}
                    </p>
                    <p className="text-sm text-gray-200">
                        {title.length > 60 ? title.slice(0, 60) + "..." : title}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default InspirationGalleryPage;