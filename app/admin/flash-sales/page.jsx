'use client'
import { useState, useEffect } from 'react'
import { Flame, Plus, Edit2, Trash2, Eye, EyeOff, ChevronDown, ChevronUp, Gift } from 'lucide-react'
import Link from 'next/link'

export default function FlashSalesPage() {
    const [sales, setSales] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editId, setEditId] = useState(null)
    const [products, setProducts] = useState([])
    const [selectedProducts, setSelectedProducts] = useState({}) // Changed to object for product-wise quantities
    const [expandedProduct, setExpandedProduct] = useState(null)

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        discount: 10,
        maxQuantity: 100,
        startTime: '',
        endTime: '',
        allowCoupons: false,
        allowCrashCash: false
    })
    const [productDiscounts, setProductDiscounts] = useState({}) // Track discount per product

    useEffect(() => {
        fetchSales()
        fetchProducts()
    }, [])

    const fetchSales = async () => {
        try {
            const response = await fetch('/api/admin/flash-sales')
            if (response.ok) {
                const data = await response.json()
                setSales(data)
            }
        } catch (error) {
            console.error('Error fetching sales:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/admin/inventory?limit=500')
            if (response.ok) {
                const data = await response.json()
                // Filter to only show in-stock products (quantity > 0)
                const inStockProducts = (data.products || []).filter(product => product.quantity > 0)
                setProducts(inStockProducts)
            }
        } catch (error) {
            console.error('Error fetching products:', error)
        }
    }

    const handleAddProduct = (productId, product) => {
        if (!selectedProducts[productId]) {
            setSelectedProducts({
                ...selectedProducts,
                [productId]: product.quantity // Default to available stock quantity
            })
            // Set default discount to global discount
            setProductDiscounts({
                ...productDiscounts,
                [productId]: formData.discount
            })
        }
    }

    const handleRemoveProduct = (productId) => {
        const newSelected = { ...selectedProducts }
        delete newSelected[productId]
        setSelectedProducts(newSelected)
        
        const newDiscounts = { ...productDiscounts }
        delete newDiscounts[productId]
        setProductDiscounts(newDiscounts)
    }

    const handleUpdateProductQuantity = (productId, quantity) => {
        if (quantity > 0) {
            setSelectedProducts({
                ...selectedProducts,
                [productId]: quantity
            })
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const selectedProductIds = Object.keys(selectedProducts)
        if (selectedProductIds.length === 0) {
            alert('Select at least one product')
            return
        }

        const payload = {
            ...formData,
            products: selectedProductIds, // Array of product IDs
            productQuantities: selectedProducts, // Object with product-wise quantities
            productDiscounts: productDiscounts, // Object with product-wise discounts
            startTime: new Date(formData.startTime).toISOString(),
            endTime: new Date(formData.endTime).toISOString()
        }

        try {
            const method = editId ? 'PUT' : 'POST'
            const url = editId
                ? `/api/admin/flash-sales?id=${editId}`
                : '/api/admin/flash-sales'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (response.ok) {
                alert(editId ? 'Sale updated!' : 'Sale created!')
                fetchSales()
                resetForm()
            } else {
                alert('Error saving sale')
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error saving sale')
        }
    }

    const handleDelete = async (saleId) => {
        if (!confirm('Delete this flash sale?')) return

        try {
            const response = await fetch(`/api/admin/flash-sales?id=${saleId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                alert('Sale deleted!')
                fetchSales()
            } else {
                alert('Error deleting sale')
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error deleting sale')
        }
    }

    const handleEdit = (sale) => {
        setFormData({
            title: sale.title || '',
            description: sale.description || '',
            discount: parseInt(sale.discount) || 10,
            maxQuantity: parseInt(sale.maxQuantity) || 100,
            startTime: new Date(sale.startTime).toISOString().slice(0, 16),
            endTime: new Date(sale.endTime).toISOString().slice(0, 16)
        })
        // Load product quantities from productQuantities or fall back to old format
        const quantities = sale.productQuantities || {}
        if (Object.keys(quantities).length === 0 && sale.products) {
            // Backward compatibility: convert old array format
            sale.products.forEach(id => {
                quantities[id] = sale.maxQuantity || 100
            })
        }
        setSelectedProducts(quantities)
        setEditId(sale.id)
        setShowForm(true)
    }

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            discount: 10,
            maxQuantity: 100,
            startTime: '',
            endTime: ''
        })
        setSelectedProducts({})
        setProductDiscounts({})
        setEditId(null)
        setShowForm(false)
        setExpandedProduct(null)
    }

    const isActive = (sale) => {
        const now = new Date()
        return now >= new Date(sale.startTime) && now <= new Date(sale.endTime)
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <Flame size={32} className="text-red-600" />
                    <h1 className="text-3xl font-bold">Flash Sales Management</h1>
                </div>
                <button
                    onClick={() => {
                        if (showForm) resetForm()
                        else setShowForm(true)
                    }}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                    <Plus size={20} />
                    {showForm ? 'Cancel' : 'New Sale'}
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg mb-8">
                    <h2 className="text-2xl font-bold mb-4">{editId ? 'Edit Sale' : 'Create Flash Sale'}</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Weekend Flash Sale"
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Discount (%)</label>
                                <input
                                    type="number"
                                    value={formData.discount || ''}
                                    onChange={(e) => setFormData({ ...formData, discount: parseInt(e.target.value) || 10 })}
                                    min="1"
                                    max="100"
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brief description of the sale"
                                rows={2}
                                className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Start Time</label>
                                <input
                                    type="datetime-local"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">End Time</label>
                                <input
                                    type="datetime-local"
                                    value={formData.endTime}
                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Max Quantity</label>
                                <input
                                    type="number"
                                    value={formData.maxQuantity || ''}
                                    onChange={(e) => setFormData({ ...formData, maxQuantity: parseInt(e.target.value) || 100 })}
                                    min="1"
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                    required
                                />
                            </div>
                        </div>

                        {/* Coupon and CrashCash Settings */}
                        <div className="bg-orange-50 dark:bg-orange-950/20 border-2 border-orange-200 dark:border-orange-800 rounded-lg p-4">
                            <h3 className="font-semibold text-orange-900 dark:text-orange-300 mb-3 flex items-center gap-2">
                                <Gift size={18} />
                                Discount Options for Flash Sale Items
                            </h3>
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={formData.allowCoupons}
                                        onChange={(e) => setFormData({ ...formData, allowCoupons: e.target.checked })}
                                        className="w-5 h-5"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium text-sm">Allow Coupon Codes</div>
                                        <div className="text-xs text-slate-500">Customers can apply discount coupons on these flash sale items</div>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={formData.allowCrashCash}
                                        onChange={(e) => setFormData({ ...formData, allowCrashCash: e.target.checked })}
                                        className="w-5 h-5"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium text-sm">Allow CrashCash</div>
                                        <div className="text-xs text-slate-500">Customers can use their CrashCash balance on these flash sale items</div>
                                    </div>
                                </label>
                            </div>
                            <p className="text-xs text-orange-700 dark:text-orange-300 mt-3">
                                💡 Tip: Disable both options to prevent additional discounts on already discounted flash sale items
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Select Products ({Object.keys(selectedProducts).length} selected)
                                <span className="text-xs text-slate-500 ml-2">• Set quantity for each product</span>
                            </label>
                            <div className="border rounded-lg p-4 dark:border-slate-600 max-h-96 overflow-y-auto bg-slate-50 dark:bg-slate-900">
                                <div className="space-y-2">
                                    {products.length === 0 ? (
                                        <p className="text-slate-500">No in-stock products available</p>
                                    ) : (
                                        products.map(product => {
                                            const isSelected = selectedProducts[product.id] !== undefined
                                            const selectedQty = selectedProducts[product.id] || 0

                                            return (
                                                <div key={product.id} className="border dark:border-slate-600 rounded-lg overflow-hidden">
                                                    <div className="flex items-center gap-3 p-3 hover:bg-slate-100 dark:hover:bg-slate-700 bg-white dark:bg-slate-800">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    handleAddProduct(product.id, product)
                                                                } else {
                                                                    handleRemoveProduct(product.id)
                                                                }
                                                            }}
                                                            className="w-4 h-4"
                                                        />
                                                        <div className="flex-1">
                                                            <div className="font-medium text-sm">{product.name}</div>
                                                            <div className="text-xs text-slate-500">
                                                                ₹{product.price.toFixed(2)} •
                                                                <span className="text-green-600 font-semibold ml-1">
                                                                    Available: {product.quantity}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {isSelected && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}
                                                                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"
                                                            >
                                                                {expandedProduct === product.id ? (
                                                                    <ChevronUp size={18} />
                                                                ) : (
                                                                    <ChevronDown size={18} />
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>

                                                    {isSelected && expandedProduct === product.id && (
                                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 border-t dark:border-slate-600 space-y-3">
                                                            <div>
                                                                <label className="block text-sm font-medium mb-2">Flash Sale Quantity</label>
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        max={product.quantity}
                                                                        value={selectedQty}
                                                                        onChange={(e) => handleUpdateProductQuantity(product.id, parseInt(e.target.value) || 0)}
                                                                        className="flex-1 px-3 py-2 border rounded dark:bg-slate-700 dark:border-slate-600 text-sm"
                                                                        placeholder="Enter quantity"
                                                                    />
                                                                    <span className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                                        / {product.quantity}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                                                                    Only {selectedQty} units will be available in this flash sale
                                                                </p>
                                                            </div>

                                                            <div>
                                                                <label className="block text-sm font-medium mb-2">Product Discount (%)</label>
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        max="100"
                                                                        value={productDiscounts[product.id] || formData.discount}
                                                                        onChange={(e) => setProductDiscounts({
                                                                            ...productDiscounts,
                                                                            [product.id]: parseInt(e.target.value) || formData.discount
                                                                        })}
                                                                        className="flex-1 px-3 py-2 border rounded dark:bg-slate-700 dark:border-slate-600 text-sm"
                                                                        placeholder="Enter discount"
                                                                    />
                                                                    <span className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                                        %
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                                                                    Override global discount for this product
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium"
                            >
                                {editId ? 'Update Sale' : 'Create Sale'}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 rounded-lg font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Sales List */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-100 dark:bg-slate-700">
                            <tr>
                                <th className="px-6 py-3 text-left font-semibold">Title</th>
                                <th className="px-6 py-3 text-left font-semibold">Discount</th>
                                <th className="px-6 py-3 text-left font-semibold">Products</th>
                                <th className="px-6 py-3 text-left font-semibold">Start</th>
                                <th className="px-6 py-3 text-left font-semibold">End</th>
                                <th className="px-6 py-3 text-left font-semibold">Status</th>
                                <th className="px-6 py-3 text-left font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                                        No flash sales yet. Create one to get started!
                                    </td>
                                </tr>
                            ) : (
                                sales.map(sale => (
                                    <tr key={sale.id} className="border-t dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
                                        <td className="px-6 py-4 font-medium">{sale.title}</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                                                -{sale.discount}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">{sale.products?.length || 0} products</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {new Date(sale.startTime).toLocaleDateString()} {new Date(sale.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {new Date(sale.endTime).toLocaleDateString()} {new Date(sale.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            {isActive(sale) ? (
                                                <span className="flex items-center gap-2 text-green-600 font-semibold">
                                                    <Eye size={16} /> Active
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-2 text-slate-500">
                                                    <EyeOff size={16} /> Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(sale)}
                                                    className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900 rounded text-blue-600"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(sale.id)}
                                                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Info Box */}
            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                    💡 <strong>Tip:</strong> Flash sales created here will automatically appear on the home page when they're active. The countdown timer will show how much time is left!
                </p>
            </div>
        </div>
    )
}
