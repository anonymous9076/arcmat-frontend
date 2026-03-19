import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useVendorStore } from '@/store/useVendorStore';
import { useCartStore } from '@/store/useCartStore';
import { toast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/useAuth';
import { useAddToCart } from '@/hooks/useCart';
import { ShoppingCart, Check, Heart } from 'lucide-react';

export default function ProductCard({ product }) {
  const { isAuthenticated } = useAuth();
  const { mutate: addToCartBackend } = useAddToCart();
  const { getVendorById } = useVendorStore();
  const vendor = getVendorById(product.vendorId);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const stock = product.stock ?? product.variants?.[0]?.stock;
  const isOutOfStock = (stock !== undefined && stock !== null && stock !== '') ? Number(stock) === 0 : false;

  const discount = product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  return (
    <div className="group relative bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300">
      {/* Image Container */}
      <Link href={`/dashboard/products/${product.slug}`}>
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          {product.images?.[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            // unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-20 h-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Sale Badge */}
          {discount > 0 && (
            <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded">
              Sale
            </div>
          )}

          {/* Favorite Button */}
          {/* <button
            onClick={(e) => {
              e.preventDefault();
              setIsFavorite(!isFavorite);
            }}
            className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
          >
            <svg
              className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'fill-none text-gray-600'}`}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button> */}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        {/* Vendor */}
        {vendor && (
          <p className="text-xs text-gray-500 mb-1">{vendor.name}</p>
        )}

        {/* Product Name */}
        <Link href={`/dashboard/products/${product.slug}`}>
          <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-[#d9a88a] transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl font-bold text-gray-900">
            ${product.price.toFixed(2)}
          </span>
          {product.mrp > product.price && (
            <span className="text-sm text-gray-500 line-through">
              ${product.mrp.toFixed(2)}
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        {/* <button
          onClick={(e) => {
            e.preventDefault();
            if (isOutOfStock) return;
            if (isAuthenticated) {
              addToCartBackend({
                product_name: product.name,
                product_id: product._id,
                product_qty: 1,
                item_or_variant: 'item'
              });
            } else {
              useCartStore.getState().addItem(product);
              toast.success(`${product.name} added to cart!`);
            }
            setIsAdded(true);
            setTimeout(() => setIsAdded(false), 2000);
          }}
          disabled={isOutOfStock}
          className={`w-full border-2 py-2.5 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 ${isOutOfStock
              ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
              : isAdded
                ? 'bg-green-600 border-green-600 text-white'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-[#d9a88a] hover:border-[#d9a88a] hover:text-white'
            }`}
        >
          {isOutOfStock ? (
            'Out of Stock'
          ) : isAdded ? (
            <><Check className="w-5 h-5" /> Added!</>
          ) : (
            <><ShoppingCart className="w-5 h-5" /> Add to Cart</>
          )}
        </button> */}
      </div>
    </div>
  );
}