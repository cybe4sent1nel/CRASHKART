'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, RefreshCw, Bell, TrendingDown, Package } from 'lucide-react'
import toast from 'react-hot-toast'

export default function InventoryMonitor() {
  const [outOfStockProducts, setOutOfStockProducts] = useState([])
  const [categoryStats, setCategoryStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30) // 30 seconds
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [notifying, setNotifying] = useState(false)
  const [filterCategory, setFilterCategory] = useState('all')

  const fetchOutOfStockProducts = async () => {
    try {
      const params = new URLSearchParams()
      if (filterCategory !== 'all') {
        params.append('category', filterCategory)
      }

      const response = await fetch(`/api/inventory/out-of-stock-notify?${params}`)
      const data = await response.json()

      if (data.success) {
        setOutOfStockProducts(data.data)
        setCategoryStats(data.stats.byCategory)
      }
    } catch (error) {
      console.error('Error fetching out-of-stock products:', error)
      toast.error('Failed to fetch inventory data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOutOfStockProducts()

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchOutOfStockProducts()
      }, refreshInterval * 1000)

      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, filterCategory])

  const handleNotifyOutOfStock = async (productId) => {
    setNotifying(true)
    try {
      const response = await fetch('/api/inventory/out-of-stock-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          notify: true
        })
      })

      if (response.ok) {
        toast.success('Notification sent to seller and admin')
        setSelectedProduct(null)
      } else {
        toast.error('Failed to send notification')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to send notification')
    } finally {
      setNotifying(false)
    }
  }

  const getUniqueCategories = () => {
    const categories = new Set(outOfStockProducts.map(p => p.category))
    return Array.from(categories).sort()
  }

  const filteredProducts = filterCategory === 'all'
    ? outOfStockProducts
    : outOfStockProducts.filter(p => p.category === filterCategory)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 mb-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                <AlertTriangle className="text-red-600" size={32} />
                Inventory Monitor
              </h1>
              <p className="text-slate-600 dark:text-slate-400">Real-time tracking of out-of-stock products</p>
            </div>
            <button
              onClick={() => fetchOutOfStockProducts()}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              Refresh Now
            </button>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-lg p-6 mb-8 shadow-md"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Auto-Refresh
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-slate-700 dark:text-slate-300">Enabled</span>
              </label>
            </div>

            {autoRefresh && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Refresh Every (seconds)
                </label>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                >
                  <option value={10}>10 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>1 minute</option>
                  <option value={300}>5 minutes</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Filter by Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
              >
                <option value="all">All Categories</option>
                {getUniqueCategories().map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Status
              </label>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></div>
                <span className="text-slate-700 dark:text-slate-300">
                  {autoRefresh ? 'Live' : 'Paused'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <div className="bg-red-100 dark:bg-red-900/20 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 dark:text-red-400 font-semibold">Out of Stock</p>
                <p className="text-4xl font-bold text-red-700 dark:text-red-300">{filteredProducts.length}</p>
              </div>
              <Package className="text-red-600 dark:text-red-400" size={40} />
            </div>
          </div>

          <div className="bg-yellow-100 dark:bg-yellow-900/20 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 dark:text-yellow-400 font-semibold">Categories Affected</p>
                <p className="text-4xl font-bold text-yellow-700 dark:text-yellow-300">{categoryStats.length}</p>
              </div>
              <TrendingDown className="text-yellow-600 dark:text-yellow-400" size={40} />
            </div>
          </div>

          <div className="bg-blue-100 dark:bg-blue-900/20 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">Last Updated</p>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  {new Date().toLocaleTimeString()}
                </p>
              </div>
              <RefreshCw className="text-blue-600 dark:text-blue-400" size={40} />
            </div>
          </div>
        </motion.div>

        {/* Products Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden"
        >
          {loading ? (
            <div className="p-8 text-center text-slate-600 dark:text-slate-400">
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="animate-spin" size={20} />
                Loading inventory data...
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-slate-600 dark:text-slate-400">
              <Package size={40} className="mx-auto mb-3 opacity-50" />
              <p className="text-lg">All products are in stock!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 dark:bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Product Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Category</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Price</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Store</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Last Updated</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredProducts.map((product, idx) => (
                      <motion.tr
                        key={product.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.05 * idx }}
                        className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{product.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{product.category}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">₹{product.price}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{product.store.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {new Date(product.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setSelectedProduct(product)}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1"
                          >
                            <Bell size={16} />
                            Notify
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Notify Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="text-red-600" size={28} />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Out-of-Stock Alert</h2>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Product</p>
                  <p className="text-slate-900 dark:text-white font-semibold">{selectedProduct.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Store</p>
                  <p className="text-slate-900 dark:text-white font-semibold">{selectedProduct.store.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Seller Email</p>
                  <p className="text-slate-900 dark:text-white font-semibold">{selectedProduct.store.email}</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                Send out-of-stock notification to the seller and admin?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => handleNotifyOutOfStock(selectedProduct.id)}
                  disabled={notifying}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2 rounded-lg transition"
                >
                  {notifying ? 'Sending...' : 'Send Notification'}
                </button>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="flex-1 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-bold py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
