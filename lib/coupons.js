// Client-side helper to validate a coupon via server API
export async function validateCoupon(couponCode, subtotal = 0, productIds = [], userId = null) {
  if (!couponCode || couponCode.trim() === '') {
    return { valid: false, message: 'Please enter a coupon code' }
  }

  try {
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponCode, subtotal, productIds, userId })
    })

    const data = await res.json()
    return data
  } catch (error) {
    console.error('Error validating coupon:', error)
    return { valid: false, message: 'Failed to validate coupon. Please try again.' }
  }
}
