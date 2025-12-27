'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    ComposedChart, RadialBarChart, RadialBar
} from 'recharts'
import { TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, Package, Clock, Activity, Target, Zap } from 'lucide-react'

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899']

export default function AdvancedAnalytics({ analyticsData, orders = [], timePeriod = 'monthly' }) {
    const [activeTab, setActiveTab] = useState('overview')
    
    // Process data for different visualizations
    const processChartData = () => {
        if (!orders || orders.length === 0) return []
        
        const groupedData = {}
        orders.forEach(order => {
            const date = new Date(order.createdAt)
            let key = ''
            
            switch(timePeriod) {
                case 'daily':
                    key = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                    break
                case 'weekly':
                    const weekNum = Math.ceil((date.getDate()) / 7)
                    key = `Week ${weekNum}`
                    break
                case 'monthly':
                    key = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
                    break
                case 'yearly':
                    key = date.getFullYear().toString()
                    break
                default:
                    key = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
            }
            
            if (!groupedData[key]) {
                groupedData[key] = { name: key, orders: 0, revenue: 0, avgOrderValue: 0, paidOrders: 0 }
            }
            groupedData[key].orders += 1
            groupedData[key].revenue += order.total || 0
            if (order.isPaid) groupedData[key].paidOrders += 1
        })
        
        return Object.values(groupedData).map(d => ({
            ...d,
            avgOrderValue: d.orders > 0 ? d.revenue / d.orders : 0,
            conversionRate: d.orders > 0 ? (d.paidOrders / d.orders * 100).toFixed(1) : 0
        }))
    }

    // Process order status distribution
    const getStatusDistribution = () => {
        if (!orders || orders.length === 0) return []
        
        const statusCounts = {}
        orders.forEach(order => {
            const status = order.status || 'UNKNOWN'
            statusCounts[status] = (statusCounts[status] || 0) + 1
        })
        
        return Object.entries(statusCounts).map(([name, value], index) => ({
            name: name.replace(/_/g, ' '),
            value,
            fill: COLORS[index % COLORS.length]
        }))
    }

    // Process payment method distribution
    const getPaymentMethodDistribution = () => {
        if (!orders || orders.length === 0) return []
        
        const methodCounts = {}
        orders.forEach(order => {
            const method = order.paymentMethod || 'Unknown'
            methodCounts[method] = (methodCounts[method] || 0) + 1
        })
        
        return Object.entries(methodCounts).map(([name, value], index) => ({
            name,
            value,
            fill: COLORS[index % COLORS.length]
        }))
    }

    // Calculate peak hours
    const getPeakHours = () => {
        if (!orders || orders.length === 0) return []
        
        const hourCounts = Array(24).fill(0)
        orders.forEach(order => {
            const hour = new Date(order.createdAt).getHours()
            hourCounts[hour] += 1
        })
        
        return hourCounts.map((count, hour) => ({
            hour: `${hour.toString().padStart(2, '0')}:00`,
            orders: count,
            isPeak: count === Math.max(...hourCounts)
        }))
    }

    // Calculate weekly pattern
    const getWeeklyPattern = () => {
        if (!orders || orders.length === 0) return []
        
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const dayCounts = Array(7).fill(0)
        const dayRevenue = Array(7).fill(0)
        
        orders.forEach(order => {
            const day = new Date(order.createdAt).getDay()
            dayCounts[day] += 1
            dayRevenue[day] += order.total || 0
        })
        
        return days.map((name, i) => ({
            name,
            orders: dayCounts[i],
            revenue: dayRevenue[i],
            avgValue: dayCounts[i] > 0 ? dayRevenue[i] / dayCounts[i] : 0
        }))
    }

    const chartData = processChartData()
    const statusData = getStatusDistribution()
    const paymentData = getPaymentMethodDistribution()
    const peakHoursData = getPeakHours()
    const weeklyData = getWeeklyPattern()

    // Calculate insights
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0)
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0
    const paidOrdersCount = orders.filter(o => o.isPaid).length
    const conversionRate = orders.length > 0 ? (paidOrdersCount / orders.length * 100).toFixed(1) : 0
    const peakHour = peakHoursData.find(h => h.isPeak)?.hour || 'N/A'
    const bestDay = weeklyData.reduce((best, day) => day.orders > best.orders ? day : best, { orders: 0, name: 'N/A' })

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Activity },
        { id: 'revenue', label: 'Revenue', icon: DollarSign },
        { id: 'orders', label: 'Orders', icon: ShoppingCart },
        { id: 'traffic', label: 'Traffic Patterns', icon: Clock }
    ]

    return (
        <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-4 text-white shadow-lg"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-100 text-sm">Total Revenue</p>
                            <p className="text-2xl font-bold">₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                        </div>
                        <DollarSign className="h-10 w-10 text-red-200" />
                    </div>
                    <div className="mt-2 flex items-center text-sm text-red-100">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        <span>+{analyticsData?.overview?.revenueGrowth || 0}% vs last period</span>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm">Avg Order Value</p>
                            <p className="text-2xl font-bold">₹{avgOrderValue.toFixed(0)}</p>
                        </div>
                        <Target className="h-10 w-10 text-blue-200" />
                    </div>
                    <div className="mt-2 flex items-center text-sm text-blue-100">
                        <Zap className="h-4 w-4 mr-1" />
                        <span>Based on {orders.length} orders</span>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white shadow-lg"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm">Conversion Rate</p>
                            <p className="text-2xl font-bold">{conversionRate}%</p>
                        </div>
                        <TrendingUp className="h-10 w-10 text-green-200" />
                    </div>
                    <div className="mt-2 flex items-center text-sm text-green-100">
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        <span>{paidOrdersCount} paid orders</span>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm">Peak Activity</p>
                            <p className="text-2xl font-bold">{peakHour}</p>
                        </div>
                        <Clock className="h-10 w-10 text-purple-200" />
                    </div>
                    <div className="mt-2 flex items-center text-sm text-purple-100">
                        <Activity className="h-4 w-4 mr-1" />
                        <span>Best day: {bestDay.name}</span>
                    </div>
                </motion.div>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeTab === tab.id
                                ? 'bg-white dark:bg-slate-700 text-red-600 shadow-md'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-white/50'
                        }`}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {activeTab === 'overview' && (
                    <>
                        {/* Revenue & Orders Combined */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg col-span-full"
                        >
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Revenue & Order Trends</h3>
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: '#1e293b', 
                                                border: 'none', 
                                                borderRadius: '12px',
                                                color: '#fff'
                                            }}
                                            formatter={(value, name) => [
                                                name === 'revenue' ? `₹${value.toLocaleString()}` : value,
                                                name === 'revenue' ? 'Revenue' : 'Orders'
                                            ]}
                                        />
                                        <Legend />
                                        <Area 
                                            yAxisId="left"
                                            type="monotone" 
                                            dataKey="revenue" 
                                            stroke="#ef4444" 
                                            strokeWidth={2}
                                            fill="url(#colorRevenue)" 
                                            name="Revenue"
                                        />
                                        <Bar 
                                            yAxisId="right"
                                            dataKey="orders" 
                                            fill="#3b82f6" 
                                            radius={[4, 4, 0, 0]}
                                            name="Orders"
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* Order Status Distribution */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg"
                        >
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Order Status Distribution</h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: '#1e293b', 
                                                border: 'none', 
                                                borderRadius: '12px',
                                                color: '#fff'
                                            }}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* Payment Methods */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg"
                        >
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Payment Methods</h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={paymentData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <YAxis dataKey="name" type="category" tick={{ fill: '#64748b', fontSize: 12 }} width={80} />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: '#1e293b', 
                                                border: 'none', 
                                                borderRadius: '12px',
                                                color: '#fff'
                                            }}
                                        />
                                        <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                                            {paymentData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    </>
                )}

                {activeTab === 'revenue' && (
                    <>
                        {/* Revenue Trend */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg col-span-full"
                        >
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Revenue Trend</h3>
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `₹${v/1000}k`} />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: '#1e293b', 
                                                border: 'none', 
                                                borderRadius: '12px',
                                                color: '#fff'
                                            }}
                                            formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="revenue" 
                                            stroke="#22c55e" 
                                            strokeWidth={3}
                                            fill="url(#colorRev)" 
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* Avg Order Value */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg col-span-full"
                        >
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Average Order Value Trend</h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `₹${v}`} />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: '#1e293b', 
                                                border: 'none', 
                                                borderRadius: '12px',
                                                color: '#fff'
                                            }}
                                            formatter={(value) => [`₹${value.toFixed(0)}`, 'Avg Order Value']}
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="avgOrderValue" 
                                            stroke="#8b5cf6" 
                                            strokeWidth={3}
                                            dot={{ fill: '#8b5cf6', r: 5 }}
                                            activeDot={{ r: 8 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    </>
                )}

                {activeTab === 'orders' && (
                    <>
                        {/* Orders Trend */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg col-span-full"
                        >
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Orders Trend</h3>
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/>
                                                <stop offset="100%" stopColor="#1d4ed8" stopOpacity={1}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: '#1e293b', 
                                                border: 'none', 
                                                borderRadius: '12px',
                                                color: '#fff'
                                            }}
                                        />
                                        <Bar 
                                            dataKey="orders" 
                                            fill="url(#colorOrders)" 
                                            radius={[8, 8, 0, 0]}
                                            name="Orders"
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* Conversion Rate */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg col-span-full"
                        >
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Payment Conversion Rate</h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <YAxis tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: '#1e293b', 
                                                border: 'none', 
                                                borderRadius: '12px',
                                                color: '#fff'
                                            }}
                                            formatter={(value) => [`${value}%`, 'Conversion Rate']}
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="conversionRate" 
                                            stroke="#f97316" 
                                            strokeWidth={3}
                                            dot={{ fill: '#f97316', r: 5 }}
                                            activeDot={{ r: 8 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    </>
                )}

                {activeTab === 'traffic' && (
                    <>
                        {/* Peak Hours */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg col-span-full"
                        >
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Order Activity by Hour</h3>
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={peakHoursData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 10 }} interval={2} />
                                        <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: '#1e293b', 
                                                border: 'none', 
                                                borderRadius: '12px',
                                                color: '#fff'
                                            }}
                                        />
                                        <Bar dataKey="orders" radius={[4, 4, 0, 0]}>
                                            {peakHoursData.map((entry, index) => (
                                                <Cell 
                                                    key={`cell-${index}`} 
                                                    fill={entry.isPeak ? '#ef4444' : '#3b82f6'} 
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-4 flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <span className="text-slate-600 dark:text-slate-400">Peak Hour</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                    <span className="text-slate-600 dark:text-slate-400">Normal Hours</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Weekly Pattern */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg"
                        >
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Weekly Sales Pattern</h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={weeklyData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `₹${v/1000}k`} />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: '#1e293b', 
                                                border: 'none', 
                                                borderRadius: '12px',
                                                color: '#fff'
                                            }}
                                            formatter={(value, name) => [
                                                name === 'revenue' ? `₹${value.toLocaleString()}` : value,
                                                name
                                            ]}
                                        />
                                        <Legend />
                                        <Bar yAxisId="left" dataKey="orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Orders" />
                                        <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} name="Revenue" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* Insights Panel */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-lg text-white"
                        >
                            <h3 className="text-lg font-semibold mb-4">📊 Traffic Insights</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg">
                                    <Clock className="h-5 w-5 text-blue-400" />
                                    <div>
                                        <p className="text-sm text-slate-300">Peak Hour</p>
                                        <p className="font-semibold">{peakHour}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg">
                                    <TrendingUp className="h-5 w-5 text-green-400" />
                                    <div>
                                        <p className="text-sm text-slate-300">Best Day</p>
                                        <p className="font-semibold">{bestDay.name} ({bestDay.orders} orders)</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg">
                                    <Activity className="h-5 w-5 text-purple-400" />
                                    <div>
                                        <p className="text-sm text-slate-300">Avg Daily Orders</p>
                                        <p className="font-semibold">{(orders.length / 7).toFixed(1)} orders/day</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg">
                                    <Target className="h-5 w-5 text-orange-400" />
                                    <div>
                                        <p className="text-sm text-slate-300">Recommendation</p>
                                        <p className="text-sm">Run promotions during {peakHour} on {bestDay.name} for max impact</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </div>
        </div>
    )
}
