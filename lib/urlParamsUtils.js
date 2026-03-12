/**
 * URL Parameter Utilities for Product Filtering
 * Handles conversion between filter state and URL search params
 */

/**
 * Parse filters from URL search params
 * @param {URLSearchParams} searchParams - Next.js useSearchParams result
 * @returns {Object} Parsed filter state
 */
export const parseFiltersFromURL = (searchParams) => {
    const category = searchParams.get('category') || 'All';
    const brands = searchParams.get('brands')?.split(',').filter(Boolean) || [];
    const colors = searchParams.get('colors')?.split(',').filter(Boolean) || [];
    const cities = searchParams.get('cities')?.split(',').filter(Boolean) || [];
    const availability = searchParams.get('availability')?.split(',').filter(Boolean) || [];
    const minPrice = parseInt(searchParams.get('minPrice')) || 0;
    const maxPrice = parseInt(searchParams.get('maxPrice')) || 500000;

    // Parse dynamic attributes (attr_ prefix)
    const attributes = {};
    for (const [key, value] of searchParams.entries()) {
        if (key.startsWith('attr_')) {
            const attrName = key.replace('attr_', '');
            attributes[attrName] = value.split(',').filter(Boolean);
        }
    }

    return {
        category,
        filters: {
            brands,
            colors,
            cities,
            availability,
            priceRange: [minPrice, maxPrice],
            availability: [],
            attributes, // New field for dynamic attributes
            toggles: {
                commercial: false,
                residential: false,
                allColorways: false
            }
        }
    };
};

/**
 * Build URL search params string from filter state
 * @param {string} category - Selected category ID
 * @param {Object} filters - Active filters object
 * @returns {string} URL search params string
 */
export const buildURLFromFilters = (category, filters) => {
    const params = new URLSearchParams();

    if (category && category !== 'All') {
        params.set('category', category);
    }

    if (filters.brands && filters.brands.length > 0) {
        params.set('brands', filters.brands.join(','));
    }

    if (filters.colors && filters.colors.length > 0) {
        params.set('colors', filters.colors.join(','));
    }

    if (filters.cities && filters.cities.length > 0) {
        params.set('cities', filters.cities.join(','));
    }

    if (filters.availability && filters.availability.length > 0) {
        params.set('availability', filters.availability.join(','));
    }

    if (filters.priceRange && (filters.priceRange[0] !== 0 || filters.priceRange[1] !== 500000)) {
        params.set('minPrice', filters.priceRange[0].toString());
        params.set('maxPrice', filters.priceRange[1].toString());
    }

    // Serialize dynamic attributes
    if (filters.attributes) {
        Object.entries(filters.attributes).forEach(([key, values]) => {
            if (values && values.length > 0) {
                params.set(`attr_${key}`, values.join(','));
            }
        });
    }

    return params.toString();
};

/**
 * Get category name from ID by searching category tree
 * @param {string} categoryId - Category ID to search for
 * @param {Array} categoryTree - Category tree data
 * @returns {string} Category name or empty string
 */
export const getCategoryNameFromTree = (categoryId, categoryTree) => {
    if (!categoryId || categoryId === 'All' || !categoryTree) return '';

    const searchTree = (categories) => {
        for (const cat of categories) {
            if (cat._id === categoryId || cat.id === categoryId) {
                return cat.name;
            }
            if (cat.children && cat.children.length > 0) {
                const found = searchTree(cat.children);
                if (found) return found;
            }
        }
        return null;
    };

    return searchTree(categoryTree) || '';
};

/**
 * Get category ID from name by searching category tree
 * @param {string} categoryName - Category name to search for
 * @param {Array} categoryTree - Category tree data
 * @returns {string} Category ID or 'All'
 */
export const getCategoryIdFromTree = (categoryName, categoryTree) => {
    if (!categoryName || !categoryTree) return 'All';

    const searchTree = (categories) => {
        for (const cat of categories) {
            if (cat.name?.toLowerCase() === categoryName.toLowerCase()) {
                return cat._id || cat.id;
            }
            if (cat.children && cat.children.length > 0) {
                const found = searchTree(cat.children);
                if (found) return found;
            }
        }
        return null;
    };

    return searchTree(categoryTree) || 'All';
};
