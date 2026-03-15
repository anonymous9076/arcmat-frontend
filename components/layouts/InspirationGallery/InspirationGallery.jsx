"use client";
import { useState } from "react";
import Image from "next/image";
import { useGetFeaturedGallery } from "@/hooks/useInspirationGallery";
import InspirationCard from "../../cards/InspirationCard";
import Container from "../../ui/Container";
import Button from "@/components/ui/Button";

const categories = ["All", "Kitchen", "Bedroom", "Furniture", "Decor", "Lighting", "Finishes", "Bathware"];

const InspirationGallery = () => {
    const [activeCategory, setActiveCategory] = useState("All");
    const [selectedProduct, setSelectedProduct] = useState(null);

    const { data: apiData, isLoading } = useGetFeaturedGallery();
    const galleryItems = apiData || [];

    const filteredData = activeCategory === "All"
        ? galleryItems
        : galleryItems.filter(item => item.category === activeCategory);

    const handleProductClick = (item) => {
        setSelectedProduct(item);
    };

    const closeModal = () => {
        setSelectedProduct(null);
    };

    return (
        <section className="bg-white py-16 relative">
            <Container>
                <h2 className="text-4xl md:text-5xl font-bold text-center text-[#4D4E58] mb-10 tracking-tight">
                    Inspiration Gallery
                </h2>

                <div className="flex flex-wrap justify-center gap-3 mb-12">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`px-6 py-2 rounded-full border transition-all duration-300 text-sm md:text-base font-medium
                        ${activeCategory === category
                                    ? "bg-[#d69e76] border-[#d69e76] text-white shadow-md"
                                    : "bg-white border-[#d69e76] text-[#6b6b6b] hover:bg-[#fff6f0]"
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {isLoading ? (
                    <div className="py-20 text-center text-gray-500 w-full animate-pulse">Loading gallery...</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredData.map((item) => (
                            <InspirationCard
                                key={item._id}
                                company={item.architectId?.name || "Architect"}
                                image={item.imageUrl}
                                description={item.title || "Project Render"}
                                link={`/productdetails/${item.projectId?._id || ''}`}
                                onViewMore={() => handleProductClick(item)}
                            />
                        ))}
                    </div>
                )}

                {!isLoading && filteredData.length === 0 && (
                    <div className="text-center py-20 text-gray-500">
                        Coming Soon
                    </div>
                )}

                <div className="flex gap-4 flex-wrap justify-center mt-8">
                    <Button
                        text='View All'
                        href="/inspiration-page"
                        className="px-8 py-3 bg-[#e18e60] text-[16px] text-white hover:bg-white hover:text-[#e18e60] hover:border-[#e18e60] border hover:scale-105 transition-all"
                    />

                </div>
            </Container>

            {/* {selectedProduct && (
                <div className="fixed inset-0 z-150 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeModal}>
                    <div
                        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col relative animate-in fade-in zoom-in duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 z-10 p-2 bg-white/80 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <Image src="/Icons/icons8-close.svg" alt="Close" width={24} height={24} className="w-6 h-6" />
                        </button>

                        <div className="w-full h-96 relative bg-gray-100">
                            <img
                                src={selectedProduct.image}
                                alt={selectedProduct.description}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <div className="w-full p-6 text-center">
                            <span className="font-bold text-[#d69e76] text-2xl italic tracking-wide">
                                {selectedProduct.company}
                            </span>
                        </div>
                    </div>
                </div>
            )} */}
        </section>
    );
};

export default InspirationGallery;
