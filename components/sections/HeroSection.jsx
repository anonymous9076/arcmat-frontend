'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Button from '../ui/Button';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { Autoplay } from 'swiper/modules';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { toast } from '../ui/Toast';
import bannerService from '@/services/bannerService';
import { getBannerImageUrl } from '@/lib/productUtils';


const HeroSection = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await bannerService.getAllBanners();

        if (response && response.data) {
          const heroBanners = response.data.filter(b => b.banner_type === 'Hero' && b.status === 1);
          setBanners(heroBanners);
        }
      } catch (error) {
      }
    };

    fetchBanners();
  }, []);

  const handleCTAClick = () => {
    if (isAuthenticated) {
      toast.info("You’re logged in. No action needed.");
    } else {
      router.push('/auth/register');
    }
  };



  return (
    <section className="relative w-full h-auto min-h-[80vh] sm:min-h-screen overflow-hidden">
      <Swiper
        modules={[Autoplay]}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
          pauseOnMouseEnter: false,
        }}
        loop={banners.length > 1}
        speed={950}
        slidesPerView={1}
        allowTouchMove={false}
        className="absolute inset-0 w-full h-full z-0"
        aria-label="Main hero images slider"
      >
        {banners.length > 0 ? (
          banners.map((banner, idx) => (
            <SwiperSlide key={banner._id || idx} className="h-full">
              <div className="relative w-full h-full min-h-[80vh] sm:min-h-screen">
                <Image
                  src={getBannerImageUrl(banner.banner) || '/Images/Banner.png'}

                  alt={banner.banner_alt || 'Hero Banner'}
                  fill
                  sizes="100dvw"
                  className="object-cover object-center w-full h-full"
                  priority={idx === 0}
                />
                <span className="sr-only">{banner.banner_alt}</span>
              </div>
            </SwiperSlide>
          ))
        ) : (

          <SwiperSlide className="h-full">
            <div className="relative w-full h-full min-h-[80vh] sm:min-h-screen">
              <Image
                src='/Images/Banner.png'
                alt='Default Banner'
                fill
                sizes="100dvw"
                className="object-cover object-center w-full h-full"
                priority
              />
            </div>
          </SwiperSlide>
        )}
      </Swiper>

      <div className="absolute inset-0 bg-black/60 z-10"></div>

      <div className="absolute inset-0 z-20 flex flex-col gap-4 items-center justify-center text-center text-white px-4 py-20 md:py-0">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[79px] font-semibold leading-tight">
          Search. Select. Specify
        </h1>
        <p className="max-w-[800px] text-base sm:text-lg md:text-xl lg:text-[23px] font-normal px-2">
          Everything you need to choose the right materials.
        </p>
        <div className="flex gap-4 flex-wrap justify-center mt-4">
          <Button
            text="Join for free"
            onClick={handleCTAClick}
            className="px-6 py-3 bg-white text-[16px] text-[#4D4E58] hover:bg-gray-100 hover:scale-105"
          />
          <Button
            onClick={handleCTAClick}
            text="Become a Brand Partner"
            className="px-6 py-3 bg-white text-[16px] text-[#4D4E58] hover:bg-gray-100 hover:scale-105"
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
