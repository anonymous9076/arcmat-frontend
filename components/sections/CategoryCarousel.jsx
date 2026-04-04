'use client';
import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import Image from 'next/image';
import 'swiper/css';
import 'swiper/css/navigation';
import Container from '../ui/Container';
import { useGetCategories } from '@/hooks/useCategory';
import Link from 'next/link';
import { useMemo } from 'react';

const categories = [
    { name: 'NEW', image: '/Category/new.jpg' },
    { name: 'CONSTRUCTION', image: '/Category/construction.jpg' },
    { name: 'FINISHES', image: '/Category/finish.jpg' },
    { name: 'LIGHTING', image: '/Category/light.jpg' },
    { name: 'FURNITURE', image: '/Category/Furniture.jpg' },
    { name: 'DECOR', image: '/Category/decor.jpg' },
    { name: 'BATHWARE', image: '/Category/bathware.jpg' },
    { name: 'SMART', image: '/Category/smart.jpg' },
    { name: 'APPLIANCES', image: '/Category/appliances.jpg' },
];


const CategoryCarousel = () => {
    const { data: categoriesData, isLoading } = useGetCategories({ level: 1 });

    const categoriesWithLinks = useMemo(() => {
        if (!categoriesData) return categories;
        return categories.map(cat => {
            if (cat.name.toUpperCase() === 'NEW') {
                return { ...cat, href: '/productlist' };
            }

            const backendCat = categoriesData.find(
                bc => bc.name?.toLowerCase() === cat.name.toLowerCase()
            );
            return {
                ...cat,
                href: backendCat ? `/productlist?category=${backendCat._id || backendCat.id}` : '/productlist'
            };
        });
    }, [categoriesData]);

    return (
        <Container>
            <section className="w-full py-10 relative lg:px-10">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-10">
                        <div className="w-10 h-10 border-4 border-gray-200 border-t-[#e09a74] rounded-full animate-spin"></div>
                        <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mt-4">Loading Categories...</p>
                    </div>
                ) : (
                    <>
                        <div className="custom-prev absolute left-0 z-10 cursor-pointer transition-transform hidden lg:block hover:scale-110 active:scale-95">
                            <Image src="/Icons/Back.svg" alt="Previous" width={40} height={40} />
                        </div>
                        <div className="custom-next absolute right-0 z-10 cursor-pointer transition-transform hidden lg:block hover:scale-110 active:scale-95">
                            <Image src="/Icons/Forward.svg" alt="Next" width={40} height={40} />
                        </div>

                <Swiper
                    modules={[Navigation]}
                    spaceBetween={20}
                    slidesPerView={3.5}
                    navigation={{
                        prevEl: '.custom-prev',
                        nextEl: '.custom-next',
                    }}
                    breakpoints={{
                        640: {
                            slidesPerView: 4.5,
                        },
                        768: {
                            slidesPerView: 5.5,
                        },
                        1024: {
                            slidesPerView: 6.5
                        },
                        1280: {
                            slidesPerView: 8,
                        },
                    }}

                >
                    {categoriesWithLinks.map((cat, index) => (
                        <SwiperSlide
                            key={index}
                            className="!flex flex-col items-center justify-center pt-2"
                        >
                            <Link
                                href={cat.href}
                                className="flex flex-col items-center justify-center group cursor-pointer"
                            >
                                <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-4xl overflow-hidden bg-linear-to-br from-white/90 to-[#F5F5F0]/60 backdrop-blur-[2px] border-2 border-gray-50  shadow-[0_4px_12px_rgba(0,0,0,0.03)] flex items-center justify-center mb-4 transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] group-hover:border-gray-50">
                                    <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-10" />
                                    <Image
                                        src={cat.image}
                                        alt={cat.name}
                                        width={128}
                                        height={128}
                                        className="w-full h-full object-cover grayscale-20 group-hover:grayscale-0 transition-all duration-500"
                                    />
                                </div>
                                <h3 className="w-full text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-widest text-center mt-2 group-hover:text-black transition-colors">
                                    {cat.name}
                                </h3>
                            </Link>
                        </SwiperSlide>
                    ))}
                </Swiper>
                    </>
                )}

                <style jsx>{`
                .custom-prev,
                .custom-next {
                    top: 48px; /* Mobile image center (96px/2) + container padding offset if needed, here relative to section padding */
                    transform: translateY(-50%);
                    margin-top: 40px; /* Adjust for padding-top: 10 (40px) of section */
                }
                
                @media (min-width: 640px) {
                    .custom-prev,
                    .custom-next {
                        margin-top: 40px; /* same padding offset */
                        top: 56px; /* SM image center (112px/2) */
                    }
                }
                @media (min-width: 768px) {
                    .custom-prev,
                    .custom-next {
                         margin-top: 40px;
                        top: 64px; /* MD image center (128px/2) */
                    }
                    .custom-prev {
                        left: 10px;
                    }
                    .custom-next {
                        right: 10px;
                    }
                }
            `}</style>
            </section>
        </Container>
    );
};

export default CategoryCarousel;
