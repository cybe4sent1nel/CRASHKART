/**
 * Product Image Helper
 * Provides functions to reliably get product images for orders and other components
 * CRITICAL: Always uses LOCAL imported image modules, NEVER remote URLs
 */

import { productDummyData } from '@/assets/assets';

/**
 * Get product image by product ID - returns ONLY local imported modules
 * @param {string} productId - The product ID (e.g., 'prod_1')
 * @returns {object|null} - The image module object or null if not found
 */
export function getProductImageByProductId(productId) {
    if (!productId) {
        return null;
    }

    // Find the product in dummy data
    const product = productDummyData.find(p => p.id === productId);
    
    if (!product || !product.images || product.images.length === 0) {
        return null;
    }

    // Return ONLY the first image - should be an imported module
    const firstImage = product.images[0];
    
    // Ensure it's a valid object (imported image module)
    if (typeof firstImage === 'object' && firstImage !== null) {
        // Make sure it's not a URL string
        if (!String(firstImage).includes('http')) {
            return firstImage;
        }
    }

    return null;
}

/**
 * Get product data by product ID
 * @param {string} productId - The product ID (e.g., 'prod_1')
 * @returns {object|null} - The complete product object or null if not found
 */
export function getProductDataById(productId) {
    if (!productId) {
        return null;
    }

    return productDummyData.find(p => p.id === productId) || null;
}

/**
 * Get product image from product object - returns ONLY local imported modules
 * @param {object} product - The product object (may have partial data)
 * @returns {object|null} - The image module object or null if not found
 */
export function getProductImage(product) {
    if (!product) {
        return null;
    }

    // First check if product already has images array (from orderDummyData)
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        const firstImage = product.images[0];
        if (typeof firstImage === 'object' && firstImage !== null) {
            if (!String(firstImage).includes('http') && !String(firstImage).includes('unsplash') && !String(firstImage).includes('picsum')) {
                return firstImage;
            }
        }
    }

    // If no images, try to look up by product ID
    if (!product.id) {
        return null;
    }

    // Look up the full product data
    const fullProduct = productDummyData.find(p => p.id === product.id);
    
    if (!fullProduct || !fullProduct.images || fullProduct.images.length === 0) {
        return null;
    }

    const firstImage = fullProduct.images[0];
    
    // CRITICAL: Only return if it's an imported module, NOT a URL
    if (typeof firstImage === 'object' && firstImage !== null) {
        // Verify it's not a string URL
        if (!String(firstImage).includes('http') && !String(firstImage).includes('unsplash') && !String(firstImage).includes('picsum')) {
            return firstImage;
        }
    }

    return null;
}

/**
 * Enrich order item with product data
 * @param {object} orderItem - The order item (may have partial product data)
 * @returns {object} - The order item with enriched product data
 */
export function enrichOrderItem(orderItem) {
    if (!orderItem) {
        return orderItem;
    }

    const productId = orderItem.productId || orderItem.product?.id;
    
    if (!productId) {
        return orderItem;
    }

    // ALWAYS get full product data from productDummyData to ensure images exist
    const fullProduct = getProductDataById(productId);
    
    if (fullProduct) {
        return {
            ...orderItem,
            product: fullProduct
        };
    }

    return orderItem;
}

/**
 * Enrich all order items in an order
 * @param {object} order - The order object
 * @returns {object} - The order with enriched items
 */
export function enrichOrder(order) {
    if (!order || !order.orderItems || !Array.isArray(order.orderItems)) {
        return order;
    }

    return {
        ...order,
        orderItems: order.orderItems.map(item => enrichOrderItem(item))
    };
}
