/**
 * Comprehensive Per-User Data Storage Manager
 * Handles all user-specific data with email as identifier
 * 
 * User-specific data includes:
 * - Orders (userOrders, allOrders)
 * - Addresses (userAddresses)
 * - Wishlist
 * - Cart (handled by Redux, but can include local backup)
 * - Crash Cash (balance, items, scratch rewards, order rewards)
 * - Product Reviews & Ratings
 * - Recently Viewed Products
 */

const USERS_DATA_KEY = 'users_personal_data';

/**
 * Get all data for a specific user
 */
export function getUserData(email) {
  if (!email) return null;

  try {
    const allUsersData = JSON.parse(localStorage.getItem(USERS_DATA_KEY) || '{}');
    return allUsersData[email] || null;
  } catch (error) {
    console.error('Error loading user data:', error);
    return null;
  }
}

/**
 * Save all user data
 */
export function saveUserData(email, userData) {
  if (!email) return false;

  try {
    const allUsersData = JSON.parse(localStorage.getItem(USERS_DATA_KEY) || '{}');
    
    allUsersData[email] = {
      ...allUsersData[email],
      ...userData,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem(USERS_DATA_KEY, JSON.stringify(allUsersData));
    return true;
  } catch (error) {
    console.error('Error saving user data:', error);
    return false;
  }
}

/**
 * Initialize user profile with default structure
 */
export function initializeUserProfile(email, userInfo = {}) {
  if (!email) return false;

  try {
    const allUsersData = JSON.parse(localStorage.getItem(USERS_DATA_KEY) || '{}');
    
    if (!allUsersData[email]) {
      allUsersData[email] = {
        // User Info
        profile: userInfo,
        
        // Orders
        orders: [],
        allOrders: [],
        
        // Addresses
        addresses: [],
        
        // Wishlist
        wishlist: [],
        
        // Cart (backup)
        cartBackup: [],
        
        // Reviews & Ratings
        reviews: [],
        ratings: [],
        
        // Recently Viewed
        recentlyViewed: [],
        
        // Preferences
        preferences: {
          theme: 'light',
          notifications: true
        },
        
        // Metadata
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(USERS_DATA_KEY, JSON.stringify(allUsersData));
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing user profile:', error);
    return false;
  }
}

// ==================== ORDERS ====================

export function getUserOrders(email) {
  const userData = getUserData(email);
  return userData?.orders || [];
}

export function saveUserOrders(email, orders) {
  return saveUserData(email, { orders });
}

export function addUserOrder(email, order) {
  const orders = getUserOrders(email);
  const updated = [...orders, { ...order, addedAt: new Date().toISOString() }];
  return saveUserOrders(email, updated);
}

export function getAllOrders(email) {
  const userData = getUserData(email);
  return userData?.allOrders || [];
}

export function saveAllOrders(email, orders) {
  return saveUserData(email, { allOrders: orders });
}

// ==================== ADDRESSES ====================

export function getUserAddresses(email) {
  const userData = getUserData(email);
  return userData?.addresses || [];
}

export function saveUserAddresses(email, addresses) {
  return saveUserData(email, { addresses });
}

export function addUserAddress(email, address) {
  const addresses = getUserAddresses(email);
  const newAddress = {
    ...address,
    id: address.id || `addr_${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  const updated = [...addresses, newAddress];
  return saveUserAddresses(email, updated);
}

export function updateUserAddress(email, addressId, updatedAddress) {
  const addresses = getUserAddresses(email);
  const updated = addresses.map(addr => 
    addr.id === addressId ? { ...addr, ...updatedAddress } : addr
  );
  return saveUserAddresses(email, updated);
}

export function deleteUserAddress(email, addressId) {
  const addresses = getUserAddresses(email);
  const updated = addresses.filter(addr => addr.id !== addressId);
  return saveUserAddresses(email, updated);
}

// ==================== WISHLIST ====================

export function getUserWishlist(email) {
  const userData = getUserData(email);
  return userData?.wishlist || [];
}

export function saveUserWishlist(email, wishlist) {
  return saveUserData(email, { wishlist });
}

export function addToWishlist(email, product) {
  const wishlist = getUserWishlist(email);
  const exists = wishlist.some(item => item.id === product.id);
  
  if (!exists) {
    const updated = [...wishlist, { ...product, addedAt: new Date().toISOString() }];
    return saveUserWishlist(email, updated);
  }
  return false;
}

export function removeFromWishlist(email, productId) {
  const wishlist = getUserWishlist(email);
  const updated = wishlist.filter(item => item.id !== productId);
  return saveUserWishlist(email, updated);
}

export function isInWishlist(email, productId) {
  const wishlist = getUserWishlist(email);
  return wishlist.some(item => item.id === productId);
}

// ==================== REVIEWS & RATINGS ====================

export function getUserReviews(email) {
  const userData = getUserData(email);
  return userData?.reviews || [];
}

export function saveUserReviews(email, reviews) {
  return saveUserData(email, { reviews });
}

export function addProductReview(email, review) {
  const reviews = getUserReviews(email);
  const newReview = {
    ...review,
    id: review.id || `review_${Date.now()}`,
    userId: email,
    createdAt: new Date().toISOString()
  };
  const updated = [...reviews, newReview];
  return saveUserReviews(email, updated);
}

export function getUserRatings(email) {
  const userData = getUserData(email);
  return userData?.ratings || [];
}

export function saveUserRatings(email, ratings) {
  return saveUserData(email, { ratings });
}

export function addProductRating(email, rating) {
  const ratings = getUserRatings(email);
  const newRating = {
    ...rating,
    id: rating.id || `rating_${Date.now()}`,
    userId: email,
    createdAt: new Date().toISOString()
  };
  const updated = [...ratings, newRating];
  return saveUserRatings(email, updated);
}

// ==================== RECENTLY VIEWED ====================

export function getUserRecentlyViewed(email) {
  const userData = getUserData(email);
  return userData?.recentlyViewed || [];
}

export function saveUserRecentlyViewed(email, products) {
  return saveUserData(email, { recentlyViewed: products });
}

export function addToRecentlyViewed(email, product) {
  const viewed = getUserRecentlyViewed(email);
  // Remove if already exists
  const filtered = viewed.filter(item => item.id !== product.id);
  // Add to beginning
  const updated = [{ ...product, viewedAt: new Date().toISOString() }, ...filtered].slice(0, 20);
  return saveUserRecentlyViewed(email, updated);
}

// ==================== PREFERENCES ====================

export function getUserPreferences(email) {
  const userData = getUserData(email);
  return userData?.preferences || { theme: 'light', notifications: true };
}

export function saveUserPreferences(email, preferences) {
  return saveUserData(email, { preferences });
}

export function updateUserPreference(email, key, value) {
  const prefs = getUserPreferences(email);
  const updated = { ...prefs, [key]: value };
  return saveUserPreferences(email, updated);
}

// ==================== MIGRATION ====================

/**
 * Migrate all user-specific data from old global keys to new per-user format
 */
export function migrateUserData(email) {
  if (!email) return false;

  try {
    const userData = getUserData(email);
    
    // Only migrate if user doesn't already have data
    if (userData) {
      return true;
    }

    // Initialize user with data
    initializeUserProfile(email);

    // Migrate Orders
    const userOrders = localStorage.getItem('userOrders');
    if (userOrders) {
      try {
        const orders = JSON.parse(userOrders);
        saveUserOrders(email, orders);
      } catch (e) {
        console.error('Error migrating userOrders:', e);
      }
    }

    const allOrders = localStorage.getItem('allOrders');
    if (allOrders) {
      try {
        const orders = JSON.parse(allOrders);
        saveAllOrders(email, orders);
      } catch (e) {
        console.error('Error migrating allOrders:', e);
      }
    }

    // Migrate Addresses
    const userAddresses = localStorage.getItem('userAddresses');
    if (userAddresses) {
      try {
        const addresses = JSON.parse(userAddresses);
        saveUserAddresses(email, addresses);
      } catch (e) {
        console.error('Error migrating userAddresses:', e);
      }
    }

    // Migrate Wishlist
    const wishlist = localStorage.getItem('wishlist');
    if (wishlist) {
      try {
        const items = JSON.parse(wishlist);
        saveUserWishlist(email, items);
      } catch (e) {
        console.error('Error migrating wishlist:', e);
      }
    }

    // Migrate Reviews
    const productReviews = localStorage.getItem('productReviews');
    if (productReviews) {
      try {
        const allReviews = JSON.parse(productReviews);
        // Filter to only user's reviews
        const userReviews = allReviews.filter(r => r.userId === email || r.userEmail === email);
        saveUserReviews(email, userReviews);
      } catch (e) {
        console.error('Error migrating productReviews:', e);
      }
    }

    // Migrate Recently Viewed
    const recentlyViewed = localStorage.getItem('recentlyViewed');
    if (recentlyViewed) {
      try {
        const products = JSON.parse(recentlyViewed);
        saveUserRecentlyViewed(email, products);
      } catch (e) {
        console.error('Error migrating recentlyViewed:', e);
      }
    }

    return true;
  } catch (error) {
    console.error('Error in migrateUserData:', error);
    return false;
  }
}

/**
 * Clean up user data (on logout) - optionally delete or just unload
 * By default, data is preserved. Set deleteData=true to remove.
 */
export function cleanupUserData(email, deleteData = false) {
  if (!email) return false;

  if (deleteData) {
    try {
      const allUsersData = JSON.parse(localStorage.getItem(USERS_DATA_KEY) || '{}');
      delete allUsersData[email];
      localStorage.setItem(USERS_DATA_KEY, JSON.stringify(allUsersData));
      return true;
    } catch (error) {
      console.error('Error cleaning up user data:', error);
      return false;
    }
  }
  
  // Just mark as logged out without deleting
  return true;
}

/**
 * Export user data as JSON (for backup/download)
 */
export function exportUserData(email) {
  const userData = getUserData(email);
  if (!userData) return null;

  return {
    user: userData,
    exportedAt: new Date().toISOString()
  };
}

/**
 * Get all users' emails (for admin purposes)
 */
export function getAllUsersEmails() {
  try {
    const allUsersData = JSON.parse(localStorage.getItem(USERS_DATA_KEY) || '{}');
    return Object.keys(allUsersData);
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}

/**
 * Get storage size info
 */
export function getStorageInfo() {
  try {
    const allUsersData = localStorage.getItem(USERS_DATA_KEY) || '{}';
    const sizeInBytes = new Blob([allUsersData]).size;
    const sizeInKB = (sizeInBytes / 1024).toFixed(2);
    
    return {
      sizeInBytes,
      sizeInKB,
      sizeInMB: (sizeInBytes / (1024 * 1024)).toFixed(2)
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return null;
  }
}
