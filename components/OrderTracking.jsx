'use client'
import Lottie from 'lottie-react';
import { useEffect, useState } from 'react';

const OrderTracking = ({ order, onStatusChange }) => {
    const [trackingStages, setTrackingStages] = useState([]);
    const [currentAnimation, setCurrentAnimation] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Standardized order status constants
    const STATUS_MAP = {
        'ORDER_PLACED': 'Order Placed',
        'PROCESSING': 'Processing',
        'SHIPPED': 'Shipped',
        'DELIVERED': 'Delivered',
        'CANCELLED': 'Cancelled',
        'RETURN_ACCEPTED': 'Return Accepted',
        'RETURN_PICKED_UP': 'Return Picked Up',
        'REFUND_COMPLETED': 'Refund Completed'
    };

    // URL-based animation mapping (no imports needed)
    const ANIMATION_MAP = {
        'ORDER_PLACED': '/animations/Order Confirmed.json',
        'PROCESSING': '/animations/Warehouse and delivery.json',
        'SHIPPED': '/animations/Waiting the Courier.json',
        'DELIVERED': '/animations/Success celebration.json',
        'CANCELLED': '/animations/Cancelled Parcel.json',
        'RETURN_ACCEPTED': '/animations/Order packed.json',
        'RETURN_PICKED_UP': '/animations/return.json',
        'REFUND_COMPLETED': '/animations/Collecting Money.json'
    };

    // Convert any status format to standardized format
    const normalizeStatus = (status) => {
        if (!status) return 'ORDER_PLACED';

        const upper = status.toUpperCase().replace(/ /g, '_');

        // Handle all variations
        if (upper === 'ORDER_PLACED' || upper.includes('PLACED') || upper === 'CONFIRMED' || upper.includes('ORDER')) {
            return 'ORDER_PLACED';
        }
        if (upper === 'PROCESSING' || upper.includes('PROCESS')) {
            return 'PROCESSING';
        }
        if (upper === 'SHIPPED' || upper.includes('SHIP') || upper.includes('TRANSIT')) {
            return 'SHIPPED';
        }
        if (upper === 'DELIVERED' || upper.includes('DELIVER') || upper.includes('DELIVERY')) {
            return 'DELIVERED';
        }
        if (upper === 'CANCELLED' || upper.includes('CANCEL')) {
            return 'CANCELLED';
        }
        if (upper === 'RETURN_ACCEPTED' || upper.includes('RETURN') && upper.includes('ACCEPT')) {
            return 'RETURN_ACCEPTED';
        }
        if (upper === 'RETURN_PICKED_UP' || upper.includes('RETURN') && upper.includes('PICK')) {
            return 'RETURN_PICKED_UP';
        }
        if (upper === 'REFUND_COMPLETED' || upper.includes('REFUND')) {
            return 'REFUND_COMPLETED';
        }

        // If no match, return uppercase version
        console.warn('⚠️ Unknown status:', status, '→ normalizing to:', upper);
        return upper;
    };

    // Listen for real-time order status updates from admin panel
    useEffect(() => {
        const handleStatusUpdate = (event) => {
            const { orderId, status, newStatus, order: updatedOrder, updatedOrderFromAdmin } = event.detail;
            
            if (orderId === order?.id) {
                console.log('📡 Real-time status update received from admin:', event.detail);
                
                // Use the order object if provided, otherwise create minimal update
                const orderToUse = updatedOrder || updatedOrderFromAdmin;
                if (orderToUse && onStatusChange) {
                    onStatusChange(orderToUse);
                } else if (status || newStatus) {
                    // Fallback: update just the status in the order object
                    const updatedOrderObj = { ...order, status: status || newStatus };
                    if (onStatusChange) {
                        onStatusChange(updatedOrderObj);
                    }
                }
            }
        };

        window.addEventListener('orderStatusUpdated', handleStatusUpdate);
        
        return () => {
            window.removeEventListener('orderStatusUpdated', handleStatusUpdate);
        };
    }, [order?.id, onStatusChange, order]);

    useEffect(() => {
        if (!order) {
            console.log('⚠️ OrderTracking: No order object provided');
            return;
        }

        const normalizedStatus = normalizeStatus(order?.status);
        console.log('='.repeat(60));
        console.log('📊 OrderTracking Status changed:');
        console.log('  orderId:', order?.id);
        console.log('  rawStatus:', order?.status);
        console.log('  normalizedStatus:', normalizedStatus);
        console.log('  timestamp:', new Date().toLocaleTimeString());

        // Check if this is a return/refund flow
        const isReturnFlow = ['RETURN_ACCEPTED', 'RETURN_PICKED_UP', 'REFUND_COMPLETED'].includes(normalizedStatus);
        const isCancelled = normalizedStatus === 'CANCELLED';

        let stages = [];

        if (isReturnFlow) {
            // Return/Refund flow stages
            stages = [
                {
                    id: 'DELIVERED',
                    label: 'Order Delivered',
                    date: order?.updatedAt ? new Date(order.updatedAt).toLocaleDateString('en-IN') : 'Completed',
                    completed: true,
                    active: false
                },
                {
                    id: 'RETURN_ACCEPTED',
                    label: 'Return Accepted',
                    date: 'Pending',
                    completed: ['RETURN_ACCEPTED', 'RETURN_PICKED_UP', 'REFUND_COMPLETED'].includes(normalizedStatus),
                    active: normalizedStatus === 'RETURN_ACCEPTED'
                },
                {
                    id: 'RETURN_PICKED_UP',
                    label: 'Return Picked Up',
                    date: 'Pending',
                    completed: ['RETURN_PICKED_UP', 'REFUND_COMPLETED'].includes(normalizedStatus),
                    active: normalizedStatus === 'RETURN_PICKED_UP'
                },
                {
                    id: 'REFUND_COMPLETED',
                    label: 'Refund Completed',
                    date: 'Pending',
                    completed: normalizedStatus === 'REFUND_COMPLETED',
                    active: normalizedStatus === 'REFUND_COMPLETED'
                }
            ];
        } else if (isCancelled) {
            // Cancelled flow - show stages up to cancellation
            stages = [
                {
                    id: 'ORDER_PLACED',
                    label: 'Order Placed',
                    date: order?.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'Completed',
                    completed: true,
                    active: false
                },
                {
                    id: 'CANCELLED',
                    label: 'Order Cancelled',
                    date: order?.canceledAt ? new Date(order.canceledAt).toLocaleDateString('en-IN') : 'Pending',
                    completed: true,
                    active: true
                }
            ];
        } else {
            // Normal order flow stages
            stages = [
                {
                    id: 'ORDER_PLACED',
                    label: 'Order Placed',
                    date: order?.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'Pending',
                    completed: ['ORDER_PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(normalizedStatus),
                    active: normalizedStatus === 'ORDER_PLACED'
                },
                {
                    id: 'PROCESSING',
                    label: 'Processing',
                    date: 'Pending',
                    completed: ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(normalizedStatus),
                    active: normalizedStatus === 'PROCESSING'
                },
                {
                    id: 'SHIPPED',
                    label: 'Shipped',
                    date: 'Pending',
                    completed: ['SHIPPED', 'DELIVERED'].includes(normalizedStatus),
                    active: normalizedStatus === 'SHIPPED'
                },
                {
                    id: 'DELIVERED',
                    label: 'Delivered',
                    date: 'Pending',
                    completed: normalizedStatus === 'DELIVERED',
                    active: normalizedStatus === 'DELIVERED'
                }
            ];
        }

        setTrackingStages(stages);
        console.log('✅ Tracking stages updated');

        // Clear animation and loading state immediately
        setCurrentAnimation(null);
        setIsLoading(true);

        // Load animation for the current status
        const animationUrl = ANIMATION_MAP[normalizedStatus];
        console.log('🎬 Fetching animation:');
        console.log('  status:', normalizedStatus);
        console.log('  url:', animationUrl);

        if (animationUrl) {
            // Add cache-busting parameter
            const cacheBustedUrl = `${animationUrl}?t=${Date.now()}`;
            console.log('🌐 Fetch URL (with cache-bust):', cacheBustedUrl);

            fetch(cacheBustedUrl)
                .then(res => {
                    console.log('📥 Response received:', { status: res.status, ok: res.ok });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return res.json();
                })
                .then(data => {
                    console.log('📦 Animation data received:', { hasData: !!data, hasVersion: !!data?.v });
                    if (data && data.v) {
                        console.log('✅ Animation loaded successfully:', { status: normalizedStatus, version: data.v });
                        setCurrentAnimation(data);
                        setIsLoading(false);
                    } else {
                        console.warn('⚠️ Invalid animation data format:', { data });
                        setCurrentAnimation(null);
                        setIsLoading(false);
                    }
                })
                .catch(err => {
                    console.error('❌ Animation fetch failed:', { status: normalizedStatus, url: animationUrl, error: err.message });
                    setCurrentAnimation(null);
                    setIsLoading(false);
                });
        } else {
            console.warn('⚠️ No animation URL mapped for status:', normalizedStatus);
            console.log('📋 Available mappings:', Object.keys(ANIMATION_MAP));
            setIsLoading(false);
        }
        console.log('='.repeat(60));
    }, [order?.status, order?.id]);

    const currentStatus = normalizeStatus(order?.status);
    const isDelivered = currentStatus === 'DELIVERED';
    const isCancelled = currentStatus === 'CANCELLED';

    return (
        <div className="w-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
            {/* Animation Section - Show for all statuses */}
            <div className="mb-8 h-64 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 rounded-xl">
                {currentAnimation && !isLoading ? (
                    <div key={`animation-${currentStatus}`} className="w-full h-full flex items-center justify-center p-4">
                        <Lottie
                            animationData={currentAnimation}
                            loop={true}
                            autoplay={true}
                            style={{
                                width: '100%',
                                height: '100%',
                                maxWidth: '400px',
                                maxHeight: '400px'
                            }}
                        />
                    </div>
                ) : isLoading ? (
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Loading animation...</p>
                    </div>
                ) : (
                    <div className="text-center">
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            Animation for {currentStatus}
                        </p>
                        <p className="text-xs text-slate-400 mt-2">Check console for errors</p>
                    </div>
                )}
            </div>

            {/* Status Text */}
            <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    {STATUS_MAP[currentStatus] || currentStatus}
                </h3>
                {isCancelled && (
                    <p className="text-red-600 dark:text-red-400">This order has been cancelled</p>
                )}
            </div>

            {/* Tracking Timeline */}
            <div className="space-y-6">
                {trackingStages.map((stage, index) => (
                    <div key={stage.id} className="flex gap-4">
                        {/* Timeline Dot and Line */}
                        <div className="flex flex-col items-center">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                                    stage.completed || stage.active
                                        ? 'bg-green-500 dark:bg-green-600 text-white shadow-lg'
                                        : 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
                                }`}
                            >
                                {stage.completed || stage.active ? '✓' : index + 1}
                            </div>
                            {index !== trackingStages.length - 1 && (
                                <div
                                    className={`w-1 h-12 my-2 transition-colors ${
                                        stage.completed || stage.active
                                            ? 'bg-green-500 dark:bg-green-600'
                                            : 'bg-slate-300 dark:bg-slate-600'
                                    }`}
                                />
                            )}
                        </div>

                        {/* Stage Info */}
                        <div className="flex-1 pt-2">
                            <h4
                                className={`font-semibold text-lg transition-colors ${
                                    stage.completed || stage.active
                                        ? 'text-slate-900 dark:text-white'
                                        : 'text-slate-500 dark:text-slate-400'
                                }`}
                            >
                                {stage.label}
                            </h4>
                            <p
                                className={`text-sm ${
                                    stage.completed || stage.active
                                        ? 'text-slate-600 dark:text-slate-300'
                                        : 'text-slate-400 dark:text-slate-500'
                                }`}
                            >
                                {stage.date}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Delivered Message */}
            {isDelivered && (
                <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-green-800 dark:text-green-300 text-center font-medium">
                        ✓ Your order has been successfully delivered!
                    </p>
                </div>
            )}
        </div>
    );
};

export default OrderTracking;
