'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Button from '../ui/Button';
import { Upload } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { Autoplay } from 'swiper/modules';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import bannerService from '@/services/bannerService';
import { getBannerImageUrl } from '@/lib/productUtils';
import Loader from '../ui/loader';


const HeroSection = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [banners, setBanners] = useState([]);
    const [isNavigating, setIsNavigating] = useState(false);

    const isAdmin = user?.role === 'admin';

    const handleUploadClick = () => {
        setIsNavigating(true);
        router.push('/dashboard/homepage?tab=inspiration');
    };

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const response = await bannerService.getAllBanners();
                if (response && response.data) {
                    const inspirationBanners = response.data.filter(
                        b => b.banner_type === 'Inspiration' && b.status === 1
                    );
                    setBanners(inspirationBanners);
                }
            } catch (error) {
            }
        };
        fetchBanners();
    }, []);



    return (
        <section className="relative w-full h-[80vh] md:h-[80vh] overflow-hidden">
            <Swiper
                modules={[Autoplay]}
                autoplay={{ delay: 3500, disableOnInteraction: false }}
                loop={banners.length > 1}
                speed={950}
                slidesPerView={1}
                allowTouchMove={false}
                className="absolute inset-0 w-full h-full z-0"
            >
                {banners.length > 0 ? (
                    banners.map((banner, idx) => (
                        <SwiperSlide key={banner._id || idx} className="h-full">
                            <div className="relative w-full h-full min-h-[80vh]">
                                <Image
                                    src={getBannerImageUrl(banner.banner) || '/Images/Inspiration_Gallery.jpeg'}

                                    alt={banner.banner_alt || 'Inspiration Gallery Banner'}
                                    fill
                                    sizes="100vw"
                                    className="object-cover object-center w-full h-full"
                                    priority={idx === 0}
                                />
                            </div>
                        </SwiperSlide>
                    ))
                ) : (
                    <SwiperSlide className="h-full">
                        <div className="relative w-full h-full min-h-[80vh]">
                            <Image
                                src="/Images/Inspiration_Gallery.jpeg"
                                alt="Inspiration Gallery Banner"
                                fill
                                sizes="100vw"
                                className="object-cover object-center w-full h-full"
                                priority
                            />
                        </div>
                    </SwiperSlide>
                )}
            </Swiper>

            <div className="absolute inset-0 bg-black/60 z-10" />

            <div className="absolute inset-0 z-20 flex flex-col gap-4 items-center justify-center text-center text-white px-4">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[79px] font-semibold leading-tight">
                    Inspiration Gallery
                </h1>
                <p className="max-w-[800px] text-base sm:text-lg md:text-xl lg:text-[23px] font-normal px-2">
                    Discover our collection of inspiration images for kitchens, hospitality, workspaces, and residences.
                </p>

                {isAdmin && (
                    <div className="flex gap-4 flex-wrap justify-center mt-4">
                        <Button
                            disabled={isNavigating}
                            text={
                                <span className="flex items-center gap-2">
                                    <Upload className="w-5 h-5" />
                                    Upload Inspiration
                                </span>
                            }
                            onClick={handleUploadClick}
                            className="px-6 py-3 bg-[#e18e60] text-[16px] text-white hover:bg-white hover:text-[#e18e60] hover:scale-105 transition-all min-w-[200px]"
                        />
                    </div>
                )}
            </div>

            {isNavigating && (
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300">
                    <div>
                        <Loader />
                    </div>
                </div>
            )}
        </section>
    );
};

export default HeroSection;
