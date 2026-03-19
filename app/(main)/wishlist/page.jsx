"use client"
import React from 'react'
import Container from "@/components/ui/Container"
import ProductCard from "@/components/cards/ProductCard"
import { useGetWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist'
import { Loader2, HeartBreak, Heart, ShoppingBag, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const WishlistPage = () => {
    const router = useRouter()

    useEffect(() => {
        router.push('/')
    }, [router])

    return null

    const { isAuthenticated, isLoading: authLoading } = useAuth()
    const { data: wishlistData, isLoading, error } = useGetWishlist(isAuthenticated)
    const { mutate: removeFromWishlist } = useRemoveFromWishlist()

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex flex-col bg-white">
                <div className="flex-1 flex flex-col items-center justify-center p-10">
                    <Loader2 className="w-12 h-12 text-[#e09a74] animate-spin mb-4" />
                    <p className="text-gray-500 font-medium animate-pulse text-lg">Curating your favorites...</p>
                </div>
            </div>
        )
    }

    const items = wishlistData?.data?.data || []

    return (
        <div className="min-h-screen bg-[#fafbfc] flex flex-col">
            <main className="flex-1 py-12 md:py-20">
                <Container>
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="p-2 bg-[#fff2ed] rounded-lg">
                                    <Heart className="w-5 h-5 text-[#e09a74] fill-current" />
                                </span>
                                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight italic">My Wishlist</h1>
                            </div>
                            <p className="text-gray-500 font-medium">Your curated selection of premium architectural materials.</p>
                        </div>
                        <div className="text-right">
                            <span className="inline-block px-4 py-1.5 bg-white border border-gray-100 rounded-full text-sm font-semibold text-gray-600 shadow-sm">
                                {items.length} {items.length === 1 ? 'Item' : 'Items'} Saved
                            </span>
                        </div>
                    </div>

                    {items.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                            {items.map((item) => {
                                const dataForCard = item.item_or_variant === 'variant'
                                    ? item.product_variant_id
                                    : item.product_id;

                                if (!dataForCard) return null;

                                return (
                                    <div key={item._id} className="relative group">
                                        <button
                                            onClick={() => removeFromWishlist(item._id)}
                                            className="absolute top-4 right-4 z-20 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
                                            title="Remove from wishlist"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>

                                        <div className="h-full">
                                            <ProductCard product={dataForCard} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="max-w-md mx-auto text-center py-20 px-6 bg-white rounded-3xl border border-dashed border-gray-300 shadow-sm">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Heart className="w-10 h-10 text-gray-200" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-3 italic">Your wishlist is empty</h2>
                            <p className="text-gray-500 mb-8 leading-relaxed">
                                Start exploring our collections and save your favorite architectural materials for later.
                            </p>
                            <Link
                                href="/productlist"
                                className="inline-flex items-center gap-2 bg-black text-white px-8 py-3.5 rounded-full font-bold hover:bg-gray-800 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                            >
                                <ShoppingBag className="w-5 h-5" />
                                Browse Products
                            </Link>
                        </div>
                    )}
                </Container>
            </main>

            <style jsx global>{`
                .italic { font-style: italic; }
            `}</style>
        </div>
    )
}

export default WishlistPage
