'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Thumbs, FreeMode } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/thumbs'
import 'swiper/css/free-mode'

/**
 * ProductImageCarousel
 * Dynamically imported with ssr:false in ProductDetailView to prevent Swiper classList SSR errors.
 * Uses programmatic slide reset instead of key-based remounting to avoid classList teardown errors.
 */
export default function ProductImageCarousel({ images = [], name = 'Product', selectedVariantId }) {
    const [thumbsSwiper, setThumbsSwiper] = useState(null)
    const mainSwiperRef = useRef(null)

    // When variant changes, reset to slide 0 WITHOUT remounting Swiper
    useEffect(() => {
        if (mainSwiperRef.current && !mainSwiperRef.current.destroyed) {
            mainSwiperRef.current.slideTo(0, 0)
        }
    }, [selectedVariantId])

    if (images.length === 0) {
        return (
            <div className="relative aspect-4/3 bg-white rounded-none overflow-hidden">
                <Image src="/Icons/arcmatlogo.svg" alt={name} fill className="object-contain" priority />
            </div>
        )
    }

    if (images.length === 1) {
        return (
            <div className="relative aspect-4/3 bg-white rounded-none overflow-hidden">
                <Image
                    src={images[0]}
                    alt={name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                    className="object-contain"
                    priority
                />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Main Swiper — stable, no remount on variant change */}
            <div className="relative aspect-4/3 bg-white rounded-none overflow-hidden">
                <Swiper
                    onSwiper={(swiper) => { mainSwiperRef.current = swiper }}
                    modules={[Pagination, Thumbs]}
                    pagination={{ clickable: true }}
                    thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                    className="h-full w-full product-detail-swiper"
                >
                    {images.map((img, idx) => (
                        <SwiperSlide key={idx}>
                            <div className="relative w-full h-full">
                                <Image
                                    src={img || '/Icons/arcmatlogo.svg'}
                                    alt={`${name} - Image ${idx + 1}`}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                                    className="object-contain"
                                    priority={idx === 0}
                                />
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>

            {/* Thumbnails */}
            <Swiper
                onSwiper={setThumbsSwiper}
                modules={[Thumbs, FreeMode]}
                spaceBetween={8}
                slidesPerView={5}
                breakpoints={{
                    640: { slidesPerView: 6, spaceBetween: 10 },
                    768: { slidesPerView: 7, spaceBetween: 12 },
                }}
                freeMode={true}
                watchSlidesProgress={true}
                className="product-thumbs-swiper"
            >
                {images.map((img, idx) => (
                    <SwiperSlide key={idx}>
                        <div className="relative aspect-square bg-white overflow-hidden cursor-pointer border border-gray-200 hover:border-gray-400 transition-all">
                            <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-contain p-1" />
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    )
}
