'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronDown, MapPin, Clock, RotateCcw, HelpCircle, X, Share2, Star, Package, ShoppingBag, Truck, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Lottie from 'lottie-react'
import ScooterAnimation from '@/components/animations/ScooterAnimation'
import WarehouseAnimation from '@/components/animations/WarehouseAnimation'
import SuccessAnimation from '@/components/animations/SuccessAnimation'
import RatingModal from '@/components/RatingModal'
import ReturnRefundModal from '@/components/ReturnRefundModal'
import Image from 'next/image'
import { productDummyData } from '@/assets/assets'
import { enrichOrder } from '@/lib/productImageHelper'
import EmptyAnimation from '@/components/animations/EmptyAnimation'
import { getUserOrders, initializeUserProfile, migrateUserData } from '@/lib/userDataStorage'
import { LiveIndicator, SyncStatus } from '@/components/ConnectionStatus'
import PaymentAnimation from '@/components/animations/PaymentAnimation'
import MultiProductTracking from '@/components/MultiProductTracking'
import { setupRealtimeSync, subscribeToOrderUpdates } from '@/lib/realtimeSync'
import toast from 'react-hot-toast'

export default function MyOrders() {
    const router = useRouter()
    const [orders, setOrders] = useState([])
    const [expandedOrder, setExpandedOrder] = useState(null)
    const [returnModal, setReturnModal] = useState(null)
    const [showReturnRefundModal, setShowReturnRefundModal] = useState(false)
    const [selectedOrderForReturn, setSelectedOrderForReturn] = useState(null)
    const [returnReason, setReturnReason] = useState('')
    const [returnedItems, setReturnedItems] = useState({})
    const [helpMessage, setHelpMessage] = useState('')
    const [ratingModal, setRatingModal] = useState(null)
    const [lastSync, setLastSync] = useState(null)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [orderConfirmedAnimation, setOrderConfirmedAnimation] = useState(null)
    const [returnAcceptedAnimation, setReturnAcceptedAnimation] = useState(null)
    const [returnPickedUpAnimation, setReturnPickedUpAnimation] = useState(null)
    const [refundCompletedAnimation, setRefundCompletedAnimation] = useState(null)
    const [cancelledAnimation, setCancelledAnimation] = useState(null)
    const [loadingInvoice, setLoadingInvoice] = useState(null)

    const mapStatusToTrackingStep = (status) => {
         const statusLower = String(status).toLowerCase().replace(/ /g, '_')
         // Return/Refund flow
         if (statusLower.includes('refund')) return 7
         if (statusLower.includes('return') && statusLower.includes('pick')) return 6
         if (statusLower.includes('return') && statusLower.includes('accept')) return 5
         // Cancelled
         if (statusLower.includes('cancelled')) return 8
         // Normal flow
         if (statusLower.includes('delivered')) return 4
         if (statusLower.includes('shipped') || statusLower.includes('in_transit') || statusLower.includes('transit') || statusLower.includes('shipping')) return 3
         if (statusLower.includes('processing') || statusLower.includes('confirmed')) return 2
         if (statusLower.includes('order_placed') || (statusLower.includes('order') && statusLower.includes('placed'))) return 1
         return 1
     }

    const getFormattedStatus = (status) => {
        const statusLower = String(status).toLowerCase().replace(/ /g, '_')
        if (statusLower.includes('delivered')) return 'Delivered'
        if (statusLower.includes('shipped') || statusLower.includes('in_transit') || statusLower.includes('transit') || statusLower.includes('shipping')) return 'In Transit'
        if (statusLower.includes('processing') || statusLower.includes('confirmed')) return 'Processing'
        if (statusLower.includes('order_placed') || statusLower.includes('order') && statusLower.includes('placed')) return 'Order Placed'
        if (statusLower.includes('cancelled')) return 'Cancelled'
        if (statusLower.includes('return') && statusLower.includes('accept')) return 'Return Accepted'
        if (statusLower.includes('return') && statusLower.includes('pick')) return 'Return Picked Up'
        if (statusLower.includes('refund')) return 'Refund Completed'
        return status
    }

    const getPaymentStatus = (isPaid, paymentMethod, status) => {
         // If order is marked as paid, show PAID regardless of method
         if (isPaid === true) return 'PAID'
         
         // For COD orders that haven't been explicitly marked as paid
         if ((paymentMethod === 'COD' || paymentMethod === 'cod') && isPaid !== true) {
             // COD is payment on delivery
             return 'PAYMENT ON DELIVERY'
         }
         
         // For online/cashfree/card payments
         if (paymentMethod === 'CASHFREE' || paymentMethod === 'STRIPE' || paymentMethod === 'CARD') {
             // If not explicitly marked as paid, assume pending
             return isPaid === true ? 'PAID' : 'PAYMENT_PENDING'
         }
         
         // Default
         if (status === 'PAYMENT_PENDING') return 'PAYMENT_PENDING'
         return isPaid === true ? 'PAID' : 'PAYMENT_PENDING'
     }

    const handlePayNow = async (order) => {
        try {
            toast.loading('Redirecting to payment gateway...')
            
            // Recreate Cashfree order for payment
            const response = await fetch('/api/payments/cashfree-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    orderId: order.id,
                    retryPayment: true
                })
            })

            const data = await response.json()
            
            if (data.success) {
                // Redirect to Cashfree payment page
                // ALWAYS use sandbox for testing
                const cashfree = window.Cashfree({ mode: 'sandbox' })
                cashfree.checkout({
                    paymentSessionId: data.paymentSessionId,
                    returnUrl: `${window.location.origin}/order-success/${order.id}`
                })
            } else {
                toast.error(data.message || 'Failed to initiate payment')
            }
        } catch (error) {
            console.error('Pay Now Error:', error)
            
            // Show user-friendly error message
            if (error.message.includes('authentication') || error.message.includes('credentials')) {
                toast.error('Payment gateway configuration error. Please contact support.', {
                    duration: 6000
                })
            } else if (error.message.includes('timeout') || error.message.includes('connection')) {
                toast.error('Connection timeout. Please check your internet and try again.', {
                    duration: 5000
                })
            } else {
                toast.error(error.message || 'Something went wrong. Please try again.')
            }
        }
    }

    const getAnimationForStatus = (status) => {
        const statusLower = String(status).toLowerCase()
        if (statusLower.includes('order_placed')) return 'payment'
        if (statusLower.includes('processing') || statusLower.includes('confirmed')) return 'warehouse'
        if (statusLower.includes('in_transit') || statusLower.includes('transit') || statusLower.includes('shipping')) return 'delivery'
        if (statusLower.includes('delivered')) return 'success'
        return 'warehouse'
    }

    const buildTrackingSteps = (status) => {
        const step = mapStatusToTrackingStep(status)
        const today = new Date().toLocaleDateString()
        const statusLower = String(status).toLowerCase().replace(/ /g, '_')
        
        // Cancelled flow
        if (statusLower.includes('cancelled')) {
            return [
                { label: 'Order Placed', date: today, completed: true },
                { label: 'Cancelled', date: today, completed: true }
            ]
        }
        
        // Return/Refund flow
        if (statusLower.includes('return') || statusLower.includes('refund')) {
            return [
                { label: 'Order Delivered', date: today, completed: true },
                { label: 'Return Accepted', date: step >= 5 ? today : 'Pending', completed: step >= 5 },
                { label: 'Return Picked Up', date: step >= 6 ? today : 'Pending', completed: step >= 6 },
                { label: 'Refund Completed', date: step >= 7 ? today : 'Pending', completed: step >= 7 }
            ]
        }
        
        // Normal order flow
        return [
            { label: 'Order Placed', date: today, completed: true },
            { label: 'Processing', date: step >= 2 ? today : 'Pending', completed: step >= 2 },
            { label: 'Shipped', date: step >= 3 ? today : 'Pending', completed: step >= 3 },
            { label: 'Delivery', date: step >= 4 ? today : 'Pending', completed: step >= 4 }
        ]
    }

    // Reusable loadOrders function
    const loadOrders = useCallback(async (email) => {
        try {
            // Try to fetch from database first
            const headers = { 'Content-Type': 'application/json' }

            // Add JWT token from localStorage if available
            const token = localStorage.getItem('token')
            if (token) {
                headers['Authorization'] = `Bearer ${token}`
            }

            console.log('📦 Loading orders for:', email)
            
            let ordersToDisplay = []
            let useAPIData = false

            try {
                const response = await fetch('/api/orders/get-user-orders', {
                    method: 'POST',  // Changed to POST to send email in body
                    headers,
                    credentials: 'include', // Include cookies for session
                    body: JSON.stringify({ email }) // Send email as fallback
                })

                if (response.ok) {
                    const data = await response.json()

                    if (data.success && data.orders && data.orders.length > 0) {
                        console.log(`✅ Loaded ${data.orders.length} orders from API`)
                        ordersToDisplay = data.orders.map(order => {
                            const status = getFormattedStatus(order.status)
                            const paymentStatus = getPaymentStatus(order.isPaid, order.paymentMethod, order.status)
                            return {
                                id: order.id,
                                date: new Date(order.createdAt).toLocaleDateString(),
                                total: order.total,
                                status: status,
                                isPaid: order.isPaid,
                                paymentMethod: order.paymentMethod,
                                paymentStatus: paymentStatus,
                                items: (order.items || []).map(item => ({
                                    id: item.id,
                                    name: item.name,
                                    price: item.price,
                                    qty: item.quantity,
                                    productId: item.productId,
                                    product: item.product
                                })),
                                address: order.address ? `${order.address.street}, ${order.address.city}, ${order.address.state} ${order.address.zip}` : 'Address not available',
                                coupon: order.coupon,
                                tracking: {
                                    step: mapStatusToTrackingStep(order.status),
                                    steps: buildTrackingSteps(order.status)
                                }
                            };
                        })
                        useAPIData = true
                    }
                } else {
                    console.log(`⚠️ API returned ${response.status}, falling back to localStorage`)
                }
            } catch (apiErr) {
                console.log('⚠️ API fetch failed, using localStorage:', apiErr.message)
            }

            // Fallback to localStorage if API didn't work
            if (!useAPIData) {
                const userOrders = getUserOrders(email)
                if (userOrders && userOrders.length > 0) {
                    console.log(`✅ Loaded ${userOrders.length} orders from localStorage`)
                    ordersToDisplay = userOrders.map(order => {
                        const enrichedOrder = enrichOrder(order);
                        const status = getFormattedStatus(order.status)
                        return {
                            id: order.id,
                            date: new Date(order.createdAt).toLocaleDateString(),
                            total: order.total,
                            status: status,
                            isPaid: order.isPaid,
                            paymentMethod: order.paymentMethod,
                            paymentStatus: getPaymentStatus(order.isPaid, order.paymentMethod, order.status),
                            items: (enrichedOrder.orderItems || []).map(item => ({
                                id: item.productId,
                                name: item.product?.name || 'Product',
                                price: item.price,
                                qty: item.quantity,
                                productId: item.productId,
                                product: item.product
                            })),
                            address: `${order.address?.street}, ${order.address?.city}, ${order.address?.state} ${order.address?.zipCode}`,
                            coupon: order.coupon,
                            tracking: {
                                step: mapStatusToTrackingStep(order.status),
                                steps: buildTrackingSteps(order.status)
                            }
                        };
                    })
                }
            }

            setOrders(ordersToDisplay)
            setLastSync(new Date())
        } catch (error) {
            console.error('❌ Error loading orders:', error)
            // Fallback to localStorage
            const userOrders = getUserOrders(email)
            let ordersToDisplay = []
            if (userOrders && userOrders.length > 0) {
                console.log(`✅ Loaded ${userOrders.length} orders from localStorage (catch fallback)`)
                ordersToDisplay = userOrders.map(order => {
                    const enrichedOrder = enrichOrder(order);
                    const status = getFormattedStatus(order.status)
                    return {
                        id: order.id,
                        date: new Date(order.createdAt).toLocaleDateString(),
                        total: order.total,
                        status: status,
                        isPaid: order.isPaid,
                        paymentMethod: order.paymentMethod,
                        paymentStatus: getPaymentStatus(order.isPaid, order.paymentMethod, order.status),
                        items: (enrichedOrder.orderItems || []).map(item => ({
                            id: item.productId,
                            name: item.product?.name || 'Product',
                            price: item.price,
                            qty: item.quantity,
                            productId: item.productId,
                            product: item.product
                        })),
                        address: `${order.address?.street}, ${order.address?.city}, ${order.address?.state} ${order.address?.zipCode}`,
                        coupon: order.coupon,
                        tracking: {
                            step: mapStatusToTrackingStep(order.status),
                            steps: buildTrackingSteps(order.status)
                        }
                    };
                })
            }
            setOrders(ordersToDisplay)
            setLastSync(new Date())
        }
    }, [])

    // Load Animations
    useEffect(() => {
        const animations = [
            { url: '/animations/Order Confirmed.json', setter: setOrderConfirmedAnimation },
            { url: '/animations/Order packed.json', setter: setReturnAcceptedAnimation },
            { url: '/animations/return.json', setter: setReturnPickedUpAnimation },
            { url: '/animations/Collecting Money.json', setter: setRefundCompletedAnimation },
            { url: '/animations/Cancelled Parcel.json', setter: setCancelledAnimation }
        ]
        
        animations.forEach(({ url, setter }) => {
            fetch(url)
                .then(res => res.json())
                .then(data => {
                    if (data && data.v) {
                        setter(data)
                    }
                })
                .catch(err => console.warn(`⚠️ Failed to load animation ${url}:`, err))
        })
    }, [])

    // Refresh function
    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true)
        const userData = localStorage.getItem('user')
        if (userData) {
            const user = JSON.parse(userData)
            loadOrders(user.email)
        }
        setTimeout(() => setIsRefreshing(false), 500)
    }, [loadOrders])

    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (!userData) {
            router.push('/login')
            return
        }

        try {
            const user = JSON.parse(userData)
            const email = user.email

            if (!email) {
                router.push('/login')
                return
            }

            // Migrate and initialize user data
            migrateUserData(email)
            initializeUserProfile(email, user)

            // Load orders
            loadOrders(email)

            // Listen for order status updates from admin
            const handleStatusUpdate = (event) => {
                const { orderId, newStatus, order: updatedOrderFromAdmin } = event.detail
                
                console.log('📡 Order status update received in My Orders:', { orderId, newStatus })
                
                setOrders(prevOrders =>
                    prevOrders.map(order => {
                        if (order.id === orderId) {
                            // Use the full updated order from admin if available
                            if (updatedOrderFromAdmin) {
                                const status = getFormattedStatus(updatedOrderFromAdmin.status)
                                const paymentStatus = getPaymentStatus(updatedOrderFromAdmin.isPaid, updatedOrderFromAdmin.paymentMethod, updatedOrderFromAdmin.status)
                                return {
                                    ...order,
                                    status: status,
                                    isPaid: updatedOrderFromAdmin.isPaid,
                                    paymentStatus: paymentStatus,
                                    tracking: {
                                        step: mapStatusToTrackingStep(updatedOrderFromAdmin.status),
                                        steps: buildTrackingSteps(updatedOrderFromAdmin.status)
                                    }
                                }
                            } else {
                                // Fallback: update with just status
                                return {
                                    ...order,
                                    status: getFormattedStatus(newStatus),
                                    paymentStatus: getPaymentStatus(order.isPaid, order.paymentMethod, newStatus),
                                    tracking: {
                                        step: mapStatusToTrackingStep(newStatus),
                                        steps: buildTrackingSteps(newStatus)
                                    }
                                }
                            }
                        }
                        return order
                    })
                )
                setLastSync(new Date())
            }

            window.addEventListener('orderStatusUpdated', handleStatusUpdate)

            // Set up real-time sync with polling
            const cleanupSync = setupRealtimeSync(email, (updatedOrders) => {
                // Transform API data to display format
                const transformedOrders = updatedOrders.map(order => {
                    const status = getFormattedStatus(order.status)
                    const paymentStatus = getPaymentStatus(order.isPaid, order.paymentMethod, order.status)
                    return {
                        id: order.id,
                        date: new Date(order.createdAt).toLocaleDateString(),
                        total: order.total,
                        status: status,
                        isPaid: order.isPaid,
                        paymentMethod: order.paymentMethod,
                        paymentStatus: paymentStatus,
                        items: (order.items || order.orderItems || []).map(item => ({
                            id: item.id || item.productId,
                            name: item.name || item.product?.name || 'Product',
                            price: item.price,
                            qty: item.quantity || item.qty,
                            productId: item.productId,
                            product: item.product
                        })),
                        address: order.address ? `${order.address.street}, ${order.address.city}, ${order.address.state} ${order.address.zip}` : 'Address not available',
                        coupon: order.coupon,
                        tracking: {
                            step: mapStatusToTrackingStep(order.status),
                            steps: buildTrackingSteps(order.status)
                        }
                    }
                })
                setOrders(transformedOrders)
                setLastSync(new Date())
            })

            // Also subscribe to event-based updates for instant notifications
            const unsubscribe = subscribeToOrderUpdates(({ orderId, newStatus, order: updatedOrderFromAdmin }) => {
                console.log('📡 Order status update received:', { orderId, newStatus })
                setOrders(prevOrders =>
                    prevOrders.map(order => {
                        if (order.id === orderId) {
                            if (updatedOrderFromAdmin) {
                                const status = getFormattedStatus(updatedOrderFromAdmin.status)
                                const paymentStatus = getPaymentStatus(updatedOrderFromAdmin.isPaid, updatedOrderFromAdmin.paymentMethod, updatedOrderFromAdmin.status)
                                return {
                                    ...order,
                                    status: status,
                                    isPaid: updatedOrderFromAdmin.isPaid,
                                    paymentStatus: paymentStatus,
                                    tracking: {
                                        step: mapStatusToTrackingStep(updatedOrderFromAdmin.status),
                                        steps: buildTrackingSteps(updatedOrderFromAdmin.status)
                                    }
                                }
                            } else {
                                return {
                                    ...order,
                                    status: getFormattedStatus(newStatus),
                                    paymentStatus: getPaymentStatus(order.isPaid, order.paymentMethod, newStatus),
                                    tracking: {
                                        step: mapStatusToTrackingStep(newStatus),
                                        steps: buildTrackingSteps(newStatus)
                                    }
                                }
                            }
                        }
                        return order
                    })
                )
                setLastSync(new Date())
            })

            return () => {
                window.removeEventListener('orderStatusUpdated', handleStatusUpdate)
                cleanupSync()
                unsubscribe()
            }
        } catch (error) {
            console.error('Error loading user orders:', error)
            router.push('/login')
        }
    }, [router, loadOrders])

    const getStatusColor = (status) => {
        switch (status) {
            case 'Delivered':
                return 'bg-green-100 text-green-800'
            case 'In Transit':
                return 'bg-blue-100 text-blue-800'
            case 'Processing':
                return 'bg-yellow-100 text-yellow-800'
            case 'Cancelled':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-slate-100 text-slate-800'
        }
    }

    const isWithin7Days = (orderDateOrOrder) => {
        // Handle both order object with deliveredAt or just a date
        let orderDateObj
        if (typeof orderDateOrOrder === 'object' && orderDateOrOrder.deliveredAt) {
            orderDateObj = new Date(orderDateOrOrder.deliveredAt)
        } else if (typeof orderDateOrOrder === 'object' && orderDateOrOrder.date) {
            orderDateObj = new Date(orderDateOrOrder.date)
        } else {
            orderDateObj = new Date(orderDateOrOrder)
        }
        
        const currentDate = new Date()
        const differenceInTime = currentDate - orderDateObj
        const differenceInDays = differenceInTime / (1000 * 3600 * 24)
        return differenceInDays <= 7
    }

    const handleReturnSubmit = () => {
        if (returnModal && returnReason) {
            setReturnedItems(prev => ({
                ...prev,
                [returnModal.orderId]: {
                    itemId: returnModal.itemId,
                    reason: returnReason,
                    status: 'Return Initiated',
                    date: new Date().toISOString().split('T')[0]
                }
            }))
            setReturnModal(null)
            setReturnReason('')
            alert('Return/Exchange request submitted successfully. Our team will contact you within 24 hours.')
        }
    }

    const handleCancelOrder = (orderId) => {
        if (window.confirm('Are you sure you want to cancel this order?')) {
            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order.id === orderId ? { ...order, status: 'Cancelled' } : order
                )
            )
            alert('Order cancelled successfully. A refund will be processed within 5-7 business days.')
        }
    }

    const handleShareOrder = (order) => {
        const trackingLink = `${window.location.origin}/track/${order.id}`
        const text = `Check out my order ${order.id}. Track it here:`

        if (navigator.share) {
            navigator.share({
                title: `Order ${order.id} Tracking`,
                text: text,
                url: trackingLink
            }).catch(err => console.log('Error sharing:', err))
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(trackingLink)
            alert('Tracking link copied to clipboard!')
        }
    }

    const handleGenerateInvoice = async (orderId) => {
        try {
            setLoadingInvoice(orderId)
            
            // Open invoice in new window
            const invoiceUrl = `/api/orders/${orderId}/invoice`
            window.open(invoiceUrl, '_blank', 'width=800,height=900')
            
            toast.success('Invoice opened in new window. Use Print to save as PDF.')
        } catch (error) {
            console.error('Error generating invoice:', error)
            toast.error('Failed to generate invoice. Please try again.')
        } finally {
            setLoadingInvoice(null)
        }
    }

    if (orders.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="min-h-[70vh] flex items-center justify-center mx-6"
            >
                <div className="text-center">
                    <EmptyAnimation width="250px" height="250px" />
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 mt-4">No Orders Yet</h1>
                    <p className="text-slate-600 dark:text-slate-400 mb-8">You haven't placed any orders yet</p>
                    <Link href="/shop" className="inline-flex items-center gap-2 px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium">
                        <ShoppingBag size={18} />
                        Start Shopping
                    </Link>
                </div>
            </motion.div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-6 my-10 max-w-4xl mx-auto"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl">
                        <Package size={28} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">My Orders</h1>
                        <p className="text-slate-500 dark:text-slate-400">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Link
                        href="/complaints-queries"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center gap-2"
                    >
                        <HelpCircle size={18} />
                        Complaints & Queries
                    </Link>
                    <LiveIndicator isLive={true} />
                    <SyncStatus
                        lastSync={lastSync}
                        onRefresh={handleRefresh}
                        isRefreshing={isRefreshing}
                    />
                </div>
            </div>

            <div className="space-y-4">
                <AnimatePresence>
                    {orders.map((order, orderIndex) => (
                        <motion.div
                            key={order.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: orderIndex * 0.1 }}
                            className="bg-white dark:bg-slate-800 rounded-xl shadow-md dark:shadow-lg overflow-hidden border border-slate-100 dark:border-slate-700"
                        >
                            <div
                                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                                className="p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition flex items-center justify-between"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-2 flex-wrap">
                                        <h3 className="font-bold text-slate-800 dark:text-white">{order.items.map(item => item.name).join(', ')}</h3>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                            order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                                            order.paymentStatus === 'PAYMENT ON DELIVERY' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 
                                            'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                                        }`}>
                                            {order.paymentStatus}
                                        </span>
                                        {order.paymentStatus === 'PAYMENT_PENDING' && (order.paymentMethod === 'CASHFREE' || order.paymentMethod === 'CARD' || order.paymentMethod === 'STRIPE') && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handlePayNow(order)
                                                }}
                                                className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full text-sm font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                                            >
                                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-pink-100">Pay Now</span>
                                                <span className="text-xs opacity-90">& enjoy hassle-free delivery</span>
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Order Date: {order.date}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{order.items.length} item(s) - ₹{order.total}</p>
                                </div>
                                <ChevronDown
                                    size={24}
                                    className={`text-slate-600 dark:text-slate-400 transition ${expandedOrder === order.id ? 'rotate-180' : ''}`}
                                />
                            </div>

                            {expandedOrder === order.id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t border-slate-200 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-900/50"
                                >
                                    {/* Order ID Section */}
                                    <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Order ID:</p>
                                        <p className="font-mono text-lg font-semibold text-slate-800 dark:text-white break-all">{order.id}</p>
                                    </div>

                                    {/* Show Payment Animation for PAYMENT_PENDING orders */}
                                    {order.paymentStatus === 'PAYMENT_PENDING' && (
                                        <div className="mb-6 flex flex-col items-center">
                                            <PaymentAnimation width="250px" height="250px" />
                                            <motion.p
                                                className="text-lg font-bold text-orange-600 mt-2"
                                                animate={{
                                                    scale: [1, 1.1, 1],
                                                    opacity: [0.8, 1, 0.8]
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                }}
                                            >
                                                PAYMENT PENDING
                                            </motion.p>
                                        </div>
                                    )}
                                    {/* Order Confirmed - Order Placed Status */}
                                    {order.status === 'Order Placed' && order.paymentStatus === 'PAID' && (
                                        <div className="mb-6 flex flex-col items-center">
                                            {orderConfirmedAnimation ? (
                                                <Lottie
                                                    animationData={orderConfirmedAnimation}
                                                    loop={true}
                                                    autoplay={true}
                                                    style={{
                                                        width: '250px',
                                                        height: '250px'
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-64 h-64 bg-slate-200 rounded-lg flex items-center justify-center text-slate-500">
                                                    Loading animation...
                                                </div>
                                            )}
                                            <motion.p
                                                className="text-lg font-bold text-green-600 mt-2"
                                                animate={{
                                                    scale: [1, 1.1, 1],
                                                    opacity: [0.8, 1, 0.8]
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                }}
                                            >
                                                ORDER CONFIRMED
                                            </motion.p>
                                        </div>
                                    )}
                                    {/* Warehouse - Processing Orders */}
                                    {order.status === 'Processing' && order.paymentStatus === 'PAID' && (
                                        <div className="mb-6 flex flex-col items-center">
                                            <WarehouseAnimation width="250px" height="250px" />
                                            <motion.p
                                                className="text-lg font-bold text-yellow-600 mt-2"
                                                animate={{
                                                    scale: [1, 1.1, 1],
                                                    opacity: [0.8, 1, 0.8]
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                }}
                                            >
                                                PROCESSING
                                            </motion.p>
                                        </div>
                                    )}
                                    {/* Delivery - In Transit Orders */}
                                    {order.status === 'In Transit' && (
                                        <div className="mb-6 flex flex-col items-center">
                                            <ScooterAnimation width="250px" height="250px" />
                                            <motion.p
                                                className="text-lg font-bold text-blue-600 mt-2"
                                                animate={{
                                                    scale: [1, 1.1, 1],
                                                    opacity: [0.8, 1, 0.8]
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                }}
                                            >
                                                IN TRANSIT
                                            </motion.p>
                                        </div>
                                    )}
                                    {/* Success - Delivered Orders */}
                                    {order.status === 'Delivered' && (
                                        <div className="mb-6 flex flex-col items-center">
                                            <SuccessAnimation width="250px" height="250px" />
                                            <motion.p
                                                className="text-lg font-bold text-green-600 mt-2"
                                                animate={{
                                                    scale: [1, 1.1, 1],
                                                    opacity: [0.8, 1, 0.8]
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                }}
                                            >
                                                DELIVERED
                                            </motion.p>
                                        </div>
                                    )}
                                    {/* Return Accepted */}
                                    {String(order.status).toLowerCase().includes('return') && String(order.status).toLowerCase().includes('accept') && returnAcceptedAnimation && (
                                        <div className="mb-6 flex flex-col items-center">
                                            <Lottie
                                                animationData={returnAcceptedAnimation}
                                                loop={true}
                                                style={{ width: '250px', height: '250px' }}
                                            />
                                            <motion.p
                                                className="text-lg font-bold text-orange-600 mt-2"
                                                animate={{
                                                    scale: [1, 1.1, 1],
                                                    opacity: [0.8, 1, 0.8]
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                }}
                                            >
                                                RETURN ACCEPTED
                                            </motion.p>
                                        </div>
                                    )}
                                    {/* Return Picked Up */}
                                    {String(order.status).toLowerCase().includes('return') && String(order.status).toLowerCase().includes('pick') && returnPickedUpAnimation && (
                                        <div className="mb-6 flex flex-col items-center">
                                            <Lottie
                                                animationData={returnPickedUpAnimation}
                                                loop={true}
                                                style={{ width: '250px', height: '250px' }}
                                            />
                                            <motion.p
                                                className="text-lg font-bold text-orange-600 mt-2"
                                                animate={{
                                                    scale: [1, 1.1, 1],
                                                    opacity: [0.8, 1, 0.8]
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                }}
                                            >
                                                RETURN PICKED UP
                                            </motion.p>
                                        </div>
                                    )}
                                    {/* Refund Completed */}
                                    {String(order.status).toLowerCase().includes('refund') && refundCompletedAnimation && (
                                        <div className="mb-6 flex flex-col items-center">
                                            <Lottie
                                                animationData={refundCompletedAnimation}
                                                loop={true}
                                                style={{ width: '250px', height: '250px' }}
                                            />
                                            <motion.p
                                                className="text-lg font-bold text-green-600 mt-2"
                                                animate={{
                                                    scale: [1, 1.1, 1],
                                                    opacity: [0.8, 1, 0.8]
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                }}
                                            >
                                                REFUND COMPLETED
                                            </motion.p>
                                        </div>
                                    )}
                                    {/* Cancelled */}
                                    {String(order.status).toLowerCase().includes('cancel') && cancelledAnimation && (
                                        <div className="mb-6 flex flex-col items-center">
                                            <Lottie
                                                animationData={cancelledAnimation}
                                                loop={true}
                                                style={{ width: '250px', height: '250px' }}
                                            />
                                            <motion.p
                                                className="text-lg font-bold text-red-600 mt-2"
                                                animate={{
                                                    scale: [1, 1.1, 1],
                                                    opacity: [0.8, 1, 0.8]
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                }}
                                            >
                                                CANCELLED
                                            </motion.p>
                                        </div>
                                    )}
                                    <div className="mb-6">
                                        <h4 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                            <Truck size={18} className="text-blue-500" />
                                            Order Tracking
                                        </h4>
                                        
                                        {/* Show MultiProductTracking for orders with multiple items */}
                                        {order.items.length > 1 ? (
                                            <MultiProductTracking order={order} items={order.items.map((item, idx) => ({
                                                name: item.name,
                                                quantity: item.qty,
                                                price: item.price,
                                                status: order.status,
                                                shipmentId: `SHP-${order.id.substring(0, 8)}-${idx + 1}`,
                                                trackingNumber: null,
                                                estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                                                deliveredAt: order.status === 'Delivered' ? new Date() : null
                                            }))} />
                                        ) : (
                                            <div className="space-y-4">
                                                {order.tracking.steps.map((step, idx) => (
                                                    <div key={idx} className="flex items-start gap-4">
                                                        <div className="relative flex flex-col items-center">
                                                            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${step.completed ? 'bg-green-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                                                {step.completed && <CheckCircle size={12} className="text-white" />}
                                                            </div>
                                                            {idx < order.tracking.steps.length - 1 && (
                                                                <div className={`w-0.5 h-12 ${step.completed ? 'bg-green-600' : 'bg-slate-300 dark:bg-slate-600'}`} />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-slate-800 dark:text-white">{step.label}</p>
                                                            <p className="text-sm text-slate-600 dark:text-slate-400">{step.date}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-6 border-t border-slate-200 dark:border-slate-700 pt-6">
                                        <h4 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                            <ShoppingBag size={18} className="text-green-500" />
                                            Items
                                        </h4>
                                        <div className="space-y-3">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-start p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-500 transition">
                                                    <div className="flex gap-4 flex-1">
                                                        {/* Product Image */}
                                                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                            {item.product?.images && item.product.images.length > 0 ? (
                                                                <Image
                                                                    src={
                                                                        typeof item.product.images[0] === 'string'
                                                                            ? item.product.images[0]
                                                                            : (item.product.images[0]?.url || item.product.images[0]?.src || item.product.images[0]?.default || item.product.images[0])
                                                                    }
                                                                    alt={item.name}
                                                                    width={80}
                                                                    height={80}
                                                                    className="w-full h-full object-contain"
                                                                    unoptimized={true}
                                                                    onError={(e) => {
                                                                        // Fallback to dummy data or placeholder
                                                                        const dummyProduct = productDummyData.find(p => p.name.toLowerCase() === item.name.toLowerCase())
                                                                        if (dummyProduct?.images?.[0]) {
                                                                            e.target.src = dummyProduct.images[0]
                                                                        } else {
                                                                            e.target.style.display = 'none'
                                                                        }
                                                                    }}
                                                                />
                                                            ) : (
                                                                // Try to find product in dummy data
                                                                (() => {
                                                                    const dummyProduct = productDummyData.find(p => p.name.toLowerCase() === item.name.toLowerCase())
                                                                    return dummyProduct?.images?.[0] ? (
                                                                        <Image
                                                                            src={dummyProduct.images[0]}
                                                                            alt={item.name}
                                                                            width={80}
                                                                            height={80}
                                                                            className="w-full h-full object-contain"
                                                                            unoptimized={true}
                                                                        />
                                                                    ) : (
                                                                        <div className="text-gray-400 dark:text-gray-500 text-center text-xs p-2 flex items-center justify-center">
                                                                            <Package size={20} />
                                                                        </div>
                                                                    )
                                                                })()
                                                            )}
                                                        </div>

                                                        {/* Product Info */}
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-slate-800 dark:text-white">{item.name}</p>
                                                            <p className="text-sm text-slate-600 dark:text-slate-400">Qty: {item.qty}</p>
                                                            <p className="text-sm font-medium text-slate-800 dark:text-white mt-2">₹{item.price}</p>

                                                            {/* Rate Button for Delivered Orders */}
                                                            {order.status === 'Delivered' && (
                                                                <button
                                                                    onClick={() => setRatingModal({ orderId: order.id, productId: item.productId || idx, productName: item.name })}
                                                                    className="mt-2 px-3 py-1.5 rounded text-sm font-medium transition bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 flex items-center gap-2"
                                                                >
                                                                    <Star size={14} />
                                                                    Rate Product
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Rating Modal */}
                                    {ratingModal && <RatingModal ratingModal={ratingModal} setRatingModal={setRatingModal} />}

                                    <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                                        <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300 mb-6">
                                            <MapPin size={16} className="mt-1 flex-shrink-0 text-red-500" />
                                            <div>
                                                <p className="font-medium mb-1 text-slate-800 dark:text-white">Delivery Address</p>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">{order.address}</p>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-3 flex-wrap">
                                            {/* Pay Now Online Button for Pending Payments - Prominent */}
                                            {order.paymentStatus === 'PAYMENT_PENDING' && !order.isPaid && (
                                                <button
                                                    onClick={() => {
                                                        const orderItems = order.items || order.orderItems || []
                                                        if (orderItems.length === 0) {
                                                            toast.error('No items in order')
                                                            return
                                                        }
                                                        sessionStorage.setItem('codPaymentOrder', JSON.stringify({
                                                            orderId: order.id,
                                                            total: order.total,
                                                            items: orderItems
                                                        }))
                                                        router.push(`/cod-payment/${order.id}`)
                                                    }}
                                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-lg transition font-bold text-sm shadow-lg shadow-red-500/50"
                                                >
                                                    <RefreshCw size={18} />
                                                    Pay Now Online & Enjoy Hassle-Free Delivery
                                                </button>
                                            )}
                                            
                                            {/* Generate Invoice Button */}
                                            <button
                                                onClick={() => handleGenerateInvoice(order.id)}
                                                disabled={loadingInvoice === order.id}
                                                className="flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Download invoice as PDF"
                                            >
                                                <ShoppingBag size={16} />
                                                {loadingInvoice === order.id ? 'Generating...' : 'Invoice'}
                                            </button>
                                            <button
                                                onClick={() => handleShareOrder(order)}
                                                className="flex items-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition font-medium text-sm"
                                            >
                                                <Share2 size={16} />
                                                Share Tracking
                                            </button>
                                            {order.status === 'Delivered' && isWithin7Days(order) && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedOrderForReturn(order)
                                                            setShowReturnRefundModal(true)
                                                        }}
                                                        className="flex items-center gap-2 px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition font-medium text-sm"
                                                    >
                                                        <RotateCcw size={16} />
                                                        Return/Replace
                                                    </button>
                                                </>
                                            )}
                                            {order.status === 'Delivered' && !isWithin7Days(order) && (
                                                <p className="text-xs text-slate-500 px-2 py-1">Return period expired (7 days)</p>
                                            )}
                                            {order.status !== 'Delivered' && (
                                                <button
                                                    onClick={() => handleCancelOrder(order.id)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition font-medium text-sm"
                                                >
                                                    <X size={16} />
                                                    Cancel Order
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    setHelpMessage(`Hi! I need help with order ${order.id}. The item was "${order.items[0].name}". `)
                                                    // Trigger chatbot - scroll to chat button
                                                    document.querySelector('[aria-label="Open chat support"]')?.click()
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition font-medium text-sm"
                                            >
                                                <HelpCircle size={16} />
                                                Get Help
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Return/Exchange Modal */}
            <AnimatePresence>
                {returnModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl"
                        >
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Return/Exchange Order</h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">Item: <span className="font-medium text-slate-800 dark:text-white">{returnModal.itemId}</span></p>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Request Type</label>
                                <div className="flex gap-3 mb-4">
                                    <button className="flex-1 px-4 py-2 border-2 border-orange-600 text-orange-600 dark:text-orange-400 rounded-lg font-medium">
                                        Return
                                    </button>
                                    <button className="flex-1 px-4 py-2 border-2 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-lg font-medium hover:border-blue-600 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400">
                                        Exchange
                                    </button>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Reason for Return/Exchange</label>
                                <select
                                    value={returnReason}
                                    onChange={(e) => setReturnReason(e.target.value)}
                                    className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select a reason</option>
                                    <option value="Defective">Defective/Not Working</option>
                                    <option value="Wrong Item">Wrong Item Received</option>
                                    <option value="Not as Expected">Not as Expected</option>
                                    <option value="Damaged">Damaged During Shipping</option>
                                    <option value="Quality Issues">Quality Issues</option>
                                    <option value="Size Issue">Size/Fit Issue</option>
                                    <option value="Color Different">Color Different from Image</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                <p className="text-xs text-blue-700 dark:text-blue-300">
                                    <span className="font-semibold">Note:</span> We offer free pickup and shipping for returns/exchanges. Your refund will be processed within 5-7 business days.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleReturnSubmit}
                                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg font-medium transition"
                                >
                                    Submit Request
                                </button>
                                <button
                                    onClick={() => {
                                        setReturnModal(null)
                                        setReturnReason('')
                                    }}
                                    className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white py-2 rounded-lg font-medium transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* New ReturnRefundModal */}
            {showReturnRefundModal && selectedOrderForReturn && (
                <ReturnRefundModal
                    isOpen={showReturnRefundModal}
                    onClose={() => {
                        setShowReturnRefundModal(false)
                        setSelectedOrderForReturn(null)
                    }}
                    orderId={selectedOrderForReturn.id}
                    onSuccess={() => {
                        setShowReturnRefundModal(false)
                        setSelectedOrderForReturn(null)
                        toast.success('Return request submitted successfully! Check your email for confirmation.')
                        // Refresh orders to show updated status
                        const userData = localStorage.getItem('user')
                        if (userData) {
                            const user = JSON.parse(userData)
                            loadOrders(user.email)
                        }
                    }}
                />
            )}
        </motion.div>
    )
}
