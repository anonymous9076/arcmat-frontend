/**
 * Generates a URL-friendly slug from a string.
 */
export const generateSlug = (text) => {
    if (!text) return '';
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
};

/**
 * Formats a string as an uppercase SKU.
 */
export const formatSKU = (text) => {
    if (!text) return '';
    return text.toUpperCase().trim().replace(/\s+/g, '-');
};

/**
 * Universal helper to resolve image URLs.
 * Handles:
 * 1. Cloudinary objects: { public_id, secure_url }
 * 2. Absolute URLs: http://... or https://...
 * 3. Data URLs: data:...
 * 4. Absolute paths: /...
 * 5. Legacy relative paths: "filename.jpg" or "brandId/filename.jpg"
 * 
 * @param {string|object} image - The image path or object
 * @param {string} folder - The upload folder (product, category, banner, website, etc.)
 */
export const getImageUrl = (image, folder = 'product') => {
    if (!image) return null;

    // Handle Cloudinary object
    if (typeof image === 'object' && image.secure_url) {
        return image.secure_url;
    }

    // Pass through if already a full URL or absolute path
    if (typeof image === 'string') {
        if (image.startsWith('http') || image.startsWith('data:') || image.startsWith('/')) {
            return image;
        }

        // Clean legacy path and construct URL
        const cleanPath = image.replace(/^\/+/, '');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
        return `${apiUrl}/public/uploads/${folder}/${cleanPath}`;
    }

    return null;
};

/**
 * Resolves the full URL for a product image.
 */
export const getProductImageUrl = (imgName) => {
    return getImageUrl(imgName, 'product') || '/Icons/arcmatlogo.svg';
};

/**
 * Resolves the full URL for a variant image.
 * Note: Variant images are historically stored in the product folder in some versions,
 * but consistently using the 'product' folder for both handles brand-prefixed paths.
 */
export const getVariantImageUrl = (imgName) => {
    return getImageUrl(imgName, 'product') || '/Icons/arcmatlogo.svg';
};

/**
 * Resolves the full URL for a category image.
 */
export const getCategoryImageUrl = (imgName) => {
    return getImageUrl(imgName, 'category') || '/Icons/arcmatlogo.svg';
};

/**
 * Resolves the full URL for a banner image.
 */
export const getBannerImageUrl = (imgName) => {
    return getImageUrl(imgName, 'banner') || '/Icons/arcmatlogo.svg';
};

/**
 * Resolves the full URL for a brand logo.
 */
export const getBrandImageUrl = (imgName) => {
    return getImageUrl(imgName, 'brand') || '/Icons/arcmatlogo.svg';
};



/**
 * Formats a number as a currency string (INR).
 */
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount || 0);
};

/**
 * Parses dynamic attributes if they are in JSON string format.
 */
export const parseAttributes = (attributes) => {
    if (!attributes) return [];
    if (typeof attributes === 'string') {
        try {
            return JSON.parse(attributes);
        } catch (e) {
            return [];
        }
    }
    return attributes;
};

/**
 * Maps color names to CSS hex codes.
 */
export const getColorCode = (colorName) => {
    if (!colorName) return 'transparent';
    const name = colorName.toLowerCase().trim();
    const colorMap = {
        'red': '#ef4444',
        'blue': '#3b82f6',
        'green': '#22c55e',
        'yellow': '#eab308',
        'orange': '#f97316',
        'purple': '#a855f7',
        'pink': '#ec4899',
        'black': '#000000',
        'white': '#ffffff',
        'gray': '#6b7280',
        'grey': '#6b7280',
        'brown': '#78350f',
        'beige': '#f5f5dc',
        'gold': '#ffd700',
        'silver': '#c0c0c0',
        'maroon': '#800000',
        'navy': '#000080',
        'teal': '#008080',
    };
    return colorMap[name] || name;
};

/**
 * Calculates discount percentage.
 */
export const calculateDiscount = (mrp, price) => {
    if (!mrp || !price || Number(mrp) <= Number(price)) return 0;
    return Math.round(((Number(mrp) - Number(price)) / Number(mrp)) * 100);
};

/**
 * Formats a number with Indian numbering system (with commas).
 */
export const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return Number(num).toLocaleString('en-IN');
};

/**
 * Resolves pricing (Price and MRP) from product or variant.
 */
export const resolvePricing = (product, selectedVariant = null) => {
    const currentItem = selectedVariant || product;
    if (!currentItem) return { price: 0, mrp: 0, hasPrice: false, hasMrp: false };

    const price = currentItem.selling_price || currentItem.price || product?.minPrice || product?.selling_price;
    const mrp = currentItem.mrp_price || currentItem.mrp || product?.mrp_price || product?.mrp;

    return {
        price: Number(price) || 0,
        mrp: Number(mrp) || 0,
        hasPrice: Boolean(price && Number(price) > 0),
        hasMrp: Boolean(mrp && Number(mrp) > 0)
    };
};

/**
 * Aggregates specifications from product and variant.
 */
export const getSpecifications = (product, selectedVariant = null) => {
    if (!product) return [];

    const parseAttrs = (attrs) => {
        if (!attrs) return [];
        return typeof attrs === 'string' ? JSON.parse(attrs) : attrs;
    };

    const dynamicAttributes = parseAttrs(product.dynamicAttributes);
    const variantDynamicAttributes = selectedVariant ? parseAttrs(selectedVariant.dynamicAttributes) : [];

    const displayWeight = selectedVariant?.weight
        ? `${selectedVariant.weight} ${selectedVariant.weight_type || selectedVariant.weight_unit || 'kg'}`
        : (product.weight ? `${product.weight} ${product.weight_type || 'kg'}` : null);

    const allSpecs = [
        ...dynamicAttributes.map(a => ({ label: a.attributeName || a.key, value: a.attributeValue || a.value })),
        ...variantDynamicAttributes.map(a => ({ label: a.attributeName || a.key, value: a.attributeValue || a.value })),
        ...(selectedVariant ? [
            { label: 'Color', value: selectedVariant.color },
            { label: 'Size', value: selectedVariant.size },
            { label: 'Weight', value: displayWeight },
            { label: 'SKU', value: selectedVariant.skucode || selectedVariant._id }
        ] : [])
    ].filter(attr => attr.value !== undefined && attr.value !== null && attr.value !== '' && attr.value !== 'null' && attr.value !== 'undefined');

    // Filter duplicates by case-insensitive label
    const seen = new Set();
    return allSpecs.filter(item => {
        const labelSafe = (item.label || '').toLowerCase();
        if (seen.has(labelSafe)) return false;
        seen.add(labelSafe);
        return true;
    });
};

/**
 * Robust helper to resolve the best possible product name.
 */
export const getProductName = (v) => {
    if (!v) return 'Untitled';
    return (
        v.name ||
        v.product_name ||
        (typeof v.productId === 'object' ? v.productId?.product_name : null) ||
        'Untitled Material'
    );
};

/**
 * Robust helper to resolve the best possible category name.
 */
export const getProductCategory = (v) => {
    if (!v) return 'Material';
    const product = typeof v.productId === 'object' ? v.productId : null;
    return (
        (typeof v.categoryId === 'object' ? v.categoryId?.name : null) ||
        (product && typeof product.categoryId === 'object' ? product.categoryId?.name : null) ||
        v.category ||
        v.product_type ||
        (product?.category) ||
        'Material'
    );
};

/**
 * Robust helper to resolve the brand or vendor name.
 */
export const getProductBrand = (v) => {
    if (!v) return '';
    const product = typeof v.productId === 'object' ? v.productId : null;
    return (
        (typeof v.brand === 'object' ? v.brand?.name : v.brand) ||
        v.vendorId?.name ||
        (product && (typeof product.brand === 'object' ? product.brand?.name : product.brand)) ||
        (product && product.createdBy?.name) ||
        ''
    );
};

/**
 * Robust helper to resolve the size.
 */
export const getProductSize = (v) => {
    if (!v) return '';
    return v.size || (typeof v.productId === 'object' ? v.productId?.size : null) || '';
};

/**
 * Robust helper to resolve the best possible thumbnail image.
 */
export const getProductThumbnail = (v) => {
    if (!v) return '/Icons/arcmatlogo.svg';
    if (v.isCustomPhoto && v.photoUrl) return v.photoUrl;

    const firstImg = v.product_images?.[0] || v.images?.[0] || v.variant_images?.[0];
    if (firstImg) return getImageUrl(firstImg, 'product');

    const product = typeof v.productId === 'object' ? v.productId : null;
    const prodImg = product?.product_images?.[0] || product?.images?.[0];
    if (prodImg) return getImageUrl(prodImg, 'product');

    return '/Icons/arcmatlogo.svg';
};
