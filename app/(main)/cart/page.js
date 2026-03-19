"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import Container from "@/components/ui/Container";
import BackLink from "@/components/ui/BackLink";
import EmptyCart from "@/components/cart/EmptyCart";
import CartItem from "@/components/cart/CartItem";
import OrderSummary from "@/components/cart/OrderSummary";
import { useAuth } from "@/hooks/useAuth";
import { useCartStore } from "@/store/useCartStore";
import { useGetCart, useUpdateCartQuantity, useRemoveFromCart } from "@/hooks/useCart";
import { useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CartPage() {
    const router = useRouter();

    useEffect(() => {
        router.push('/');
    }, [router]);

    return null; // or a loading/redirecting message

    const { isAuthenticated } = useAuth();
    const { data: backendCart, isLoading: isBackendLoading } = useGetCart(isAuthenticated);
    const localCart = useCartStore(state => state.cart);
    const { mutate: updateBackendQty } = useUpdateCartQuantity();
    const { mutate: removeBackendItem } = useRemoveFromCart();

    const removeItem = useCartStore(state => state.removeItem);
    const updateQuantity = useCartStore(state => state.updateQuantity);

    const items = useMemo(() => {
        if (isAuthenticated) {
            return backendCart?.data || [];
        }
        return localCart;
    }, [isAuthenticated, backendCart, localCart]);

    const cartTotals = useMemo(() => {
        if (isAuthenticated && backendCart) {
            return {
                subtotal: backendCart.total_Amount_with_discount_subtotal || 0,
                shipping: backendCart.shipping_charges || 0,
                total: backendCart.total_Amount_with_discount || 0,
                discount: backendCart.totalDiscount || 0
            };
        }

        const subtotal = localCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = subtotal > 1000 ? 0 : (subtotal * 0.15); // Consistent with backend 15%
        const total = subtotal + shipping;

        return {
            subtotal,
            shipping,
            total,
            discount: localCart.reduce((sum, item) => sum + ((item.mrp - item.price) * item.quantity), 0)
        };
    }, [isAuthenticated, backendCart, localCart]);

    const handleUpdateQuantity = (id, newQuantity) => {
        if (newQuantity < 1) return;
        if (isAuthenticated) {
            updateBackendQty({ cart_id: id, product_qty: newQuantity });
        } else {
            updateQuantity(id, newQuantity);
        }
    };

    const handleRemoveItem = (id) => {
        if (isAuthenticated) {
            removeBackendItem(id);
        } else {
            removeItem(id);
        }
    };

    if (isBackendLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (items.length === 0) {
        return <EmptyCart />;
    }

    return (
        <div className="min-h-screen bg-linear-to-b from-white to-gray-50 py-6 sm:py-12">
            <Container>
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <BackLink
                        href="/productlist"
                        label="Continue Shopping"
                        className="mb-3 sm:mb-4"
                    />
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">Shopping Cart</h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">{items.length} items in your cart</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-3 sm:space-y-4">
                        {items.map((item) => (
                            <CartItem
                                key={isAuthenticated ? item._id : item.cartItemId}
                                item={item}
                                isAuth={isAuthenticated}
                                onUpdateQuantity={handleUpdateQuantity}
                                onRemove={handleRemoveItem}
                            />
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <OrderSummary
                            subtotal={cartTotals.subtotal}
                            shipping={cartTotals.shipping}
                            total={cartTotals.total}
                            discount={cartTotals.discount}
                        />
                    </div>
                </div>
            </Container>
        </div>
    );
}
