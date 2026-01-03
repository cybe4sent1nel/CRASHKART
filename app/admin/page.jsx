'use client'
import Loading from "@/components/Loading"
import OrdersAreaChart from "@/components/OrdersAreaChart"
import AdvancedAnalytics from "@/components/AdvancedAnalytics"
import { CircleDollarSignIcon, ShoppingBasketIcon, StoreIcon, TagsIcon, Plus, Trash2, Edit2, TrendingUp, Users, Package, RefreshCw, X, BarChart3 } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import { Spotlight } from "@/components/ui/spotlight"
import { Globe } from "@/components/ui/globe"
import Image from "next/image"
import { toast } from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"

export default function AdminDashboard() {
    const router = useRouter()
    const [authorized, setAuthorized] = useState(false)
    const [loading, setLoading] = useState(true)
    const [showAddProduct, setShowAddProduct] = useState(false)
    const [products, setProducts] = useState([])
    const [orders, setOrders] = useState([])
    const [analyticsData, setAnalyticsData] = useState(null)
    const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false)
    const [dashboardData, setDashboardData] = useState({
        products: 0,
        revenue: 0,
        orders: 0,
        stores: 0,
        allOrders: [],
    })
    const [timePeriod, setTimePeriod] = useState('monthly') // 'daily', 'weekly', 'monthly', 'yearly'
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        mrp: 0,
        price: 0,
        category: "",
    })
    const [images, setImages] = useState({ 1: null, 2: null, 3: null, 4: null })
    const [imagePreviewUrls, setImagePreviewUrls] = useState({ 1: null, 2: null, 3: null, 4: null })
    const [formLoading, setFormLoading] = useState(false)
    const [selectedOrderForStatus, setSelectedOrderForStatus] = useState(null)
    const [showStatusModal, setShowStatusModal] = useState(false)
    const [expandedStatusOrder, setExpandedStatusOrder] = useState(null)
    const [lastOrderSync, setLastOrderSync] = useState(null)
    const [isSyncingOrders, setIsSyncingOrders] = useState(false)

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'

    useEffect(() => {
        // Check if login page is still processing
        const isLoginProcessing = sessionStorage.getItem('adminLoginProcessing') === 'true'
        if (isLoginProcessing) {
            // Wait for login page to finish processing
            return
        }

        // Check if user is authenticated as admin with 2FA verified
        const isDemoMode = localStorage.getItem('isDemoMode') === 'true'
        const admin2FAVerified = sessionStorage.getItem('admin2FAVerified') === 'true' || localStorage.getItem('admin2FAVerified') === 'true'
        const isAdmin = localStorage.getItem('isAdmin') === 'true'

        // Check if main admin is logged in (but not yet 2FA verified)
        const userEmail = localStorage.getItem('user')
            ? JSON.parse(localStorage.getItem('user'))?.email
            : localStorage.getItem('googleUser')
                ? JSON.parse(localStorage.getItem('googleUser'))?.email
                : null
        const isMainAdminLoggedIn = userEmail === 'crashkart.help@gmail.com'

        // Allow access if:
        // 1. Demo mode is enabled, OR
        // 2. User is verified admin with 2FA
        if (isDemoMode || (admin2FAVerified && isAdmin)) {
            setAuthorized(true)
        } else if (isMainAdminLoggedIn && !admin2FAVerified) {
            // Main admin logged in but not yet 2FA verified - go to login to verify
            router.push('/admin/login')
        } else if (!userEmail) {
            // Not logged in at all - go to login
            router.push('/admin/login')
        } else {
            // Logged in as regular user trying to access admin - go to login
            router.push('/admin/login')
        }
    }, [router])

    // Fetch dashboard data when authorized
    useEffect(() => {
        if (authorized) {
            fetchDashboardData()

            // Listen for order updates from other pages/instances
            const handleOrderUpdate = (event) => {
                console.log('📡 Order update detected in admin dashboard, refreshing...', event.detail)
                fetchDashboardData()
            }
            
            window.addEventListener('orderStatusUpdated', handleOrderUpdate)

            // Set up real-time polling - refresh every 15 seconds
            const interval = setInterval(() => {
                fetchDashboardData()
            }, 15000)

            // Cleanup
            return () => {
                clearInterval(interval)
                window.removeEventListener('orderStatusUpdated', handleOrderUpdate)
            }
        }
    }, [authorized])

    // Show loading screen while verifying authorization
    if (!authorized) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Verifying authorization...</p>
                </div>
            </div>
        )
    }

    const dashboardCardsData = [
        { title: 'Total Products', value: dashboardData.products, icon: ShoppingBasketIcon, gradient: 'from-blue-500 to-cyan-500' },
        { title: 'Total Revenue', value: currency + dashboardData.revenue, icon: CircleDollarSignIcon, gradient: 'from-green-500 to-emerald-500' },
        { title: 'Total Orders', value: dashboardData.orders, icon: TagsIcon, gradient: 'from-purple-500 to-pink-500' },
        { title: 'Total Stores', value: dashboardData.stores, icon: StoreIcon, gradient: 'from-orange-500 to-red-500' },
    ]

    const categories = ['Electronics', 'Clothing', 'Home & Kitchen', 'Beauty & Health', 'Toys & Games', 'Sports & Outdoors', 'Books & Media', 'Food & Drink', 'Hobbies & Crafts', 'Others']

    const handleImageChange = (imageNumber, file) => {
        if (file) {
            // Store the file
            setImages(prev => ({ ...prev, [imageNumber]: file }))

            // Create preview URL
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreviewUrls(prev => ({ ...prev, [imageNumber]: reader.result }))
            }
            reader.readAsDataURL(file)
        }
    }

    const removeImage = (imageNumber) => {
        setImages(prev => ({ ...prev, [imageNumber]: null }))
        setImagePreviewUrls(prev => ({ ...prev, [imageNumber]: null }))
    }

    const fetchDashboardData = async () => {
        try {
            setIsSyncingOrders(true)
            // Fetch real-time data from API
            const response = await fetch('/api/admin/analytics?period=90', {
                credentials: 'include'
            })

            if (!response.ok) {
                throw new Error('Failed to fetch analytics')
            }

            const data = await response.json()

            if (data.success) {
                const { overview, chartData } = data
                
                // Store full analytics data for advanced charts
                setAnalyticsData(data)

                // Fetch ALL orders without any limit
                console.log('📡 Fetching orders from API...')
                const ordersResponse = await fetch('/api/admin/orders?limit=10000', {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    cache: 'no-store' // Ensure fresh data on every request
                })
                let ordersData = []

                if (ordersResponse.ok) {
                    const ordersJson = await ordersResponse.json()
                    ordersData = ordersJson.orders || []
                    console.log('✅ Orders fetched from API:', ordersData.length)
                    console.log('📊 Total orders in DB:', ordersJson.total)
                    if (ordersData.length > 0) {
                        console.log('🔍 First order:', ordersData[0]?.id, ordersData[0]?.createdAt)
                        console.log('🔍 Last order:', ordersData[ordersData.length - 1]?.id, ordersData[ordersData.length - 1]?.createdAt)
                    }
                } else {
                    const errorText = await ordersResponse.text()
                    console.error('❌ Orders API error:', {
                        status: ordersResponse.status,
                        statusText: ordersResponse.statusText,
                        error: errorText
                    })
                    toast.error(`Failed to load orders: ${ordersResponse.status}`)
                    
                    // Fallback to localStorage if API fails
                    const userOrders = localStorage.getItem('userOrders')
                    if (userOrders) {
                        try {
                            const parsed = JSON.parse(userOrders)
                            ordersData = Array.isArray(parsed) ? parsed : [parsed]
                            console.log('📦 Loaded orders from localStorage:', ordersData.length)
                        } catch (e) {
                            console.error('Failed to parse localStorage orders:', e)
                            ordersData = []
                        }
                    }
                }

                // Fetch products - ONLY from database, no dummy data
                const productsResponse = await fetch('/api/admin/inventory', {
                    credentials: 'include'
                })
                let productsData = []

                if (productsResponse.ok) {
                    const productsJson = await productsResponse.json()
                    productsData = productsJson.products || []
                    console.log('✅ Products fetched from database:', productsData.length)
                } else {
                    console.error('❌ Failed to fetch products from database')
                }

                setProducts(productsData)
                setOrders(ordersData)

                console.log('=== ADMIN REAL-TIME DATA ===')
                console.log('Total orders:', overview.totalOrders)
                console.log('Total revenue:', overview.totalRevenue)
                console.log('Total products:', overview.totalProducts)
                console.log('Orders fetched:', ordersData.length)

                // Generate chart data based on current time period
                const revenueData = generateRevenueData(ordersData, timePeriod)

                // Set dashboard data from API
                setDashboardData({
                    products: overview.totalProducts || 0,
                    revenue: (overview.totalRevenue || 0).toFixed(2),
                    orders: overview.totalOrders || 0,
                    stores: overview.pendingStores || 0,
                    allOrders: revenueData,
                })
                setLastOrderSync(new Date())
            }
        } catch (error) {
            console.error('❌ Error fetching dashboard data:', error)
            toast.error('Failed to load dashboard data. Please check your connection.')

            // DO NOT use dummy data - show empty state instead
            setProducts([])
            setOrders([])
            setDashboardData({
                products: 0,
                revenue: 0,
                orders: 0,
                stores: 0,
                allOrders: [],
            })
        } finally {
            setLoading(false)
            setIsSyncingOrders(false)
        }
    }

    const generateRevenueData = (orders, period) => {
        const today = new Date()
        let dataMap = {}
        let label = ''

        if (period === 'daily') {
            // Last 30 days
            for (let i = 29; i >= 0; i--) {
                const date = new Date(today)
                date.setDate(date.getDate() - i)
                const dateKey = date.toISOString().split('T')[0]
                dataMap[dateKey] = 0
            }
            label = 'date'
        } else if (period === 'weekly') {
            // Last 12 weeks
            for (let i = 11; i >= 0; i--) {
                const date = new Date(today)
                date.setDate(date.getDate() - (i * 7))
                const weekStart = new Date(date)
                weekStart.setDate(date.getDate() - date.getDay())
                const weekKey = `W${Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7)} ${date.toLocaleString('default', { month: 'short' })}`
                dataMap[weekKey] = 0
            }
            label = 'week'
        } else if (period === 'monthly') {
            // Last 12 months
            for (let i = 11; i >= 0; i--) {
                const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
                const monthKey = date.toLocaleString('default', { month: 'short' })
                dataMap[monthKey] = 0
            }
            label = 'month'
        } else if (period === 'yearly') {
            // Last 5 years
            for (let i = 4; i >= 0; i--) {
                const year = today.getFullYear() - i
                dataMap[year] = 0
            }
            label = 'year'
        }

        // Aggregate order totals by period
        orders.forEach(order => {
            const orderDate = new Date(order.createdAt)
            let key = ''

            if (period === 'daily') {
                key = orderDate.toISOString().split('T')[0]
            } else if (period === 'weekly') {
                const weekStart = new Date(orderDate)
                weekStart.setDate(orderDate.getDate() - orderDate.getDay())
                const weekNum = Math.ceil((orderDate.getDate() + new Date(orderDate.getFullYear(), orderDate.getMonth(), 1).getDay()) / 7)
                key = `W${weekNum} ${orderDate.toLocaleString('default', { month: 'short' })}`
            } else if (period === 'monthly') {
                key = orderDate.toLocaleString('default', { month: 'short' })
            } else if (period === 'yearly') {
                key = orderDate.getFullYear()
            }

            if (dataMap.hasOwnProperty(key)) {
                dataMap[key] += parseFloat(order.total)
            }
        })

        return Object.entries(dataMap).map(([period, total]) => ({
            createdAt: period.toString(),
            total: parseFloat(total.toFixed(2))
        }))
    }

    const handleTimePeriodChange = (period) => {
        setTimePeriod(period)
        // Use the current orders from state, not empty array
        const currentOrders = orders.length > 0 ? orders : []
        console.log('Time period changed to:', period, 'Orders count:', currentOrders.length)
        const revenueData = generateRevenueData(currentOrders, period)
        console.log('Generated revenue data:', revenueData)
        setDashboardData(prev => ({
            ...prev,
            allOrders: revenueData
        }))
    }

    const handleAddProduct = async (e) => {
        e.preventDefault()
        setFormLoading(true)

        if (!formData.name || !formData.description || !formData.mrp || !formData.price || !formData.category) {
            toast.error("Please fill all fields")
            setFormLoading(false)
            return
        }

        if (parseInt(formData.price) > parseInt(formData.mrp)) {
            toast.error("Price cannot be greater than MRP")
            setFormLoading(false)
            return
        }

        if (!imagePreviewUrls[1]) {
            toast.error("Please upload at least one image")
            setFormLoading(false)
            return
        }

        // Collect uploaded images (use preview URLs which are base64 encoded)
        const productImages = Object.values(imagePreviewUrls).filter(img => img !== null)

        // Create new product
        const newProduct = {
            id: `prod_${Date.now()}`,
            name: formData.name,
            description: formData.description,
            mrp: parseInt(formData.mrp),
            price: parseInt(formData.price),
            category: formData.category,
            crashCashValue: Math.floor(parseInt(formData.price) / 10),
            crashCashMin: Math.floor(parseInt(formData.price) / 100),
            crashCashMax: Math.floor(parseInt(formData.price) / 10),
            images: productImages.length > 0 ? productImages : ['/placeholder-product.png'],
            storeId: "seller_1",
            inStock: true,
            store: { name: "CrashKart Store", id: "seller_1" },
            rating: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }

        const updatedProducts = [newProduct, ...products]
        setProducts(updatedProducts)

        // Save to localStorage for persistence
        localStorage.setItem('adminProducts', JSON.stringify(updatedProducts))

        setDashboardData(prev => ({
            ...prev,
            products: prev.products + 1
        }))

        // Reset form
        setFormData({ name: "", description: "", mrp: 0, price: 0, category: "" })
        setImages({ 1: null, 2: null, 3: null, 4: null })
        setImagePreviewUrls({ 1: null, 2: null, 3: null, 4: null })
        setShowAddProduct(false)
        toast.success("Product added successfully!")
        setFormLoading(false)
    }

    const handleDeleteProduct = (productId) => {
        const updatedProducts = products.filter(p => p.id !== productId)
        setProducts(updatedProducts)

        // Save to localStorage
        localStorage.setItem('adminProducts', JSON.stringify(updatedProducts))

        setDashboardData(prev => ({
            ...prev,
            products: prev.products - 1
        }))
        toast.success("Product deleted!")
    }

    const handleUpdatePaymentStatus = async (orderId, isPaid) => {
        try {
            const response = await fetch('/api/admin/orders/update-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, isPaid })
            });

            if (!response.ok) {
                throw new Error('Failed to update payment status');
            }

            const data = await response.json();
            
            // Update local state
            const updatedOrders = orders.map(order =>
                (order.id === orderId || order.orderId === orderId) 
                    ? { ...order, isPaid: data.order.isPaid } 
                    : order
            );
            setOrders(updatedOrders);
            
            toast.success(`Payment status updated to ${isPaid ? 'Paid' : 'Pending'}`);
        } catch (error) {
            console.error('Error updating payment status:', error);
            toast.error('Failed to update payment status: ' + error.message);
        }
    }

    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        try {
            // Normalize the status to standard format
            const normalizedStatus = newStatus.toUpperCase().replace(/ /g, '_');
            
            // Update via API
            const response = await fetch('/api/admin/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: orderId,
                    status: normalizedStatus
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.statusText}`);
            }

            const data = await response.json();
            
            // IMPORTANT: Refetch the order to get latest data from database
            const fetchResponse = await fetch(`/api/orders/${orderId}`);
            if (!fetchResponse.ok) {
                throw new Error('Failed to fetch updated order');
            }
            
            const fetchedData = await fetchResponse.json();
            const updatedOrder = fetchedData.order || data.order;

            // Update the order in the orders state with fetched data
            const updatedOrders = orders.map(order =>
                (order.id === orderId || order.orderId === orderId) ? updatedOrder : order
            );
            setOrders(updatedOrders);

            // Save updated orders to localStorage with latest data
            const userOrders = localStorage.getItem('userOrders');
            if (userOrders) {
                try {
                    const parsedOrders = JSON.parse(userOrders);
                    const updatedUserOrders = parsedOrders.map(order =>
                        (order.id === orderId || order.orderId === orderId) ? updatedOrder : order
                    );
                    localStorage.setItem('userOrders', JSON.stringify(updatedUserOrders));
                } catch (e) {
                    console.log('Could not update user orders in localStorage');
                }
            }

            // Also update in allOrders if it exists
            const allOrders = localStorage.getItem('allOrders');
            if (allOrders) {
                try {
                    const parsedOrders = JSON.parse(allOrders);
                    const updatedAllOrders = parsedOrders.map(order =>
                        (order.id === orderId || order.orderId === orderId) ? updatedOrder : order
                    );
                    localStorage.setItem('allOrders', JSON.stringify(updatedAllOrders));
                } catch (e) {
                    console.log('Could not update all orders in localStorage');
                }
            }

            // Dispatch event with full order data so components can update in real-time
            window.dispatchEvent(new CustomEvent('orderStatusUpdated', { 
                detail: { 
                    orderId, 
                    newStatus: normalizedStatus,
                    order: updatedOrder,
                    timestamp: new Date().toISOString()
                } 
            }));

            setShowStatusModal(false);
            setSelectedOrderForStatus(null);
            toast.success(`Order status updated to ${normalizedStatus.replace(/_/g, ' ')}`);
        } catch (error) {
            console.error('Error updating order status:', error);
            toast.error('Failed to update order status: ' + error.message);
        }
    }

    if (loading) return <Loading />

    return (
        <div className="text-slate-500 dark:text-slate-400 relative min-h-screen">
            <Spotlight className="absolute top-0 left-0 w-full h-[600px] pointer-events-none" fill="rgba(59, 130, 246, 0.08)" />
            <div className="relative z-10">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl dark:text-slate-200">Admin <span className="text-slate-800 dark:text-white font-medium">Dashboard</span></h1>
                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Real-time monitoring and management</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchDashboardData}
                            className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg transition"
                        >
                            <RefreshCw size={18} />
                            Refresh
                        </button>
                        <button
                            onClick={() => setShowAddProduct(!showAddProduct)}
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
                        >
                            <Plus size={18} />
                            Add Product
                        </button>
                    </div>
                </div>

                {/* Add Product Form */}
                <AnimatePresence>
                    {showAddProduct && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 my-6 shadow-lg"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Add New Product</h3>
                                <button onClick={() => setShowAddProduct(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleAddProduct} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Product Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Enter product name"
                                        className="w-full p-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Enter product description"
                                        rows={3}
                                        className="w-full p-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 resize-none"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">MRP ({currency})</label>
                                        <input
                                            type="number"
                                            name="mrp"
                                            value={formData.mrp}
                                            onChange={e => setFormData({ ...formData, mrp: e.target.value })}
                                            placeholder="0"
                                            className="w-full p-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Price ({currency})</label>
                                        <input
                                            type="number"
                                            name="price"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            placeholder="0"
                                            className="w-full p-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full p-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                        required
                                    >
                                        <option value="">Select a category</option>
                                        {categories.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-3">Product Images</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {[1, 2, 3, 4].map((imageNum) => (
                                            <div key={imageNum} className="flex flex-col items-center">
                                                <div className="w-full aspect-square bg-slate-100 dark:bg-slate-700 border-2 border-dashed border-slate-300 dark:border-slate-500 rounded-lg flex items-center justify-center relative overflow-hidden mb-2">
                                                    {imagePreviewUrls[imageNum] ? (
                                                        <>
                                                            <Image
                                                                src={imagePreviewUrls[imageNum]}
                                                                alt={`Product ${imageNum}`}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeImage(imageNum)}
                                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <label className="cursor-pointer w-full h-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition">
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => e.target.files && handleImageChange(imageNum, e.target.files[0])}
                                                                className="hidden"
                                                            />
                                                            <div className="text-center">
                                                                <p className="text-xs text-slate-500 dark:text-slate-400">Click to upload</p>
                                                                <p className="text-xs text-slate-400 dark:text-slate-500">Image {imageNum}</p>
                                                            </div>
                                                        </label>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-400 dark:text-slate-500">{imageNum === 1 ? '(Required)' : '(Optional)'}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        disabled={formLoading}
                                        className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg transition font-medium"
                                    >
                                        {formLoading ? "Adding..." : "Add Product"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddProduct(false)}
                                        className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white px-6 py-2.5 rounded-lg transition font-medium"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Cards with Enhanced Design */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 my-10 mt-4">
                    {
                        dashboardCardsData.map((card, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 flex items-center gap-6 hover:shadow-lg dark:hover:shadow-slate-900/50 transition-all group"
                            >
                                <div className="flex flex-col gap-2 flex-1">
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">{card.title}</p>
                                    <b className="text-2xl font-bold text-slate-800 dark:text-white">{card.value}</b>
                                    <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                        <TrendingUp size={12} />
                                        <span>+12.5%</span>
                                    </div>
                                </div>
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                                    <card.icon size={24} className="text-white" />
                                </div>
                            </motion.div>
                        ))
                    }
                </div>

                {/* Real-Time Revenue Widget */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
                    {/* Total Revenue */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-xl p-6"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-700 dark:text-green-400 text-sm font-medium mb-2">Total Revenue</p>
                                <h3 className="text-3xl font-bold text-green-900 dark:text-green-300">{currency}{dashboardData.revenue}</h3>
                                <p className="text-xs text-green-600 dark:text-green-500 mt-2">From {dashboardData.orders} orders</p>
                            </div>
                            <CircleDollarSignIcon size={40} className="text-green-600 dark:text-green-500 opacity-30" />
                        </div>
                    </motion.div>

                    {/* Average Order Value */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-700 dark:text-blue-400 text-sm font-medium mb-2">Avg Order Value</p>
                                <h3 className="text-3xl font-bold text-blue-900 dark:text-blue-300">
                                    {currency}{dashboardData.orders > 0 ? (dashboardData.revenue / dashboardData.orders).toFixed(2) : '0'}
                                </h3>
                                <p className="text-xs text-blue-600 dark:text-blue-500 mt-2">Per order average</p>
                            </div>
                            <TagsIcon size={40} className="text-blue-600 dark:text-blue-500 opacity-30" />
                        </div>
                    </motion.div>

                    {/* Today's Revenue */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20 border border-red-200 dark:border-red-800 rounded-xl p-6"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-red-700 dark:text-red-400 text-sm font-medium mb-2">Today's Orders</p>
                                <h3 className="text-3xl font-bold text-red-900 dark:text-red-300">
                                    {orders.filter(o => {
                                        const orderDate = new Date(o.createdAt).toDateString()
                                        const today = new Date().toDateString()
                                        return orderDate === today
                                    }).length}
                                </h3>
                                <p className="text-xs text-red-600 dark:text-red-500 mt-2">New orders today</p>
                            </div>
                            <ShoppingBasketIcon size={40} className="text-red-600 dark:text-red-500 opacity-30" />
                        </div>
                    </motion.div>
                </div>

                {/* Orders Analytics */}
                <div className="mt-12">
                    <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Orders Analytics</h2>
                        <div className="flex gap-2 flex-wrap items-center">
                            <button
                                onClick={() => setShowAdvancedAnalytics(!showAdvancedAnalytics)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                                    showAdvancedAnalytics
                                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                <BarChart3 size={16} />
                                {showAdvancedAnalytics ? 'Simple View' : 'Advanced Analytics'}
                            </button>
                            <div className="h-6 w-px bg-slate-300 dark:bg-slate-600 mx-2" />
                            {['daily', 'weekly', 'monthly', 'yearly'].map((period) => (
                                <button
                                    key={period}
                                    onClick={() => handleTimePeriodChange(period)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${timePeriod === period
                                        ? 'bg-red-600 text-white shadow-lg shadow-red-500/30'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    {period.charAt(0).toUpperCase() + period.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {showAdvancedAnalytics ? (
                        <AdvancedAnalytics 
                            analyticsData={analyticsData} 
                            orders={orders} 
                            timePeriod={timePeriod} 
                        />
                    ) : (
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
                            <OrdersAreaChart allOrders={dashboardData.allOrders} timePeriod={timePeriod} />
                        </div>
                    )}
                </div>

                {/* Recent Orders - Order Management */}
                <div className="mt-12">
                    <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                        <h2 className="text-xl font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                            <Package size={22} className="text-red-500" />
                            Order Management ({orders.length})
                            {isSyncingOrders && (
                                <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-xs font-medium">
                                    <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></span>
                                    Syncing...
                                </span>
                            )}
                        </h2>
                        <div className="flex items-center gap-3 flex-wrap">
                            <p className="text-sm text-slate-600 dark:text-slate-400">Click on status to update order</p>
                            {lastOrderSync && (
                                <p className="text-xs text-slate-500 dark:text-slate-500">
                                    Last sync: {lastOrderSync.toLocaleTimeString('en-IN')}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Order ID</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Total</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Status</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Payment</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Date</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders && orders.length > 0 ? (
                                        orders.map((order, index) => (
                                            <tr key={index} className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                                                <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 font-mono">{(order.id || order.orderId || '').substring(0, 12)}</td>
                                                <td className="px-6 py-4 text-sm font-semibold text-slate-800 dark:text-white">{currency}{parseFloat(order.total || 0).toFixed(2)}</td>
                                                <td className="px-6 py-4 text-sm relative">
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => setExpandedStatusOrder(expandedStatusOrder === (order.id || order.orderId) ? null : (order.id || order.orderId))}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer hover:opacity-90 transition ${
                                                                order.status?.toUpperCase() === 'DELIVERED' || order.status === 'delivered'
                                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                                    : order.status?.toUpperCase() === 'PROCESSING' || order.status === 'confirmed'
                                                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                                                        : order.status?.toUpperCase() === 'SHIPPED'
                                                                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                                                                            : order.status?.toUpperCase() === 'CANCELLED'
                                                                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                                            }`}
                                                        >
                                                            {(order.status || 'pending').replace(/_/g, ' ')}
                                                        </button>
                                                        
                                                        {/* Inline Dropdown */}
                                                        {expandedStatusOrder === (order.id || order.orderId) && (
                                                            <div className="absolute top-full left-0 mt-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg z-10 min-w-[150px]">
                                                                {['ORDER_PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURN_ACCEPTED', 'RETURN_PICKED_UP', 'REFUND_COMPLETED'].map((status) => (
                                                                    <button
                                                                        key={status}
                                                                        onClick={() => {
                                                                            handleUpdateOrderStatus(order.id || order.orderId, status)
                                                                            setExpandedStatusOrder(null)
                                                                        }}
                                                                        className={`w-full text-left px-4 py-2 text-sm transition ${order.status === status || order.status?.toUpperCase() === status
                                                                            ? 'bg-blue-500 text-white'
                                                                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                                                                        }`}
                                                                    >
                                                                        {status.replace(/_/g, ' ')}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    <button
                                                        onClick={() => handleUpdatePaymentStatus(order.id || order.orderId, !order.isPaid)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer hover:opacity-80 transition ${
                                                            order.isPaid === true
                                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                                        }`}
                                                        title="Click to toggle payment status"
                                                    >
                                                        {order.isPaid === true ? '✓ Paid' : 'Pending'}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                                    {order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        second: '2-digit'
                                                    }) : order.orderDate || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    <button
                                                        onClick={() => {
                                                            const status = order.status || order.orderStatus || 'Pending'
                                                            setSelectedOrderForStatus({ id: order.id || order.orderId, currentStatus: status })
                                                            setShowStatusModal(true)
                                                        }}
                                                        className="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg text-xs font-medium transition">
                                                        Manage
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                                No orders found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Status Update Modal */}
                <AnimatePresence>
                    {showStatusModal && selectedOrderForStatus && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Update Order Status</h3>
                                    <button
                                        onClick={() => {
                                            setShowStatusModal(false)
                                            setSelectedOrderForStatus(null)
                                        }}
                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Order ID: <span className="font-mono font-medium text-slate-800 dark:text-white">{selectedOrderForStatus.id.substring(0, 12)}</span></p>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Current Status: <span className="font-medium text-slate-800 dark:text-white">{selectedOrderForStatus.currentStatus}</span></p>

                                <div className="space-y-2 mb-6">
                                    {['ORDER_PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURN_ACCEPTED', 'RETURN_PICKED_UP', 'REFUND_COMPLETED'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => handleUpdateOrderStatus(selectedOrderForStatus.id, status)}
                                            className={`w-full p-3 rounded-lg font-medium transition text-sm ${selectedOrderForStatus.currentStatus === status
                                                ? 'bg-red-600 text-white shadow-lg shadow-red-500/30'
                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600'
                                                }`}
                                        >
                                            {status.replace(/_/g, ' ')}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => {
                                        setShowStatusModal(false)
                                        setSelectedOrderForStatus(null)
                                    }}
                                    className="w-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white py-2.5 rounded-lg font-medium transition"
                                >
                                    Cancel
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Products List */}
                <div className="mt-12 mb-20">
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <ShoppingBasketIcon size={22} className="text-blue-500" />
                        All Products ({products.length})
                    </h2>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-900">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Product Name</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Category</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Price</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">MRP</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Stock</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((product) => (
                                        <tr key={product.id} className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                                            <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 font-medium">{product.name}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{product.category}</td>
                                            <td className="px-6 py-4 text-sm font-semibold text-slate-800 dark:text-white">{currency}{product.price}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 line-through">{currency}{product.mrp}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${product.inStock ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                                                    {product.inStock ? 'In Stock' : 'Out of Stock'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm flex gap-2">
                                                <button 
                                                    onClick={() => router.push(`/admin/products/${product.id}`)}
                                                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProduct(product.id)}
                                                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
