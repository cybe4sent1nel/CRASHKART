/**
 * Real-time Sync Manager
 * Handles real-time updates for orders, inventory, and other resources
 */

export const setupRealtimeSync = (email, onOrderUpdate) => {
    // Set up polling for real-time updates
    const pollInterval = setInterval(async () => {
        try {
            const response = await fetch('/api/orders/get-user-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.orders) {
                    onOrderUpdate(data.orders);
                }
            }
        } catch (error) {
            console.error('Realtime sync error:', error);
        }
    }, 15000); // Poll every 15 seconds

    // Return cleanup function
    return () => clearInterval(pollInterval);
};

export const broadcastOrderUpdate = (orderId, newStatus, orderData) => {
    // Dispatch custom event that components can listen to
    window.dispatchEvent(new CustomEvent('orderStatusUpdated', {
        detail: {
            orderId,
            newStatus,
            order: orderData,
            timestamp: new Date().toISOString()
        }
    }));
};

export const subscribeToOrderUpdates = (callback) => {
    const handleUpdate = (event) => {
        callback(event.detail);
    };

    window.addEventListener('orderStatusUpdated', handleUpdate);

    // Return unsubscribe function
    return () => {
        window.removeEventListener('orderStatusUpdated', handleUpdate);
    };
};
