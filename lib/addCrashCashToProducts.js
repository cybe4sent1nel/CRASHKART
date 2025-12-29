/**
 * Helper function to add crashCashMin and crashCashMax to products
 * Converts existing crashCashValue to min (10% of value) and max (value itself)
 */

export const addCrashCashRangesToProduct = (product) => {
    // If already has new format, return as is
    if (product.crashCashMin && product.crashCashMax) {
        return product
    }

    // If has old crashCashValue, convert it
    let minCash = 10
    let maxCash = 240

    if (product.crashCashValue) {
        // Use crashCashValue as the max
        maxCash = product.crashCashValue
        // Min is 10% of max, but at least 10
        minCash = Math.max(Math.floor(product.crashCashValue * 0.1), 10)
    }

    return {
        ...product,
        crashCashMin: minCash,
        crashCashMax: maxCash,
        crashCashValue: maxCash // Keep for backward compatibility
    }
}

export const addCrashCashRangesToAllProducts = (products) => {
    return products.map(product => addCrashCashRangesToProduct(product))
}
