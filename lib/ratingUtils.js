// Generate product-specific ratings with varied dates
import profile_pic1 from "@/assets/profile_pic1.jpg"
import profile_pic2 from "@/assets/profile_pic2.jpg"
import profile_pic3 from "@/assets/profile_pic3.jpg"

const userProfiles = [
    { name: 'Kristin Watson', image: profile_pic1 },
    { name: 'Jenny Wilson', image: profile_pic2 },
    { name: 'Bessie Cooper', image: profile_pic3 },
]

const reviews = [
    "Excellent product! Highly satisfied with quality and delivery.",
    "Amazing value for money. Exceeded my expectations.",
    "Great quality and very comfortable to use.",
    "Perfect! Exactly what I was looking for.",
    "Superb build quality and features.",
    "Highly recommend to anyone looking for quality.",
    "Outstanding performance. Worth every penny!",
    "Best purchase I've made. Very happy!",
    "Fantastic! Great design and functionality.",
    "Impressive quality and fast delivery.",
]

export const generateProductRatings = (productId, productName, category) => {
    // Generate 3-5 reviews per product
    const reviewCount = Math.floor(Math.random() * 3) + 3
    const ratings = []
    
    // Base ratings between 4-5
    const baseRatings = [4.2, 4.5, 4.7, 4.8, 4.9, 5.0, 4.3, 4.6]
    
    for (let i = 0; i < reviewCount; i++) {
        const daysAgo = Math.floor(Math.random() * 45) + 1 // 1-45 days ago
        const date = new Date()
        date.setDate(date.getDate() - daysAgo)
        
        const userIdx = i % userProfiles.length
        const ratingIdx = Math.floor(Math.random() * baseRatings.length)
        
        ratings.push({
            id: `rat_${productId}_${i}`,
            rating: baseRatings[ratingIdx],
            review: reviews[Math.floor(Math.random() * reviews.length)],
            user: userProfiles[userIdx],
            productId: productId,
            createdAt: date.toISOString(),
            updatedAt: date.toISOString(),
            product: {
                name: productName,
                category: category,
                id: productId
            }
        })
    }
    
    return ratings
}

export const calculateAverageRating = (ratings) => {
    if (!ratings || ratings.length === 0) return 0
    const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0)
    return Math.round((sum / ratings.length) * 10) / 10
}
