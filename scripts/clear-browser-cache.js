/**
 * Clear Browser Cache Script
 * 
 * Copy and paste this code into your browser console (F12 → Console tab)
 * Then press Enter to run it
 */

// Clear all localStorage
localStorage.clear();

// Clear all sessionStorage
sessionStorage.clear();

// Clear specific order-related items
const keysToRemove = [
    'userOrders',
    'allOrders',
    'orders',
    'user',
    'googleUser',
    'cart'
];

keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
});

console.log('✅ Browser cache cleared successfully!');
console.log('🔄 Please refresh the page (Ctrl + Shift + R or Ctrl + F5)');

// Auto reload after 2 seconds
setTimeout(() => {
    window.location.reload(true);
}, 2000);
