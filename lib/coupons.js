// Available coupons on the site
export const availableCoupons = [
    {
        code: 'NEW20',
        discount: 20,
        type: 'percentage',
        description: 'Get 20% OFF on your first order',
        minAmount: 500
    },
    {
        code: 'FLASH30',
        discount: 30,
        type: 'percentage',
        description: 'Flash Sale - 30% OFF',
        minAmount: 1000
    },
    {
        code: 'EXCLUSIVE20',
        discount: 20,
        type: 'percentage',
        description: 'Exclusive deal - 20% OFF',
        minAmount: 800
    },
    {
        code: 'SAVE100',
        discount: 100,
        type: 'fixed',
        description: 'Save 100 on orders above 500',
        minAmount: 500
    }
]

export const validateCoupon = (couponCode, totalAmount) => {
    const coupon = availableCoupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase())
    
    if (!coupon) {
        return {
            valid: false,
            message: 'Invalid coupon code'
        }
    }

    if (totalAmount < coupon.minAmount) {
        return {
            valid: false,
            message: `Minimum order amount of ₹${coupon.minAmount} required for this coupon`
        }
    }

    return {
        valid: true,
        coupon: coupon,
        discount: coupon.type === 'percentage' 
            ? (totalAmount * coupon.discount / 100)
            : coupon.discount
    }
}
