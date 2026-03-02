"use client"
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Button from '../ui/Button'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import { getProductImageUrl, getVariantImageUrl, getColorCode, resolvePricing, calculateDiscount } from '@/lib/productUtils'
import { Heart, ShoppingCart, X, Check, Plus, CheckCircle } from 'lucide-react'
import { useAddToWishlist, useGetWishlist } from '@/hooks/useWishlist'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/useCartStore'
import { useAddToCart, useGetCart, useRemoveFromCart } from '@/hooks/useCart'
import { useCompareStore } from '@/store/useCompareStore'
import { toast } from '@/components/ui/Toast'
import useProjectStore from '@/store/useProjectStore'
import { useSelectionStore } from '@/store/useSelectionStore'
import { useGetMoodboard } from '@/hooks/useMoodboard'
import dynamic from 'next/dynamic'
const AddToMoodboardModal = dynamic(() => import('@/components/dashboard/projects/AddToMoodboardModal'), { ssr: false })

const ProductCard = ({ product }) => {
    const isVariantCentric = Boolean(product.productId && typeof product.productId === 'object');
    const rootProduct = isVariantCentric ? product.productId : product;
    const variantItem = isVariantCentric ? product : null;

    const name = rootProduct.product_name || rootProduct.name;
    const brand = rootProduct.brand;
    const subtitle = rootProduct.sort_description || rootProduct.subtitle;
    const id = rootProduct._id || rootProduct.id;

    const variants = rootProduct.variants || [];
    const displayVariant = variantItem || (variants.find(v => v.selling_price === rootProduct.minPrice) || variants[0]);

    // Pricing Logic
    const { price, mrp } = resolvePricing(rootProduct, displayVariant);
    const discountPercentage = calculateDiscount(mrp, price);

    const displayAttrs = [];
    if (displayVariant?.color) displayAttrs.push({ label: 'Color', value: displayVariant.color });
    if (displayVariant?.size) displayAttrs.push({ label: 'Size', value: displayVariant.size });
    if (displayVariant?.weight) {
        displayAttrs.push({
            label: 'Weight',
            value: `${displayVariant.weight} ${displayVariant.weight_type || ''}`
        });
    }

    const rawImages = displayVariant?.variant_images?.length > 0
        ? displayVariant.variant_images
        : (rootProduct.product_images?.length > 0
            ? rootProduct.product_images
            : (Array.isArray(rootProduct.images) ? rootProduct.images : [rootProduct.image || rootProduct.product_image1].filter(Boolean)));

    const images = rawImages.map(img =>
        displayVariant?.variant_images?.includes(img)
            ? getVariantImageUrl(img)
            : getProductImageUrl(img)
    ).filter(Boolean);

    const swiperRef = React.useRef(null);
    const hasMultipleImages = images.length > 1;
    const [isAdded, setIsAdded] = React.useState(false);

    const toggleSelection = useSelectionStore((state) => state.toggleProduct);
    const isSelected = useSelectionStore((state) => {
        const getProductId = (p) => {
            const baseProduct = p.productId ? p.productId : p;
            return String(baseProduct._id || baseProduct.id || p._id || p.id || p.override_id);
        };
        const currentId = getProductId(product);
        return state.selectedProducts.some(p => getProductId(p) === currentId);
    });

    const { mutate: addToWishlist } = useAddToWishlist();
    const { isAuthenticated, user } = useAuth();
    const router = useRouter();

    const { activeProjectId, activeMoodboardName, activeMoodboardId } = useProjectStore();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Check if product is already in the active moodboard
    const { data: moodboardData } = useGetMoodboard(activeMoodboardId);

    // Safety check: ensure productId is mapped properly
    const rawId = rootProduct._id || rootProduct.id;
    const isAlreadyAdded = React.useMemo(() => {
        if (!moodboardData?.data?.estimatedCostId?.productIds) return false;
        const addedIds = moodboardData.data.estimatedCostId.productIds;

        // Handle case where productIds might be populated objects vs raw string IDs
        return addedIds.some(p => {
            const addedId = typeof p === 'object' && p !== null ? (p.productId?._id || p._id) : p;
            return String(addedId) === String(rawId);
        });
    }, [moodboardData, rawId]);

    const activeContextText = isAlreadyAdded
        ? "Added"
        : activeMoodboardName
            ? `Add to ${activeMoodboardName}`
            : "Add to Moodboard";

    const isArchitect = user?.role === 'architect';

    const { data: wishlistData } = useGetWishlist(isAuthenticated);

    const wishlistItems = wishlistData?.data?.data || [];
    const isInWishlist = wishlistItems.some(item =>
        (isVariantCentric && item.product_variant_id?._id === variantItem?._id) ||
        (!isVariantCentric && item.product_id?._id === rootProduct?._id)
    );

    const [isWishlisted, setIsWishlisted] = React.useState(isInWishlist);

    React.useEffect(() => {
        setIsWishlisted(isInWishlist);
    }, [isInWishlist]);

    const { mutate: addToCartBackend } = useAddToCart();
    const { mutate: removeFromCartBackend } = useRemoveFromCart();
    const { data: cartData } = useGetCart(isAuthenticated);

    const guestCart = useCartStore(state => state.cart);
    const cartItems = isAuthenticated ? (cartData?.data || []) : guestCart;

    // Cart matching logic
    const cartItemId = variantItem
        ? `${rootProduct._id}-${variantItem._id}`
        : rootProduct._id;

    const cartItem = cartItems.find(item =>
        isAuthenticated
            ? (isVariantCentric
                ? item.product_variant_id?._id === variantItem?._id
                : item.product_id?._id === rootProduct?._id && !item.product_variant_id)
            : item.cartItemId === cartItemId
    );

    const isInCart = Boolean(cartItem);

    const stock = displayVariant?.stock || 0;
    const isOutOfStock = stock === 0;

    const handleCartToggle = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (!isInCart && isOutOfStock) {
            toast.warning("This product is currently out of stock");
            return;
        }

        if (isInCart) {
            if (isAuthenticated) {
                removeFromCartBackend(cartItem._id);
            } else {
                useCartStore.getState().removeItem(cartItemId);
                toast.success(`${name} removed from cart`);
            }
        } else {
            if (isAuthenticated) {
                addToCartBackend({
                    product_name: name,
                    product_id: rootProduct?._id,
                    product_qty: 1,
                    product_variant_id: variantItem?._id || null,
                    item_or_variant: isVariantCentric ? 'variant' : 'item'
                });
            } else {
                useCartStore.getState().addItem(rootProduct, 1, variantItem);
                toast.success(`${name} added to cart!`);
            }

            setIsAdded(true);
            setTimeout(() => setIsAdded(false), 2000);
        }
    };

    const handleWishlist = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }

        addToWishlist({
            product_id: rootProduct?._id,
            product_variant_id: variantItem?._id || null,
            item_or_variant: isVariantCentric ? 'variant' : 'item'
        });
        setIsWishlisted(true);
    };

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    const comparedProducts = useCompareStore(state => state.comparedProducts);
    const toggleCompare = useCompareStore(state => state.toggleProduct);

    // Use a more robust comparison to ensure IDs match regardless of type
    const isCompared = React.useMemo(() => {
        if (!mounted) return false;
        const currentId = String(product._id || product.id);
        return comparedProducts.some(p => String(p._id || p.id) === currentId);
    }, [comparedProducts, product, mounted]);

    const handleCompareToggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleCompare(product);
    };

    return (
        <div
            className="group relative flex flex-col bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 border border-transparent hover:border-gray-100 p-3"
            onMouseEnter={() => swiperRef.current?.autoplay?.start()}
            onMouseLeave={() => {
                swiperRef.current?.autoplay?.stop()
                swiperRef.current?.slideTo(0)
            }}
        >
            <div className="relative">
                <Link href={`/productdetails/${id}${variantItem ? `?variantId=${variantItem._id}` : ''}`} className="block">
                    <div className="relative aspect-square mb-4 bg-gray-50 rounded-lg overflow-hidden">
                        {images.length > 0 ? (
                            hasMultipleImages ? (
                                <Swiper
                                    modules={[Pagination, Autoplay]}
                                    pagination={{ clickable: true }}
                                    autoplay={{
                                        delay: 1500,
                                        disableOnInteraction: false,
                                    }}
                                    loop={true}
                                    onSwiper={(swiper) => {
                                        swiperRef.current = swiper
                                        swiper.autoplay.stop()
                                    }}
                                    className="h-full w-full product-card-swiper cursor-pointer"
                                >
                                    {images.map((img, idx) => (
                                        <SwiperSlide key={idx}>
                                            <Image
                                                src={img}
                                                alt={name}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                unoptimized
                                            />
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            ) : (
                                <Image
                                    src={images[0] || null}
                                    alt={name}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    unoptimized
                                />
                            )
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        )}

                        {(rootProduct.isNew || rootProduct.newarrivedproduct === "Active" || rootProduct.newarrivedproduct === 1) && (
                            <div className="absolute top-2 left-2 bg-[#e09a74] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm uppercase z-10">
                                New
                            </div>
                        )}
                        {(rootProduct.trendingproduct === "Active" || rootProduct.trendingproduct === 1) && (
                            <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm uppercase z-10">
                                Trending
                            </div>
                        )}
                        {isOutOfStock && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-lg shadow-lg uppercase z-20 text-nowrap">
                                Out of Stock
                            </div>
                        )}
                    </div>
                </Link>

                {isArchitect && (
                    <div className="absolute top-2 left-2 z-20">
                        {isAlreadyAdded ? (
                            <div className="flex items-center justify-center p-1.5 bg-green-50/90 backdrop-blur-sm rounded-lg shadow-sm border border-green-200 cursor-default">
                                <div className="w-5 h-5 rounded border bg-green-500 border-green-500 text-white flex items-center justify-center">
                                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                </div>
                            </div>
                        ) : (
                            <label className="flex items-center justify-center p-1.5 cursor-pointer bg-white/80 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white transition-colors border border-gray-100 group/check">
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        toggleSelection(product);
                                    }}
                                    className="hidden"
                                />
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isSelected
                                    ? 'bg-[#d9a88a] border-[#d9a88a] text-white'
                                    : 'bg-white border-gray-300 text-transparent group-hover/check:border-[#d9a88a]'
                                    }`}>
                                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                </div>
                            </label>
                        )}
                    </div>
                )}
                <div className="absolute bottom-6 left-2 z-20">
                    <div
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        className="inline-block"
                    >
                        <button
                            onClick={handleCompareToggle}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold transition-all shadow-md ${isCompared
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-white/95 text-gray-700 hover:bg-[#e09a74] hover:text-white border border-transparent'
                                }`}
                        >
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${isCompared ? 'bg-green-600 border-green-600' : 'border-gray-400 bg-white/50'}`}>
                                {isCompared && <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />}
                            </div>
                            <span>Compare</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col flex-1 px-3">
                <h4 className="text-[13px] font-semibold text-gray-800 uppercase tracking-wider mb-0.5 group-hover:text-[#e09a74] transition-colors">{name}</h4>
                <h3 className="text-[9px] font-semibold text-gray-400 leading-tight mb-1 ">
                    {(typeof brand === 'object' ? brand.name : brand) || 'Generic'}
                </h3>

                {displayAttrs.length > 0 && (
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 mb-1.5 opacity-80">
                        {displayAttrs.map((attr, idx) => {
                            const isColor = attr.label.toLowerCase() === 'color'
                            const colorCode = isColor ? getColorCode(attr.value) : null

                            return (
                                <span key={idx} className="text-[9px] text-gray-500 font-medium whitespace-nowrap flex items-center gap-1">
                                    {!isColor && <>{attr.label}: </>}
                                    {isColor && colorCode && (
                                        <span
                                            className="w-3 h-3 rounded-full border border-gray-100 shadow-sm"
                                            style={{ backgroundColor: colorCode }}
                                            title={attr.value}
                                        />
                                    )}
                                    {!isColor && <span className="text-gray-800">{attr.value}</span>}
                                    {idx < displayAttrs.length - 1 && <span className="ml-2 text-gray-300">|</span>}
                                </span>
                            )
                        })}
                    </div>
                )}

                <p className="text-[12px] font-normal text-gray-500 mb-2 line-clamp-1">{subtitle}</p>

                <div className="flex items-center gap-2 mb-4">
                    {price && (
                        <span className="text-[14px] font-bold text-[#e09a74]">₹{price.toLocaleString()}</span>
                    )}
                    {mrp && mrp > price && (
                        <>
                            <span className="text-[11px] text-gray-400 line-through">₹{mrp.toLocaleString()}</span>
                            <span className="text-[10px] font-bold text-green-600">-{discountPercentage}%</span>
                        </>
                    )}
                </div>
            </div>

            <div className="px-3 flex gap-2">
                <Button
                    onClick={isOutOfStock && !isInCart ? undefined : handleCartToggle}
                    disabled={isOutOfStock && !isInCart}
                    className={`flex-1 h-9 flex items-center justify-center gap-1.5 rounded-lg border text-[11px] font-medium transition-all duration-300 ${isOutOfStock && !isInCart
                        ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                        : isInCart || isAdded
                            ? 'bg-green-700 hover:border-red-600 text-white font-semibold hover:bg-white hover:text-red-600'
                            : 'bg-[#e09a74] border-[#e09a74] text-white hover:bg-white hover:text-[#e09a74]'
                        }`}
                >
                    {isOutOfStock && !isInCart ? (
                        <span>Out of Stock</span>
                    ) : isInCart || isAdded ? (
                        <><X className="w-3.5 h-3.5" /><span>Remove from Cart</span></>
                    ) : (
                        <><ShoppingCart className="w-3.5 h-3.5" /><span>Add to Cart</span></>
                    )}
                </Button>

                <button
                    onClick={handleWishlist}
                    className={`w-9 h-9 flex items-center justify-center rounded-full border transition-all ${isWishlisted
                        ? 'bg-red-50 border-red-200 text-red-500'
                        : 'bg-white border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-500'
                        }`}
                >
                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
            </div>

            {isArchitect && activeProjectId && (
                <div className="px-3 mt-2">
                    <Button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!isAlreadyAdded) setIsAddModalOpen(true);
                        }}
                        className={`w-full h-8 flex items-center justify-center gap-1.5 rounded-lg border text-[11px] font-medium transition-all ${isAlreadyAdded
                            ? 'bg-green-50 text-green-700 border-green-200 cursor-default'
                            : 'bg-[#2d3142] text-white hover:bg-[#d9a88a]'
                            }`}
                    >
                        {isAlreadyAdded ? <CheckCircle className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>{activeContextText}</span>
                    </Button>
                </div>
            )}

            {isAddModalOpen && (
                <AddToMoodboardModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    product={product}
                />
            )}

            <style jsx global>{`
                .product-card-swiper .swiper-pagination-bullet {
                    width: 6px;
                    height: 6px;
                    background: #fff;
                    opacity: 0.6;
                }
                .product-card-swiper .swiper-pagination-bullet-active {
                    background: #e09a74;
                    opacity: 1;
                    width: 14px;
                    border-radius: 4px;
                }
                .product-card-swiper .swiper-pagination {
                    bottom: 8px !important;
                }
            `}</style>
        </div>
    )
}

export default ProductCard
