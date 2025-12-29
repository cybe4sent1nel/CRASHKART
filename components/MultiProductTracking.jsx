'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Package, Truck, CheckCircle, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Lottie from 'lottie-react'

/**
 * Multi-Product Tracking Component
 * Displays separate tracking for each product in a multi-product order
 */
export default function MultiProductTracking({ order, items }) {
    const [expandedShipment, setExpandedShipment] = useState(null)
    const [animations, setAnimations] = useState({})

    // URL-based animation mapping
    const ANIMATION_MAP = {
        'ORDER_PLACED': '/animations/Order Confirmed.json',
        'PROCESSING': '/animations/Warehouse and delivery.json',
        'SHIPPED': '/animations/Waiting the Courier.json',
        'DELIVERED': '/animations/Success celebration.json',
        'CANCELLED': '/animations/Cancelled Parcel.json',
        'RETURN_ACCEPTED': '/animations/Order packed.json',
        'RETURN_PICKED_UP': '/animations/return.json',
        'REFUND_COMPLETED': '/animations/Collecting Money.json'
    }

    // Map shipment status to step number
    const getTrackingStep = (status) => {
        const statusLower = String(status).toLowerCase().replace(/ /g, '_')
        // Return/Refund flow
        if (statusLower.includes('refund')) return 7
        if (statusLower.includes('return') && statusLower.includes('pick')) return 6
        if (statusLower.includes('return') && statusLower.includes('accept')) return 5
        // Cancelled
        if (statusLower.includes('cancelled')) return 8
        // Normal flow
        if (statusLower.includes('delivered')) return 4
        if (statusLower.includes('shipped') || statusLower.includes('in_transit')) return 3
        if (statusLower.includes('processing')) return 2
        return 1
    }

    // Get normalized status
    const normalizeStatus = (status) => {
        if (!status) return 'ORDER_PLACED'
        const upper = String(status).toUpperCase().replace(/ /g, '_')
        if (upper.includes('REFUND')) return 'REFUND_COMPLETED'
        if (upper.includes('RETURN') && upper.includes('PICK')) return 'RETURN_PICKED_UP'
        if (upper.includes('RETURN') && upper.includes('ACCEPT')) return 'RETURN_ACCEPTED'
        if (upper.includes('CANCEL')) return 'CANCELLED'
        if (upper.includes('DELIVER')) return 'DELIVERED'
        if (upper.includes('SHIP')) return 'SHIPPED'
        if (upper.includes('PROCESS')) return 'PROCESSING'
        return 'ORDER_PLACED'
    }

    // Load animations on mount
    useEffect(() => {
        const loadAnimations = async () => {
            const loadedAnimations = {}
            for (const [key, url] of Object.entries(ANIMATION_MAP)) {
                try {
                    const response = await fetch(url)
                    if (response.ok) {
                        const data = await response.json()
                        if (data && data.v) {
                            loadedAnimations[key] = data
                        }
                    }
                } catch (err) {
                    console.error(`Failed to load animation for ${key}:`, err)
                }
            }
            setAnimations(loadedAnimations)
        }
        loadAnimations()
    }, [])

    // Build tracking steps based on status
    const buildTrackingSteps = (status) => {
        const step = getTrackingStep(status)
        const today = new Date().toLocaleDateString()
        const statusLower = String(status).toLowerCase().replace(/ /g, '_')
        
        // Cancelled flow
        if (statusLower.includes('cancelled')) {
            return [
                { label: 'Order Placed', completed: true, date: today },
                { label: 'Cancelled', completed: true, date: today }
            ]
        }
        
        // Return/Refund flow
        if (statusLower.includes('return') || statusLower.includes('refund')) {
            return [
                { label: 'Order Delivered', completed: true, date: today },
                { label: 'Return Accepted', completed: step >= 5, date: step >= 5 ? today : 'Pending' },
                { label: 'Return Picked Up', completed: step >= 6, date: step >= 6 ? today : 'Pending' },
                { label: 'Refund Completed', completed: step >= 7, date: step >= 7 ? today : 'Pending' }
            ]
        }
        
        // Normal flow
        return [
            { label: 'Order Placed', completed: true, date: today },
            { label: 'Processing', completed: step >= 2, date: step >= 2 ? today : 'Pending' },
            { label: 'Shipped', completed: step >= 3, date: step >= 3 ? today : 'Pending' },
            { label: 'Delivered', completed: step >= 4, date: step >= 4 ? today : 'Pending' }
        ]
    }

    const getStatusColor = (status) => {
        const statusLower = String(status).toLowerCase()
        if (statusLower.includes('refund')) return 'bg-green-100 text-green-700 border-green-300'
        if (statusLower.includes('return')) return 'bg-orange-100 text-orange-700 border-orange-300'
        if (statusLower.includes('cancelled')) return 'bg-red-100 text-red-700 border-red-300'
        if (statusLower.includes('delivered')) return 'bg-green-100 text-green-700 border-green-300'
        if (statusLower.includes('shipped') || statusLower.includes('in_transit')) return 'bg-blue-100 text-blue-700 border-blue-300'
        if (statusLower.includes('processing')) return 'bg-yellow-100 text-yellow-700 border-yellow-300'
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }

    const getStatusIcon = (status) => {
        const statusLower = String(status).toLowerCase()
        if (statusLower.includes('refund')) return <CheckCircle size={20} />
        if (statusLower.includes('return')) return <Package size={20} />
        if (statusLower.includes('cancelled')) return <Clock size={20} />
        if (statusLower.includes('delivered')) return <CheckCircle size={20} />
        if (statusLower.includes('shipped') || statusLower.includes('in_transit')) return <Truck size={20} />
        if (statusLower.includes('processing')) return <Package size={20} />
        return <Clock size={20} />
    }

    return (
        <div className="space-y-4">
            <div className="text-lg font-bold text-slate-800 dark:text-white mb-6">
                📦 Track Your Products ({items?.length || 0} items)
            </div>

            {items && items.map((item, idx) => {
                const shipmentId = item.shipmentId || `SHP-${idx + 1}`
                const isExpanded = expandedShipment === shipmentId
                const trackingSteps = buildTrackingSteps(item.status)
                const normalizedStatus = normalizeStatus(item.status)
                const animationData = animations[normalizedStatus]

                return (
                    <motion.div
                        key={shipmentId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800"
                    >
                        {/* Header - Click to Expand */}
                        <motion.button
                            onClick={() => setExpandedShipment(isExpanded ? null : shipmentId)}
                            className="w-full px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                                    {idx + 1}
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-slate-800 dark:text-white">{item.name}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Qty: {item.quantity} | Shipment: {shipmentId}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className={`px-3 py-1 rounded-full border text-sm font-medium flex items-center gap-2 ${getStatusColor(item.status)}`}>
                                    {getStatusIcon(item.status)}
                                    {String(item.status).replace(/_/g, ' ')}
                                </div>
                                <motion.div
                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <ChevronDown size={20} className="text-slate-600 dark:text-slate-400" />
                                </motion.div>
                            </div>
                        </motion.button>

                        {/* Expandable Content */}
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                                >
                                    <div className="p-6 space-y-6">
                                        {/* Animation Display */}
                                        <div className="flex justify-center items-center h-64 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 rounded-xl">
                                            {animationData ? (
                                                <Lottie
                                                    animationData={animationData}
                                                    loop={true}
                                                    style={{ width: '200px', height: '200px' }}
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">Loading animation...</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Tracking Information */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg">
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Shipment ID</p>
                                                <p className="font-mono font-semibold text-slate-800 dark:text-white">{shipmentId}</p>
                                            </div>
                                            {item.trackingNumber && (
                                                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg">
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Tracking Number</p>
                                                    <p className="font-mono font-semibold text-slate-800 dark:text-white">{item.trackingNumber}</p>
                                                </div>
                                            )}
                                            {item.estimatedDelivery && (
                                                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg">
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Est. Delivery</p>
                                                    <p className="font-semibold text-slate-800 dark:text-white">
                                                        {new Date(item.estimatedDelivery).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            )}
                                            {item.deliveredAt && (
                                                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg">
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Delivered</p>
                                                    <p className="font-semibold text-green-600 dark:text-green-400">
                                                        {new Date(item.deliveredAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Tracking Steps */}
                                        <div className="mt-8">
                                            <h4 className="font-semibold text-slate-800 dark:text-white mb-6">Shipment Timeline</h4>
                                            <div className="space-y-4">
                                                {trackingSteps.map((step, stepIdx) => {
                                                    const isCompleted = step.completed
                                                    const isActive = stepIdx === getTrackingStep(item.status) - 1

                                                    return (
                                                        <div key={stepIdx} className="flex items-start gap-4">
                                                            {/* Timeline Dot */}
                                                            <div className="flex flex-col items-center">
                                                                <motion.div
                                                                    initial={{ scale: 0.8, opacity: 0 }}
                                                                    animate={{ scale: 1, opacity: 1 }}
                                                                    transition={{ delay: stepIdx * 0.1 }}
                                                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition ${
                                                                        isCompleted
                                                                            ? 'bg-green-500 scale-110'
                                                                            : isActive
                                                                            ? 'bg-blue-500 animate-pulse'
                                                                            : 'bg-gray-300'
                                                                    }`}
                                                                >
                                                                    {isCompleted ? '✓' : '○'}
                                                                </motion.div>
                                                                {stepIdx < trackingSteps.length - 1 && (
                                                                    <motion.div
                                                                        initial={{ scaleY: 0 }}
                                                                        animate={{ scaleY: 1 }}
                                                                        transition={{ delay: stepIdx * 0.1 + 0.2, duration: 0.5 }}
                                                                        className={`w-1 h-12 transition ${
                                                                            isCompleted ? 'bg-green-500' : 'bg-gray-300'
                                                                        }`}
                                                                    />
                                                                )}
                                                            </div>

                                                            {/* Step Info */}
                                                            <div className="pt-2 flex-1">
                                                                <p className={`font-semibold transition ${
                                                                    isCompleted
                                                                        ? 'text-green-600 dark:text-green-400'
                                                                        : isActive
                                                                        ? 'text-blue-600 dark:text-blue-400'
                                                                        : 'text-slate-500 dark:text-slate-400'
                                                                }`}>
                                                                    {step.label}
                                                                </p>
                                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                                    {step.date}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        {/* Product Details */}
                                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg">
                                            <h4 className="font-semibold text-slate-800 dark:text-white mb-3">Product Details</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-600 dark:text-slate-400">Product:</span>
                                                    <span className="font-semibold text-slate-800 dark:text-white">{item.name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-600 dark:text-slate-400">Quantity:</span>
                                                    <span className="font-semibold text-slate-800 dark:text-white">{item.quantity} units</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-600 dark:text-slate-400">Price:</span>
                                                    <span className="font-semibold text-slate-800 dark:text-white">₹{item.price}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-600 dark:text-slate-400">Subtotal:</span>
                                                    <span className="font-bold text-purple-600 dark:text-purple-400">₹{(item.price * item.quantity).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )
            })}

            {/* Summary Card */}
            <motion.div
                className="mt-8 p-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: items.length * 0.1 }}
            >
                <h4 className="font-bold text-lg mb-3">📊 Order Summary</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                        <p className="opacity-90">Total Items</p>
                        <p className="font-bold text-lg">{items?.length || 0}</p>
                    </div>
                    <div>
                        <p className="opacity-90">Order ID</p>
                        <p className="font-mono font-bold text-sm">{order?.id?.substring(0, 8)}</p>
                    </div>
                    <div>
                        <p className="opacity-90">Order Total</p>
                        <p className="font-bold text-lg">₹{order?.total?.toFixed(2)}</p>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
