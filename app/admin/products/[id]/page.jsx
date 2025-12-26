'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Save, X } from 'lucide-react'
import Image from 'next/image'

export default function EditProductPage() {
    const params = useParams()
    const router = useRouter()
    const productId = params.id
    
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [product, setProduct] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: 0,
        mrp: 0,
        category: '',
        inStock: true,
        quantity: 0,
    })
    const [imagePreviewUrls, setImagePreviewUrls] = useState({ 1: null, 2: null, 3: null, 4: null })
    const [images, setImages] = useState({ 1: null, 2: null, 3: null, 4: null })

    const categories = ['Electronics', 'Clothing', 'Home & Kitchen', 'Beauty & Health', 'Toys & Games', 'Sports & Outdoors', 'Books & Media', 'Food & Drink', 'Hobbies & Crafts', 'Others']
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'

    useEffect(() => {
        fetchProduct()
    }, [productId])

    const fetchProduct = async () => {
        try {
            setLoading(true)
            
            // Try API first
            const response = await fetch(`/api/products/${productId}`)
            if (response.ok) {
                const data = await response.json()
                const prod = data.product
                setProduct(prod)
                setFormData({
                    name: prod.name || '',
                    description: prod.description || '',
                    price: prod.price || 0,
                    mrp: prod.mrp || 0,
                    category: prod.category || '',
                    inStock: prod.inStock !== false,
                    quantity: prod.quantity || 0,
                })
                // Load product images
                if (prod.images && Array.isArray(prod.images)) {
                    prod.images.forEach((img, idx) => {
                        if (idx < 4) {
                            setImagePreviewUrls(prev => ({ ...prev, [idx + 1]: img }))
                        }
                    })
                }
            } else {
                // Fallback to localStorage
                const adminProducts = localStorage.getItem('adminProducts')
                if (adminProducts) {
                    const products = JSON.parse(adminProducts)
                    const prod = products.find(p => p.id === productId)
                    if (prod) {
                        setProduct(prod)
                        setFormData({
                            name: prod.name,
                            description: prod.description,
                            price: prod.price,
                            mrp: prod.mrp,
                            category: prod.category,
                            inStock: prod.inStock,
                            quantity: prod.quantity || 0,
                        })
                        if (prod.images) {
                            prod.images.forEach((img, idx) => {
                                if (idx < 4) {
                                    setImagePreviewUrls(prev => ({ ...prev, [idx + 1]: img }))
                                }
                            })
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching product:', error)
            toast.error('Failed to load product')
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value
        }))
    }

    const handleImageChange = (imageNumber, file) => {
        if (file) {
            setImages(prev => ({ ...prev, [imageNumber]: file }))
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

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)

        try {
            if (!formData.name || !formData.description || !formData.price || !formData.mrp || !formData.category) {
                toast.error('Please fill all required fields')
                return
            }

            if (parseFloat(formData.price) > parseFloat(formData.mrp)) {
                toast.error('Price cannot be greater than MRP')
                return
            }

            const productImages = Object.values(imagePreviewUrls).filter(img => img !== null)

            const updateData = {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                mrp: parseFloat(formData.mrp),
                category: formData.category,
                inStock: formData.inStock,
                quantity: parseInt(formData.quantity) || 0,
                images: productImages.length > 0 ? productImages : product?.images || [],
                updatedAt: new Date().toISOString(),
            }

            // Try API first
            const response = await fetch(`/api/products/${productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            })

            if (!response.ok) {
                // Fallback to localStorage
                const adminProducts = localStorage.getItem('adminProducts')
                if (adminProducts) {
                    const products = JSON.parse(adminProducts)
                    const updatedProducts = products.map(p =>
                        p.id === productId ? { ...p, ...updateData } : p
                    )
                    localStorage.setItem('adminProducts', JSON.stringify(updatedProducts))
                }
            }

            toast.success('Product updated successfully!')
            router.push('/admin')
        } catch (error) {
            console.error('Error saving product:', error)
            toast.error('Failed to save product')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading product...</p>
                </div>
            </div>
        )
    }

    if (!product && !formData.name) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-slate-600 mb-4">Product not found</p>
                    <button
                        onClick={() => router.push('/admin')}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => router.push('/admin')}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                >
                    <ArrowLeft size={20} />
                    Back
                </button>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Edit Product</h1>
                <div className="w-20"></div>
            </div>

            <form onSubmit={handleSave} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 space-y-6">
                {/* Basic Info */}
                <div>
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Basic Information</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Product Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full p-3 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Description *</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={4}
                                className="w-full p-3 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 resize-none"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Category *</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Quantity</label>
                                <input
                                    type="number"
                                    name="quantity"
                                    value={formData.quantity}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pricing */}
                <div>
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Pricing</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Price ({currency}) *</label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleInputChange}
                                className="w-full p-3 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">MRP ({currency}) *</label>
                            <input
                                type="number"
                                name="mrp"
                                value={formData.mrp}
                                onChange={handleInputChange}
                                className="w-full p-3 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                required
                            />
                        </div>
                    </div>
                    {formData.price > 0 && formData.mrp > 0 && (
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                            Discount: {Math.round(((formData.mrp - formData.price) / formData.mrp) * 100)}%
                        </p>
                    )}
                </div>

                {/* Status */}
                <div>
                    <label className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            name="inStock"
                            checked={formData.inStock}
                            onChange={handleInputChange}
                            className="w-5 h-5 rounded border-slate-300 cursor-pointer"
                        />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">In Stock</span>
                    </label>
                </div>

                {/* Images */}
                <div>
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Product Images</h2>
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

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg transition font-medium"
                    >
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.push('/admin')}
                        className="flex items-center gap-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white px-6 py-2.5 rounded-lg transition font-medium"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    )
}
