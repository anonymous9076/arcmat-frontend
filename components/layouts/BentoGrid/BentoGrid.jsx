'use client';

import { useGetBentoItems } from '@/hooks/useBento';
import Image from 'next/image';
import Container from '@/components/ui/Container';
import { toast } from '@/components/ui/Toast';

const gridClasses = [
    "md:col-span-3",
    "md:col-span-3",
    "md:col-span-2",
    "md:col-span-2",
    "md:col-span-2",
    "md:col-span-6 !auto-rows-[300px]"
];

const BentoGrid = () => {
    const { data: bentoItems, isLoading } = useGetBentoItems();

    if (isLoading) {
        return (
            <Container>
                <div className="w-full max-w-[1440px] mx-auto py-10 min-h-[400px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d9a88a]"></div>
                </div>
            </Container>
        );
    }

    const items = bentoItems || [];

    return (
        <Container>
            <div className="w-full max-w-[1440px] mx-auto py-10">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-[300px] md:auto-rows-[400px]">
                    {items.map((item, index) => {
                        const imgUrl = item.image?.url || item.image?.secure_url || '/images/placeholders/default.jpg';
                        const className = gridClasses[index % gridClasses.length];

                        return (
                            <div
                                key={item._id || index}
                                className={`relative group overflow-hidden rounded-2xl ${className}`}
                                onClick={() => item.link ? window.open(item.link, '_blank') : toast.info(`Coming Soon`)}
                            >
                                <div className="absolute inset-0 w-full h-full bg-gray-100">
                                    <Image
                                        src={imgUrl}
                                        alt={item.title || 'Arcmat Bento Grid'}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px)"
                                        unoptimized
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                                </div>

                                <div className="absolute inset-0 p-6 flex flex-col justify-center items-start text-white">
                                    {item.title && (
                                        <h3 className="text-2xl md:text-3xl font-bold mb-2 drop-shadow-md">
                                            {item.title}
                                        </h3>
                                    )}
                                    {item.subtitle && (
                                        <p className="text-sm md:text-base text-gray-200 drop-shadow-sm max-w-[80%]">
                                            {item.subtitle}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Container>
    );
};

export default BentoGrid;
