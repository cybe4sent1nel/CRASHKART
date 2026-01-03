'use client'
import { useState, useEffect } from 'react'
import { Coins, Search, Edit2, Save, X, Plus, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import Image from 'next/image'

export default function CrashCashManagement() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [editingId, setEditingId] = useState(null)
    const [saving, setSaving] = useState(false)
    const [editValues, setEditValues] = useState({
        crashCashValue: 0,
        crashCashMin: 0,
        crashCashMax: 100
    })

    useEffect(() => {
        fetchProducts()
    }, [])

    const fetchProducts = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/admin/inventory?limit=1000', {
                credentials: 'include'
            })
            const data = await response.json()
            if (data.success) {
                setProducts(data.products || [])
            }
        } catch (error) {
            console.error('Error fetching products:', error)
            toast.error('Failed to load products')
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (product) => {
        setEditingId(product._id || product.id)
        setEditValues({
            crashCashValue: product.crashCashValue || 0,
            crashCashMin: product.crashCashMin || 0,
            crashCashMax: product.crashCashMax || 100
        })
    }

    const handleSave = async (productId) => {
        setSaving(true)
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`/api/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    crashCashValue: Number(editValues.crashCashValue),
                    crashCashMin: Number(editValues.crashCashMin),
                    crashCashMax: Number(editValues.crashCashMax)
                })
            })

            if (response.ok) {
                toast.success('CrashCash settings updated!')
                setEditingId(null)
                fetchProducts() // Refresh the list
            } else {
                throw new Error('Failed to update')
            }
        } catch (error) {
            console.error('Error updating product:', error)
            toast.error('Failed to update CrashCash settings')
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        setEditingId(null)
        setEditValues({
            crashCashValue: 0,
            crashCashMin: 0,
            crashCashMax: 100
        })
    }

    const filteredProducts = products.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.id?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="p-8">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                        <Coins className="w-8 h-8 text-orange-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">CrashCash Management</h1>
                        <p className="text-slate-600 dark:text-slate-400">Manage CrashCash earnings for products</p>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search by product name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 dark:text-white"
                />
            </div>

            {/* Products Table */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader className="w-8 h-8 animate-spin text-orange-500" />
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                        Product
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                        Price
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                        CrashCash Earned
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                        Min Redeem
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                        Max Redeem
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {filteredProducts.map((product) => {
                                    const isEditing = editingId === (product._id || product.id)
                                    return (
                                        <tr key={product._id || product.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {product.images && product.images[0] && (
                                                        <Image
                                                            src={product.images[0]}
                                                            alt={product.name}
                                                            width={40}
                                                            height={40}
                                                            className="rounded-lg object-cover"
                                                        />
                                                    )}
                                                    <div>
                                                        <p className="font-semibold text-slate-800 dark:text-white">
                                                            {product.name}
                                                        </p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            ID: {product.id}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                                                ₹{product.price || product.originalPrice}
                                            </td>
                                            <td className="px-6 py-4">
                                                {isEditing ? (
                                                    <input
                                                        type="number"
                                                        value={editValues.crashCashValue}
                                                        onChange={(e) => setEditValues({...editValues, crashCashValue: e.target.value})}
                                                        className="w-24 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                                    />
                                                ) : (
                                                    <span className="text-orange-600 dark:text-orange-400 font-semibold">
                                                        ₹{product.crashCashValue || 0}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {isEditing ? (
                                                    <input
                                                        type="number"
                                                        value={editValues.crashCashMin}
                                                        onChange={(e) => setEditValues({...editValues, crashCashMin: e.target.value})}
                                                        className="w-24 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                                    />
                                                ) : (
                                                    <span className="text-slate-700 dark:text-slate-300">
                                                        ₹{product.crashCashMin || 0}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {isEditing ? (
                                                    <input
                                                        type="number"
                                                        value={editValues.crashCashMax}
                                                        onChange={(e) => setEditValues({...editValues, crashCashMax: e.target.value})}
                                                        className="w-24 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                                    />
                                                ) : (
                                                    <span className="text-slate-700 dark:text-slate-300">
                                                        ₹{product.crashCashMax || 100}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {isEditing ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleSave(product._id || product.id)}
                                                            disabled={saving}
                                                            className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition disabled:opacity-50"
                                                        >
                                                            {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                                                        </button>
                                                        <button
                                                            onClick={handleCancel}
                                                            disabled={saving}
                                                            className="p-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500 text-slate-700 dark:text-white rounded-lg transition disabled:opacity-50"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleEdit(product)}
                                                        className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {filteredProducts.length === 0 && (
                        <div className="text-center py-12">
                            <Coins className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-500 dark:text-slate-400">
                                {searchTerm ? 'No products found matching your search' : 'No products available'}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
