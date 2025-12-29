'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, Package, Edit2, Save, X, Trash2, CheckCircle } from 'lucide-react'
import Image from 'next/image'

export default function InventoryManagementPage() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterOutOfStock, setFilterOutOfStock] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [editValues, setEditValues] = useState({})
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'

    useEffect(() => {
        fetchProducts()
    }, [])

    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/admin/inventory?limit=500')
            if (response.ok) {
                const data = await response.json()
                setProducts(data.products || [])
            }
        } catch (error) {
            console.error('Error fetching products:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleEditClick = (product) => {
        setEditingId(product.id)
        setEditValues({ quantity: product.quantity })
    }

    const handleSaveQuantity = async (productId) => {
        try {
            const newQuantity = parseInt(editValues.quantity) || 0

            const response = await fetch(`/api/admin/inventory/${productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quantity: newQuantity,
                    inStock: newQuantity > 0
                })
            })

            if (response.ok) {
                const updatedProduct = await response.json()
                setProducts(products.map(p => p.id === productId ? updatedProduct : p))
                setEditingId(null)
                toast.success('✅ Stock updated successfully', { duration: 3000 })
            }
        } catch (error) {
            console.error('Error updating stock:', error)
            toast.error('Failed to update stock', { duration: 3000 })
        }
    }

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesFilter = filterOutOfStock ? product.quantity === 0 : true
        return matchesSearch && matchesFilter
    })

    if (loading) {
         return (
             <div className="p-6 text-center">
                 <p className="text-slate-600">Loading inventory...</p>
             </div>
         )
     }

     return (
         <div className="p-6 bg-slate-50">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Package className="text-blue-600" size={32} />
                        <h1 className="text-3xl font-bold text-slate-800">Inventory Management</h1>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <p className="text-slate-600 text-sm">Total Products</p>
                        <p className="text-3xl font-bold text-slate-800">{products.length}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <p className="text-slate-600 text-sm">In Stock</p>
                        <p className="text-3xl font-bold text-green-600">
                            {products.filter(p => p.quantity > 0).length}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <p className="text-slate-600 text-sm">Out of Stock</p>
                        <p className="text-3xl font-bold text-red-600">
                            {products.filter(p => p.quantity === 0).length}
                        </p>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filterOutOfStock}
                                    onChange={(e) => setFilterOutOfStock(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <span className="text-slate-700">Show Out of Stock Only</span>
                            </label>
                            <span className="text-sm text-slate-500">
                                {filteredProducts.length} products
                            </span>
                        </div>
                    </div>
                </div>

                {/* Products Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-100 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Product</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Price</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Current Stock</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredProducts.map(product => (
                                    <tr key={product.id} className="hover:bg-slate-50 transition">
                                        {/* Product Info */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {product.images && product.images[0] && (
                                                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100">
                                                        <Image
                                                            src={product.images[0]}
                                                            alt={product.name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-semibold text-slate-800 line-clamp-1">
                                                        {product.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500">{product.id.slice(0, 8)}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Price */}
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-slate-800">
                                                {currency}{product.price.toFixed(2)}
                                            </p>
                                        </td>

                                        {/* Stock */}
                                        <td className="px-6 py-4">
                                            {editingId === product.id ? (
                                                <input
                                                    type="number"
                                                    value={editValues.quantity}
                                                    onChange={(e) => setEditValues({ quantity: e.target.value })}
                                                    min="0"
                                                    className="w-20 px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            ) : (
                                                <p className="font-bold text-lg text-slate-800">
                                                    {product.quantity}
                                                </p>
                                            )}
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {product.quantity > 0 ? (
                                                    <>
                                                        <CheckCircle size={18} className="text-green-600" />
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                            product.quantity > 10
                                                                ? 'bg-green-100 text-green-700'
                                                                : product.quantity > 0
                                                                    ? 'bg-orange-100 text-orange-700'
                                                                    : 'bg-red-100 text-red-700'
                                                        }`}>
                                                            {product.quantity > 10
                                                                ? 'In Stock'
                                                                : product.quantity > 0
                                                                    ? 'Low Stock'
                                                                    : 'Out of Stock'
                                                            }
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <AlertCircle size={18} className="text-red-600" />
                                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                                            Out of Stock
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {editingId === product.id ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleSaveQuantity(product.id)}
                                                            className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition"
                                                            title="Save"
                                                        >
                                                            <Save size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingId(null)}
                                                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"
                                                            title="Cancel"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => handleEditClick(product)}
                                                        className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredProducts.length === 0 && (
                        <div className="p-12 text-center">
                            <AlertCircle className="mx-auto mb-4 text-slate-400" size={48} />
                            <p className="text-slate-600">
                                {searchQuery || filterOutOfStock ? 'No products found' : 'No products available'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Legend */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">Stock Status Guide:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-600"></div>
                            <span className="text-blue-800">In Stock (10+ units)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-orange-600"></div>
                            <span className="text-blue-800">Low Stock (1-9 units)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-600"></div>
                            <span className="text-blue-800">Out of Stock (0 units)</span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
