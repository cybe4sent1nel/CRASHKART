/**
 * Clean up corrupted localStorage data
 * This utility safely validates and cleans JSON data in localStorage
 */

export const cleanupCorruptedStorage = () => {
    if (typeof window === 'undefined') return;

    const keysToCheck = ['adminProducts', 'allOrders', 'userOrders', 'products'];

    keysToCheck.forEach(key => {
        try {
            const data = localStorage.getItem(key);
            
            if (data) {
                // Try to parse and re-validate
                const parsed = JSON.parse(data);
                
                // Re-stringify to ensure valid JSON
                const cleaned = JSON.stringify(parsed);
                localStorage.setItem(key, cleaned);
            }
        } catch (error) {
            console.warn(`Cleaning corrupted data for key: ${key}`);
            // Remove corrupted data
            localStorage.removeItem(key);
        }
    });
};

/**
 * Validate product data structure
 */
export const validateProductData = (product) => {
    if (!product || typeof product !== 'object') return false;

    const requiredFields = ['id', 'name', 'price', 'mrp', 'category', 'images'];
    return requiredFields.every(field => field in product);
};

/**
 * Sanitize product list from localStorage
 */
export const sanitizeProductList = (products) => {
    if (!Array.isArray(products)) return [];

    return products.filter(validateProductData);
};

/**
 * Get safe product data
 */
export const getSafeProductData = () => {
    try {
        cleanupCorruptedStorage();
        
        const rawData = localStorage.getItem('adminProducts');
        if (!rawData) return null;

        const parsed = JSON.parse(rawData);
        return sanitizeProductList(parsed);
    } catch (error) {
        console.error('Error getting safe product data:', error);
        localStorage.removeItem('adminProducts');
        return null;
    }
};

/**
 * Reset all product-related storage (use cautiously)
 */
export const resetProductStorage = () => {
    localStorage.removeItem('adminProducts');
    localStorage.removeItem('products');
    console.log('Product storage reset');
};
