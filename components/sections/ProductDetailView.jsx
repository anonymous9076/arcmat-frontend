"use client"
import React, { useState, useEffect, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Thumbs, FreeMode } from 'swiper/modules'
import Button from '@/components/ui/Button'
import Accordion from '@/components/ui/Accordion'
import RequestInfo from './RequestInfo'
import RequestSampleModal from './RequestSampleModal'
import Link from 'next/link'
import Modal from '@/components/ui/ProductDetailPageModal'
import Container from '../ui/Container'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/thumbs'
import 'swiper/css/free-mode'
import { ShoppingCart, Check, Heart, User, Package, ExternalLink, MapPin } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import { useAddToCart } from '@/hooks/useCart'
import { toast } from '@/components/ui/Toast';
import { getProductImageUrl, getVariantImageUrl, getColorCode, resolvePricing, calculateDiscount, getSpecifications, formatNumber, formatCurrency } from '@/lib/productUtils'
import { useAddToWishlist, useGetWishlist } from '@/hooks/useWishlist'
import { useAuth } from '@/hooks/useAuth'
import { useCreateNotification } from '@/hooks/useNotification'
import { useGetProjects, useCreateProject } from '@/hooks/useProject'
import { useCreateRetailerRequest } from '@/hooks/useRetailerRequest'

const ProductDetailView = ({ product, initialVariantId, categories = [], childCategories = [] }) => {
    const [thumbsSwiper, setThumbsSwiper] = useState(null)
    const [isAdded, setIsAdded] = useState(false)
    const [isWishlisted, setIsWishlisted] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [activeRequest, setActiveRequest] = useState({})
    const [quantity, setQuantity] = useState(1)
    const [mounted, setMounted] = useState(false)
    const [isRequestingContact, setIsRequestingContact] = useState(false)
    const [isSampleModalOpen, setIsSampleModalOpen] = useState(false)
    const [selectedProject, setSelectedProject] = useState(null)
    const [showProjectSelector, setShowProjectSelector] = useState(false)
    const [showSampleProjectSelector, setShowSampleProjectSelector] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const router = useRouter()
    const pathname = usePathname()

    const [selectedVariant, setSelectedVariant] = useState(null)
    const [selectedAttributes, setSelectedAttributes] = useState({})

    const { user, isAuthenticated } = useAuth()
    const isArchitect = user?.role === 'architect'
    const { data: wishlistData } = useGetWishlist(isAuthenticated)
    const { data: projectsData } = useGetProjects({ enabled: isArchitect })
    const projects = projectsData?.data?.data || []

    const { mutate: addToCartBackend } = useAddToCart();
    const { mutate: createNotification } = useCreateNotification()


    const isInWishlist = React.useMemo(() => {
        const wishlistItems = wishlistData?.data?.data || []
        return wishlistItems.some(item =>
            (selectedVariant && item.product_variant_id?._id === selectedVariant?._id) ||
            (!selectedVariant && item.product_id?._id === product?._id)
        )
    }, [wishlistData, selectedVariant, product])

    useEffect(() => {
        setIsWishlisted(isInWishlist)
    }, [isInWishlist])

    if (!product) return null

    const variants = product.variants || []
    const hasVariants = variants.length > 0

    const availableAttributes = React.useMemo(() => {
        if (!hasVariants) return []
        const keysMap = new Map()
        variants.forEach(v => {
            if (v.dynamicAttributes && Array.isArray(v.dynamicAttributes)) {
                v.dynamicAttributes.forEach(attr => {
                    if (attr.key) {
                        const low = attr.key.toLowerCase()
                        if (!keysMap.has(low)) keysMap.set(low, attr.key)
                    }
                })
            }
            ['color', 'size', 'weight'].forEach(k => {
                if (v[k]) {
                    const low = k.toLowerCase()
                    if (!keysMap.has(low)) keysMap.set(low, k)
                }
            })
        })
        return Array.from(keysMap.values())
    }, [variants, hasVariants])

    React.useEffect(() => {
        if (hasVariants && !selectedVariant) {
            const defaultVariant = (initialVariantId && variants.find(v => v._id === initialVariantId)) ||
                variants.find(v => v.status === 1) ||
                variants[0]
            if (defaultVariant) {
                setSelectedVariant(defaultVariant)
                const initialAttrs = {}
                availableAttributes.forEach(key => {
                    const dynAttr = defaultVariant.dynamicAttributes?.find(a => a.key === key)
                    if (dynAttr) {
                        initialAttrs[key] = dynAttr.value
                    } else if (defaultVariant[key]) {
                        initialAttrs[key] = defaultVariant[key]
                    }
                })
                setSelectedAttributes(initialAttrs)
            }
        }
    }, [hasVariants, product, initialVariantId, variants, availableAttributes, selectedVariant])

    useEffect(() => {
        if (selectedVariant?._id) {
            const params = new URLSearchParams(window.location.search)
            params.set('variantId', selectedVariant._id)
            router.replace(`${pathname}?${params.toString()}`, { scroll: false })
        }
    }, [selectedVariant?._id, pathname, router])

    const handleAttributeSelect = (key, value) => {
        const newAttributes = { ...selectedAttributes, [key]: value }
        setSelectedAttributes(newAttributes)

        const matchingVariant = variants.find(v => {
            return availableAttributes.every(attrKey => {
                const targetValue = attrKey === key ? value : newAttributes[attrKey]
                if (!targetValue) return true

                const dynAttr = v.dynamicAttributes?.find(a => a.key === attrKey)
                if (dynAttr) return dynAttr.value === targetValue

                return v[attrKey] === targetValue
            })
        })

        if (matchingVariant) {
            setSelectedVariant(matchingVariant)
        }
    }

    const handleVariantSelect = (v) => {
        setSelectedVariant(v)
        const newAttrs = {}
        availableAttributes.forEach(key => {
            const dynAttr = v.dynamicAttributes?.find(a => a.key === key)
            if (dynAttr) {
                newAttrs[key] = dynAttr.value
            } else if (v[key]) {
                newAttrs[key] = v[key]
            }
        })
        setSelectedAttributes(newAttrs)
    }

    const handleOpenModal = (requestType) => {
        setActiveRequest(requestType)
        setIsModalOpen(true)
    }

    // Pricing Logic
    const { price, mrp, hasPrice } = resolvePricing(product, selectedVariant)
    const discountPercentage = calculateDiscount(mrp, price)

    const currentItem = selectedVariant || product
    const name = product.product_name || product.name
    const description = product.description
    const subtitle = product.subtitle || (description ? description.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...' : '')
    const stockQuantity = Number(currentItem.stock || currentItem.available_stock || 0)
    const isActive = currentItem.status === 1 || currentItem.status === '1' || currentItem.status === 'Active'
    const inStock = isActive && stockQuantity > 0
    const isPurchasable = hasPrice && inStock
    const isPremium = product.featuredproduct === 'Active'
    const vendorName = product.createdBy?.name

    const isFromVariant = Boolean(selectedVariant?.variant_images?.length)
    const rawImages = isFromVariant
        ? selectedVariant.variant_images
        : (product.product_images?.length ? product.product_images : (Array.isArray(product.images) ? product.images : [product.image || product.product_image1].filter(Boolean)))

    const images = rawImages.filter(Boolean).map(img => isFromVariant ? getVariantImageUrl(img) : getProductImageUrl(img))
    const displayImages = images.length ? images : ['/Icons/arcmatlogo.svg']

    const handleAddToCart = () => {
        if (!inStock) {
            toast.warning("This product is currently out of stock");
            return;
        }

        if (!isPurchasable) return;

        if (isAuthenticated) {
            addToCartBackend({
                product_name: product.product_name,
                product_id: product._id,
                product_qty: quantity,
                product_variant_id: selectedVariant?._id || null,
                item_or_variant: selectedVariant ? 'variant' : 'item'
            });
        } else {
            useCartStore.getState().addItem(product, quantity, selectedVariant);
            toast.success("Item added to cart")
        }

        setIsAdded(true)
        setTimeout(() => setIsAdded(false), 2000)
    }

    const { mutate: addToWishlist } = useAddToWishlist()

    const handleAddToWishlist = () => {
        if (!isAuthenticated) {
            router.push('/auth/login')
            return
        }

        addToWishlist({
            product_id: product._id,
            product_variant_id: selectedVariant?._id || null,
            item_or_variant: selectedVariant ? 'variant' : 'item'
        })
        setIsWishlisted(true)
    }

    const { mutate: createRetailerRequest } = useCreateRetailerRequest()

    const resolveId = (val) => {
        if (!val) return null;
        return typeof val === 'object' ? (val._id || val.id) : val;
    };

    const currentRetailerId = useMemo(() => {
        return selectedVariant?.isRetailerManaged ? (resolveId(selectedVariant?.retailerId) || resolveId(selectedVariant?.retailer_id)) : 
               product.isRetailerDetail ? (resolveId(product.retailerId) || resolveId(product.retailer_id)) : 
               null;
    }, [selectedVariant, product]);

    const handleRequestContact = async () => {
        if (!selectedProject && projects.length > 0) {
            setShowProjectSelector(true)
            return
        }

        setIsRequestingContact(true)

        const projectId = selectedProject?._id;
        const cityName = selectedProject?.location || "Gurgaon";

        console.log('Creating Retailer Request with data:', {
            projectId,
            materialId: product._id,
            retailerId: currentRetailerId,
            city: cityName
        });

        createRetailerRequest({
            projectId,
            materialId: product._id,
            materialName: name,
            retailerId: currentRetailerId,
            city: cityName,
            notes: `Architect is interested in using ${name} for project ${selectedProject?.name || 'a project'}.`
        }, {
            onSuccess: () => {
                // Also send a real-time notification
                if (currentRetailerId) {
                    createNotification({
                        recipient: currentRetailerId,
                        type: 'RETAILER_CONTACT_REQUEST',
                        message: `An architect is using ${name} for a project in ${cityName}. Your contact may be shared with the architect.`,
                        actionStatus: 'pending',
                        relatedData: {
                            productId: product._id,
                            projectId: selectedProject?._id,
                            city: cityName
                        }
                    });
                }
                setShowProjectSelector(false);
            },
            onSettled: () => setIsRequestingContact(false)
        });
    }

    // Specifications
    const finalSpecifications = getSpecifications(product, selectedVariant)
    const displayWeight = selectedVariant?.weight
        ? `${selectedVariant.weight} ${selectedVariant.weight_type || selectedVariant.weight_unit || 'kg'}`
        : (product.weight ? `${product.weight} ${product.weight_type || 'kg'}` : null)

    const showPrimaryAddToCart = isPurchasable
    const showOutOfStockQuote = !isPurchasable

    return (
        <section className="bg-white py-8 md:py-6">
            <Container>
                <div className="flex flex-col">

                    {/* Breadcrumbs */}
                    <nav className="flex text-sm text-gray-500 mb-2 overflow-x-auto no-scrollbar whitespace-nowrap">
                        <Link href="/" className="hover:text-[#e09a74] transition-colors">Home</Link>
                        <span className="mx-2">/</span>
                        <Link href="/productlist" className="hover:text-[#e09a74] transition-colors">Products</Link>
                        {categories && categories.length > 0 && (
                            <>
                                <span className="mx-2">/</span>
                                <span className="text-gray-900 font-medium">
                                    {categories[categories.length - 1].name}
                                </span>
                            </>
                        )}
                    </nav>

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 py-4 md:py-8 lg:py-10 border-b border-gray-200">

                        {/* LEFT: Images */}
                        <div className="space-y-4">
                            <div className="relative aspect-4/3 bg-white rounded-none overflow-hidden">
                                {!mounted ? (
                                    <div className="w-full h-full bg-gray-50 animate-pulse" />
                                ) : images.length > 1 ? (
                                    <Swiper
                                        key={selectedVariant?._id || 'main'}
                                        modules={[Navigation, Pagination, Thumbs]}
                                        navigation
                                        pagination={{ clickable: true }}
                                        thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                                        className="h-full w-full product-detail-swiper"
                                    >
                                        {displayImages.map((img, idx) => (
                                            <SwiperSlide key={idx}>
                                                <div className="relative w-full h-full">
                                                    <Image
                                                        src={img || '/Icons/arcmatlogo.svg'}
                                                        alt={`${name || 'Product'} - Image ${idx + 1}`}
                                                        fill
                                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                                                        className="object-contain"
                                                        priority={idx === 0}
                                                    />
                                                </div>
                                            </SwiperSlide>
                                        ))}
                                    </Swiper>
                                ) : (
                                    <div className="relative w-full h-full">
                                        <Image
                                            src={displayImages[0] || '/Icons/arcmatlogo.svg'}
                                            alt={name || "Product Image"}
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                                            className="object-contain"
                                            priority
                                        />
                                    </div>
                                )}
                            </div>
                            {mounted && images.length > 1 && (
                                <Swiper
                                    key={selectedVariant?._id || 'thumbs-main'}
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
                            )}
                        </div>

                        {/* RIGHT: Product Info */}
                        <div className="flex flex-col">
                            <div className="flex-1 flex flex-col">
                                <div className="mb-4">
                                    {product.brand && (
                                        <Link href="#" className="text-2xl font-extrabold text-gray-600 hover:text-[#e09a74] transition-colors mb-2 inline-block">
                                            {(product.brand && typeof product.brand === 'object') ? (product.brand.name || product.brand.brand_name) : (product.brand || 'Arcmat')}
                                        </Link>
                                    )}
                                    {/* BADGES SECTION */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {isPremium && (
                                            <span className="px-3 py-1 bg-[#fff2ed] text-[#e09a74] text-[10px] font-bold tracking-wider uppercase rounded-md">
                                                PREMIUM
                                            </span>
                                        )}
                                        {vendorName && (
                                            <span className="px-3 py-1 bg-[#f3f4f6] text-[#6b7280] text-[10px] font-bold tracking-wider uppercase rounded-md">
                                                BY {vendorName}
                                            </span>
                                        )}
                                        <span className={`px-3 py-1 ${inStock ? 'bg-[#ecfdf5] text-[#059669]' : 'bg-[#fbfafa] text-[#00ff04]'} text-[10px] font-bold tracking-wider uppercase rounded-md`}>
                                            {inStock ? 'IN STOCK' : 'LISTED'}
                                        </span>
                                    </div>
                                    {hasVariants && selectedVariant && (
                                        <div className="text-sm py-1 text-gray-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                                            <span>SKU: {selectedVariant.skucode || selectedVariant._id}</span>
                                            {availableAttributes.map(key => {
                                                const val = selectedAttributes[key]
                                                if (!val) return null
                                                return (
                                                    <React.Fragment key={key}>
                                                        <span className="text-gray-300">|</span>
                                                        <span className="capitalize">{key}: <span className="text-gray-700 font-medium">{val}</span></span>
                                                    </React.Fragment>
                                                )
                                            })}
                                        </div>
                                    )}
                                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-tight">{name}</h1>
                                    <p className="text-base text-gray-700 leading-relaxed mb-4">{subtitle}</p>

                                    {/* VARIANT PICKER (THUMBNAILS) */}
                                    {hasVariants && (
                                        <div className="mt-4 mb-6">
                                            <h4 className="text-sm font-semibold text-gray-900 mb-3">Available Variants</h4>
                                            <div className="flex flex-wrap gap-3">
                                                {variants.map((v, idx) => {
                                                    const hasVariantImg = v.variant_images?.length > 0
                                                    const img = hasVariantImg
                                                        ? getVariantImageUrl(v.variant_images[0])
                                                        : displayImages[0];
                                                    const isSelected = selectedVariant?._id === v._id;
                                                    const variantColor = v.color || v.dynamicAttributes?.find(a => a.key?.toLowerCase() === 'color')?.value
                                                    const variantColorCode = variantColor ? getColorCode(variantColor) : null

                                                    return (
                                                        <button
                                                            key={v._id || idx}
                                                            onClick={() => handleVariantSelect(v)}
                                                            className={`group relative w-16 h-16 rounded-xl border-2 transition-all p-1 bg-white ${isSelected
                                                                ? 'border-[#e09a74] ring-2 ring-[#e09a74]/20 shadow-sm'
                                                                : 'border-gray-100 hover:border-gray-300'
                                                                }`}
                                                        >
                                                            <div className="relative w-full h-full rounded-lg overflow-hidden flex items-center justify-center bg-gray-50">
                                                                {!hasVariantImg && variantColorCode ? (
                                                                    <div
                                                                        className="w-full h-full transition-transform group-hover:scale-110 duration-300"
                                                                        style={{ backgroundColor: variantColorCode }}
                                                                    />
                                                                ) : (
                                                                    <Image
                                                                        src={img}
                                                                        alt={`Variant ${idx + 1}`}
                                                                        fill
                                                                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                                                                    />
                                                                )}
                                                            </div>
                                                            {isSelected && (
                                                                <div className="absolute -top-1.5 -right-1.5 bg-[#e09a74] text-white w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm scale-110">
                                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="w-2.5 h-2.5">
                                                                        <polyline points="20 6 9 17 4 12" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* ATTRIBUTE SELECTORS */}
                                    {hasVariants && (
                                        <div className="mt-4 mb-6 space-y-4">
                                            {availableAttributes.map(attrKey => {
                                                const uniqueValues = [...new Set(variants.map(v => {
                                                    const dynAttr = v.dynamicAttributes?.find(a => a.key === attrKey)
                                                    return dynAttr ? dynAttr.value : v[attrKey]
                                                }).filter(Boolean))]

                                                if (uniqueValues.length === 0) return null

                                                return (
                                                    <div key={attrKey}>
                                                        <h4 className="text-sm font-medium text-gray-900 mb-2 capitalize">
                                                            {attrKey.toLowerCase() === 'color' ? 'Select Color' : `${attrKey}:`}
                                                        </h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {uniqueValues.map(value => {
                                                                const isSelected = selectedAttributes[attrKey] === value

                                                                // Dependent Selection: Check if this value is compatible with other current selections
                                                                const isCompatible = variants.some(v => {
                                                                    const dynAttr = v.dynamicAttributes?.find(a => a.key === attrKey)
                                                                    const currentVal = dynAttr ? dynAttr.value : v[attrKey]

                                                                    return currentVal === value &&
                                                                        availableAttributes.every(ak => {
                                                                            if (ak === attrKey || !selectedAttributes[ak]) return true
                                                                            const otherDynAttr = v.dynamicAttributes?.find(a => a.key === ak)
                                                                            const otherVal = otherDynAttr ? otherDynAttr.value : v[ak]
                                                                            return otherVal === selectedAttributes[ak]
                                                                        })
                                                                })

                                                                if (attrKey.toLowerCase() === 'color') {
                                                                    // Color Swatch style
                                                                    const colorCode = getColorCode(value)
                                                                    const isWhite = value.toLowerCase() === 'white'

                                                                    return (
                                                                        <button
                                                                            key={value}
                                                                            onClick={() => handleAttributeSelect(attrKey, value)}
                                                                            disabled={!isCompatible}
                                                                            className={`
                                                                                relative flex items-center justify-center w-10 h-10 rounded-full border transition-all
                                                                                ${isSelected
                                                                                    ? 'border-[#e09a74] ring-2 ring-[#e09a74]/20 shadow-sm'
                                                                                    : isCompatible
                                                                                        ? 'border-gray-200 hover:border-gray-400'
                                                                                        : 'border-gray-100 cursor-not-allowed opacity-50'
                                                                                }
                                                                            `}
                                                                            title={value}
                                                                        >
                                                                            <span
                                                                                className={`w-7 h-7 rounded-full border ${isWhite ? 'border-gray-200' : 'border-transparent'}`}
                                                                                style={{ backgroundColor: colorCode }}
                                                                            />
                                                                            {isSelected && (
                                                                                <div className="absolute inset-0 rounded-full border-2 border-[#e09a74] -m-[2px]" />
                                                                            )}
                                                                        </button>
                                                                    )
                                                                }

                                                                // Default Button style for Size/Weight etc
                                                                return (
                                                                    <button
                                                                        key={value}
                                                                        onClick={() => handleAttributeSelect(attrKey, value)}
                                                                        disabled={!isCompatible}
                                                                        className={`
                                                                            px-4 py-2 rounded-lg text-sm border transition-all
                                                                            ${isSelected
                                                                                ? 'border-[#e09a74] bg-[#fffbf9] text-[#e09a74] font-medium'
                                                                                : isCompatible
                                                                                    ? 'border-gray-200 text-gray-600 hover:border-gray-300'
                                                                                    : 'border-gray-100 text-gray-300 cursor-not-allowed opacity-50'
                                                                            }
                                                                        `}
                                                                    >
                                                                        {value}
                                                                        {attrKey === 'weight' && ` ${variants.find(v => v.weight === value)?.weight_type || ''}`}
                                                                    </button>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {/* PRICE SECTION */}
                                    {hasPrice ? (
                                        <div className="mt-5 border-t border-dashed border-gray-200 pt-5">
                                            <div className="flex items-baseline gap-3 flex-wrap">
                                                <span className="text-3xl md:text-4xl font-bold text-gray-900">
                                                    {formatCurrency(price)}
                                                </span>
                                                {discountPercentage > 0 && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg text-gray-400 line-through decoration-gray-300">
                                                            {formatCurrency(mrp)}
                                                        </span>
                                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200 uppercase tracking-wider">
                                                            {discountPercentage}% OFF
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            {discountPercentage > 0 && (
                                                <p className="text-[10px] text-green-600 font-medium mt-1 uppercase tracking-tight">
                                                    You save {formatCurrency(Number(mrp) - Number(price))}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="mt-5 border-t border-dashed border-gray-200 pt-5">
                                            <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
                                                <span className="text-lg font-semibold text-gray-600">Price on Request</span>
                                                <p className="text-xs text-gray-400 mt-1">Contact us for specialized pricing and bulk orders.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2 mb-4">
                                    {/* PRIMARY COMMERCE ACTIONS */}
                                    {showPrimaryAddToCart && (
                                        <Button
                                            text={isAdded ? "ADDED TO CART" : "ADD TO CART"}
                                            onClick={handleAddToCart}
                                            className={`w-full ${isAdded ? "bg-green-600 text-white" : "bg-[#e09a74]/80 text-white hover:bg-[#e09a74]"} font-bold py-3 px-5 rounded-full text-sm transition-all flex items-center justify-center gap-2 shadow-sm`}
                                            icon={isAdded ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                                        />
                                    )}

                                    {mounted && isArchitect && (
                                        <div className="flex flex-col gap-2">
                                            {/* Request Sample Action */}
                                            <Button
                                                text="REQUEST SAMPLE"
                                                onClick={() => {
                                                    if (!selectedProject && projects.length > 0) {
                                                        setShowSampleProjectSelector(true)
                                                    } else {
                                                        setIsSampleModalOpen(true)
                                                    }
                                                }}
                                                className="w-full bg-[#2d3142] text-white hover:bg-black py-3 px-5 rounded-full text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                                                icon={<Package className="w-4 h-4" />}
                                            />

                                            {showSampleProjectSelector && (
                                                <div className="mt-1 p-3 bg-gray-50 rounded-xl border border-gray-100 animate-in fade-in slide-in-from-top-2 shadow-inner">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 text-center">Select project to request sample for</p>
                                                    <div className="flex flex-col gap-1 max-h-32 overflow-y-auto no-scrollbar">
                                                        {projects.map(p => (
                                                            <button
                                                                key={p._id}
                                                                onClick={() => {
                                                                    setSelectedProject(p);
                                                                    setShowSampleProjectSelector(false);
                                                                    setIsSampleModalOpen(true);
                                                                }}
                                                                className={`text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${selectedProject?._id === p._id ? 'bg-[#e09a74] text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                                                            >
                                                                {p.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <Button
                                                text={isRequestingContact ? "SENDING REQUEST..." : "REQUEST RETAILER CONTACT"}
                                                onClick={handleRequestContact}
                                                disabled={isRequestingContact}
                                                className="w-full bg-[#e09a74]/80 text-white hover:bg-[#e09a74] py-3 px-5 rounded-full text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                                                icon={<User className="w-4 h-4" />}
                                            />

                                            {showProjectSelector && projects.length > 0 && (
                                                <div className="mt-1 p-3 bg-gray-50 rounded-xl border border-gray-100 animate-in fade-in slide-in-from-top-2 shadow-inner">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Select Project for Context</p>
                                                    <div className="flex flex-col gap-1 max-h-32 overflow-y-auto no-scrollbar">
                                                        {projects.map(p => (
                                                            <button
                                                                key={p._id}
                                                                onClick={() => setSelectedProject(p)}
                                                                className={`text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${selectedProject?._id === p._id ? 'bg-[#e09a74] text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                                                            >
                                                                {p.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <button
                                                        onClick={handleRequestContact}
                                                        disabled={!selectedProject || isRequestingContact}
                                                        className="w-full mt-3 py-2 bg-[#e09a74] text-white rounded-lg text-xs font-bold disabled:opacity-50 transition-all hover:bg-[#d98b63] shadow-sm"
                                                    >
                                                        Confirm Request
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* FALLBACK PRIMARY ACTIONS */}
                                    {showOutOfStockQuote && (
                                        <Button
                                            text="REQUEST QUOTATION"
                                            className="w-full bg-black text-white py-3 px-5 rounded-full text-sm font-bold shadow-sm"
                                            onClick={() => handleOpenModal({ priceList: true, contactRepresentative: true })}
                                        />
                                    )}

                                    {/* SECONDARY INFO ACTIONS - COMPACT GRID */}
                                    <div className="mt-2 grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => handleOpenModal({ catalogue: true, contactRepresentative: true })}
                                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-[11px] font-bold transition-all bg-[#e09a74]/5 text-[#e09a74] border border-[#e09a74]/20 hover:bg-[#e09a74]/10"
                                        >
                                            <Package className="w-3.5 h-3.5" /> CATALOGUE
                                        </button>
                                        <button
                                            onClick={() => handleOpenModal({ bimCad: true })}
                                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-[11px] font-bold transition-all bg-[#e09a74]/5 text-[#e09a74] border border-[#e09a74]/20 hover:bg-[#e09a74]/10"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" /> BIM / CAD
                                        </button>
                                        {/* {!showOutOfStockQuote && (
                                            <button
                                                onClick={() => handleOpenModal({ retailersList: true })}
                                                className="col-span-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-[11px] font-bold transition-all bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100"
                                            >
                                                <MapPin className="w-3.5 h-3.5" /> VIEW NEARBY RETAILERS
                                            </button>
                                        )} */}
                                    </div>
                                </div>

                                <button
                                    onClick={handleAddToWishlist}
                                    className={`
                                            w-full py-2.5 rounded-full text-sm font-medium transition-all flex items-center justify-center gap-2 border
                                            ${isWishlisted
                                            ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                            : 'bg-white text-[#e09a74] border-[#e09a74]/20 hover:bg-[#e09a74]/10'
                                        }
                                        `}>
                                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                                    {isWishlisted ? 'SAVED TO WISHLIST' : 'ADD TO WISHLIST'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 py-4">
                        <div className="flex flex-col gap-8">
                            {/* Overview */}
                            <section className="bg-white rounded-xl border border-gray-100 p-5">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Overview</h3>
                                <div className="text-sm md:text-base text-gray-600 leading-relaxed whitespace-pre-line wrap-break-word overflow-hidden"
                                    dangerouslySetInnerHTML={{ __html: description || `Premium quality ${subtitle?.toLowerCase() || ''} from ${(product.brand && typeof product.brand === 'object') ? (product.brand.name || product.brand.brand_name) : (product.brand || 'Arcmat')}.` }}
                                />
                            </section>

                            {/* Specifications */}
                            {finalSpecifications.length > 0 && (
                                <section className="bg-white rounded-xl border border-gray-100 p-5">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h3>
                                    <div className="space-y-3">
                                        {finalSpecifications.map((attr, idx) => (
                                            <div key={idx} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 border-b last:border-b-0 pb-2">
                                                <span className="sm:w-1/3 text-sm font-medium text-gray-700">{attr.label}</span>
                                                <span className="sm:w-2/3 text-sm text-gray-600">{attr.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Key Features */}
                            <section className="bg-white rounded-xl border border-gray-100 p-5">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Features</h3>
                                <ul className="space-y-2">
                                    {(product.keyFeatures || [
                                        'Premium high-quality construction',
                                        'Easy installation & minimal maintenance',
                                        'Versatile application support',
                                        'Multiple aesthetic variants',
                                    ]).map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-3 text-sm text-gray-600">
                                            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-gray-400" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            {/* Accordion */}
                            <section className="bg-white rounded-xl border border-gray-100 p-2">
                                <Accordion items={[
                                    {
                                        title: 'Shipping & Dimensions', content: <div className="space-y-4 p-3">
                                            <ul className="space-y-2">
                                                {(product.dimensions || ['Standard sizing applies', 'Contact brand for custom dimensions']).map((dim, idx) => (
                                                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-600">
                                                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-gray-400" />{dim}
                                                    </li>
                                                ))}
                                            </ul>
                                            {displayWeight && (
                                                <div className="flex justify-between items-center text-sm p-3 rounded-lg bg-blue-50 border border-blue-100">
                                                    <span className="font-semibold text-blue-700">Estimated Weight</span>
                                                    <span className="text-blue-900">{displayWeight}</span>
                                                </div>
                                            )}
                                        </div>
                                    },
                                    {
                                        title: 'Materials & Tags', content: <div className="flex flex-wrap gap-2 p-3">
                                            {(product.tags || product.category_name || 'Arcmat Collection').split(',').map((tag, idx) => (
                                                <span key={idx} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-100 hover:bg-[#e09a74] hover:text-white transition cursor-pointer">
                                                    #{tag.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    }, {
                                        title: 'BIM/CAD Files',
                                        content: (
                                            <div className="flex flex-wrap gap-2 p-3">
                                                <a
                                                    href="/download/demo.dwg"
                                                    download
                                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-yellow-50 text-gray-600 border border-gray-100 hover:bg-[#e09a74] hover:text-white transition cursor-pointer"
                                                >
                                                    2D CAD (.dwg)
                                                </a>
                                                <a
                                                    href="/download/demo.obj"
                                                    download
                                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-yellow-50 text-gray-600 border border-gray-100 hover:bg-[#e09a74] hover:text-white transition cursor-pointer"
                                                >
                                                    3D Model (.obj)
                                                </a>
                                                <a
                                                    href="/download/demo.rfa"
                                                    download
                                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-yellow-50 text-gray-600 border border-gray-100 hover:bg-[#e09a74] hover:text-white transition cursor-pointer"
                                                >
                                                    BIM Object (.rfa)
                                                </a>
                                            </div>
                                        )
                                    }

                                ]} />
                            </section>
                        </div>

                        {/* RIGHT Column */}
                        <aside className="lg:sticky lg:top-24 h-fit">
                            <RequestInfo product={product} />
                        </aside>
                    </div>

                    {/* Request Sample Modal */}
                    <RequestSampleModal 
                        isOpen={isSampleModalOpen}
                        onClose={() => setIsSampleModalOpen(false)}
                        product={product}
                        projectId={selectedProject?._id}
                        retailerId={currentRetailerId}
                    />

                    {/* GLOBAL SWIPER STYLES */}
                    <style jsx global>{`
                        .product-detail-swiper .swiper-button-next,
                        .product-detail-swiper .swiper-button-prev {
                        color: #666;
                        background: white;
                        width: 36px;
                        height: 36px;
                        border-radius: 50%;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                        }
                        .product-detail-swiper .swiper-button-next:after,
                        .product-detail-swiper .swiper-button-prev:after {
                        font-size: 14px;
                        font-weight: bold;
                        }
                        .product-detail-swiper .swiper-pagination-bullet {
                        width: 8px;
                        height: 8px;
                        background: #d1d5db;
                        opacity: 1;
                        }
                        .product-detail-swiper .swiper-pagination-bullet-active {
                        background: #333;
                        width: 20px;
                        border-radius: 4px;
                        }
                        .product-thumbs-swiper .swiper-slide-thumb-active .relative {
                        border-color: #333 !important;
                        }
                    `}</style>
                </div>
            </Container>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <RequestInfo
                    product={product}
                    initialRequest={activeRequest}
                    onClose={() => setIsModalOpen(false)}
                    isModal={true}
                />
            </Modal>
        </section >
    )
}

export default ProductDetailView
