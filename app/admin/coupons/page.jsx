'use client'
import { useEffect, useState } from "react"
import { format } from "date-fns"
import toast from "react-hot-toast"
import { Trash2, Edit, Gift, Percent, Truck, ShoppingCart, Tag } from "lucide-react"

export default function AdminCoupons() {

    const [coupons, setCoupons] = useState([])
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(false)
    const [editingCoupon, setEditingCoupon] = useState(null)

    const [newCoupon, setNewCoupon] = useState({
        code: '',
        description: '',
        discount: '',
        couponType: 'percentage', // percentage, flat, freeDelivery
        minOrderValue: '',
        maxDiscount: '',
        applicableProducts: [],
        selectAllProducts: false,
        appliesToCharges: [],
        waiveAllCharges: false,
        forNewUser: false,
        forMember: false,
        isPublic: true,
        isActive: true,
        usageLimit: '',
        perUserLimit: '',
        expiresAt: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
    })

    const fetchCoupons = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/admin/coupons?status=all')
            if (response.ok) {
                const data = await response.json()
                setCoupons(data.coupons || [])
            }
        } catch (error) {
            console.error('Error fetching coupons:', error)
            toast.error('Failed to load coupons')
        } finally {
            setLoading(false)
        }
    }

    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/products/search?limit=1000')
            if (response.ok) {
                const data = await response.json()
                setProducts(data.products || [])
            }
        } catch (error) {
            console.error('Error fetching products:', error)
        }
    }

    const handleAddCoupon = async (e) => {
        e.preventDefault()
        
        try {
            const payload = {
                ...newCoupon,
                appliesToCharges: newCoupon.appliesToCharges || [],
                discount: parseFloat(newCoupon.discount) || 0,
                minOrderValue: newCoupon.minOrderValue ? parseFloat(newCoupon.minOrderValue) : null,
                maxDiscount: newCoupon.maxDiscount ? parseFloat(newCoupon.maxDiscount) : null,
                usageLimit: newCoupon.usageLimit ? parseInt(newCoupon.usageLimit) : null,
                perUserLimit: newCoupon.perUserLimit ? parseInt(newCoupon.perUserLimit) : null
            }

            // Remove UI-only flags
            if (payload.selectAllProducts !== undefined) delete payload.selectAllProducts
            // `waiveAllCharges` is a UI convenience — send only the canonical
            // `appliesToCharges` array to the server.
            if (payload.waiveAllCharges !== undefined) delete payload.waiveAllCharges

            const url = editingCoupon ? '/api/admin/coupons' : '/api/admin/coupons'
            const method = editingCoupon ? 'PUT' : 'POST'
            
            if (editingCoupon) {
                payload.id = editingCoupon.id
            }

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await response.json()

            if (response.ok) {
                toast.success(data.message || (editingCoupon ? 'Coupon updated!' : 'Coupon created!'))
                fetchCoupons()
                resetForm()
            } else {
                toast.error(data.error || 'Failed to save coupon')
            }
        } catch (error) {
            console.error('Error saving coupon:', error)
            toast.error('Failed to save coupon')
        }
    }

    const resetForm = () => {
        setNewCoupon({
            code: '',
            description: '',
            discount: '',
            couponType: 'percentage',
            minOrderValue: '',
            maxDiscount: '',
            applicableProducts: [],
            selectAllProducts: false,
            appliesToCharges: [],
            waiveAllCharges: false,
            forNewUser: false,
            forMember: false,
            isPublic: true,
            isActive: true,
            usageLimit: '',
            perUserLimit: '',
            expiresAt: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
        })
        setEditingCoupon(null)
    }

    const handleChange = (e) => {
        setNewCoupon({ ...newCoupon, [e.target.name]: e.target.value })
    }

    const deleteCoupon = async (id) => {
        try {
            const response = await fetch('/api/admin/coupons', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            })

            if (response.ok) {
                toast.success('Coupon deleted!')
                fetchCoupons()
            } else {
                const data = await response.json()
                toast.error(data.error || 'Failed to delete coupon')
            }
        } catch (error) {
            console.error('Error deleting coupon:', error)
            toast.error('Failed to delete coupon')
        }
    }

    const editCoupon = (coupon) => {
        setEditingCoupon(coupon)
        setNewCoupon({
            code: coupon.code,
            description: coupon.description,
            discount: coupon.discount.toString(),
            couponType: coupon.couponType || 'percentage',
            minOrderValue: coupon.minOrderValue?.toString() || '',
            maxDiscount: coupon.maxDiscount?.toString() || '',
            applicableProducts: coupon.applicableProducts || [],
            selectAllProducts: Array.isArray(coupon.applicableProducts) && products && products.length > 0 && (coupon.applicableProducts.length === products.length),
            appliesToCharges: coupon.appliesToCharges || [],
            waiveAllCharges: Array.isArray(coupon.appliesToCharges) && ['shipping','convenience','platform'].every(k=>coupon.appliesToCharges.includes(k)),
            forNewUser: coupon.forNewUser,
            forMember: coupon.forMember,
            isPublic: coupon.isPublic !== false,
            isActive: coupon.isActive !== false,
            usageLimit: coupon.usageLimit?.toString() || '',
            perUserLimit: coupon.perUserLimit?.toString() || '',
            expiresAt: format(new Date(coupon.expiresAt), 'yyyy-MM-dd')
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    useEffect(() => {
        fetchCoupons()
        fetchProducts()
    }, [])

    return (
        <div className="text-slate-600 dark:text-slate-400 mb-40 p-6">

            {/* Add/Edit Coupon Form */}
            <form onSubmit={handleAddCoupon} className="max-w-4xl">
                <div className="flex items-center gap-3 mb-6">
                    <Gift className="w-8 h-8 text-red-600" />
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white">
                        {editingCoupon ? 'Edit' : 'Create'} <span className="text-red-600">Coupon</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Coupon Code */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Coupon Code *</label>
                        <input 
                            type="text" 
                            placeholder="e.g., SAVE20" 
                            className="w-full p-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                            name="code" 
                            value={newCoupon.code} 
                            onChange={handleChange} 
                            required
                            disabled={!!editingCoupon}
                        />
                    </div>

                    {/* Coupon Type */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Coupon Type *</label>
                        <select
                            name="couponType"
                            value={newCoupon.couponType}
                            onChange={handleChange}
                            className="w-full p-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                        >
                            <option value="percentage">Percentage Discount (%)</option>
                            <option value="flat">Flat Discount (₹)</option>
                            <option value="waiveCharges">Waive Charges (shipping/convenience/platform)</option>
                            <option value="freeDelivery">Free Delivery</option>
                        </select>
                    </div>

                    {/* Discount Value */}
                    {newCoupon.couponType !== 'freeDelivery' && newCoupon.couponType !== 'waiveCharges' && (
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                {newCoupon.couponType === 'percentage' ? 'Discount (%) *' : 'Discount Amount (₹) *'}
                            </label>
                            <input 
                                type="number" 
                                placeholder={newCoupon.couponType === 'percentage' ? '10' : '100'}
                                min={0}
                                max={newCoupon.couponType === 'percentage' ? 100 : undefined}
                                className="w-full p-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                                name="discount" 
                                value={newCoupon.discount} 
                                onChange={handleChange} 
                                required
                            />
                        </div>
                    )}

                    {/* Min Order Value */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Minimum Order Value (₹)</label>
                        <input 
                            type="number" 
                            placeholder="e.g., 499" 
                            min={0}
                            className="w-full p-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                            name="minOrderValue" 
                            value={newCoupon.minOrderValue} 
                            onChange={handleChange}
                        />
                        <p className="text-xs text-slate-500 mt-1">Leave empty for no minimum</p>
                    </div>

                    {/* Max Discount (for percentage) */}
                    {newCoupon.couponType === 'percentage' && (
                        <div>
                            <label className="block text-sm font-medium mb-2">Maximum Discount (₹)</label>
                            <input 
                                type="number" 
                                placeholder="e.g., 500" 
                                min={0}
                                className="w-full p-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                                name="maxDiscount" 
                                value={newCoupon.maxDiscount} 
                                onChange={handleChange}
                            />
                            <p className="text-xs text-slate-500 mt-1">Leave empty for no cap</p>
                        </div>
                    )}

                    {/* Usage Limit */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Usage Limit</label>
                        <input 
                            type="number" 
                            placeholder="e.g., 100" 
                            min={1}
                            className="w-full p-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                            name="usageLimit" 
                            value={newCoupon.usageLimit} 
                            onChange={handleChange}
                        />
                        <p className="text-xs text-slate-500 mt-1">Leave empty for unlimited</p>
                    </div>

                    {/* Expiry Date */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Expiry Date *</label>
                        <input 
                            type="date" 
                            className="w-full p-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                            name="expiresAt" 
                            value={newCoupon.expiresAt} 
                            onChange={handleChange}
                            min={format(new Date(), 'yyyy-MM-dd')}
                            required
                        />
                    </div>
                </div>

                {/* Description */}
                <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Description *</label>
                    <textarea
                        placeholder="e.g., Get 20% off on all orders"
                        className="w-full p-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                        name="description" 
                        value={newCoupon.description} 
                        onChange={handleChange} 
                        required
                        rows={2}
                    />
                </div>

                {/* Applicable Products */}
                <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Applicable Products (Optional)</label>
                    <div className="flex items-center gap-4 mb-2">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={newCoupon.selectAllProducts || false}
                                onChange={(e) => {
                                    const checked = e.target.checked
                                    if (checked) {
                                        setNewCoupon({ ...newCoupon, applicableProducts: products.map(p => p.id), selectAllProducts: true })
                                    } else {
                                        setNewCoupon({ ...newCoupon, applicableProducts: [], selectAllProducts: false })
                                    }
                                }}
                            /> Select All Products
                        </label>
                        <p className="text-xs text-slate-500">Leave empty to apply to all products.</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-auto p-2 border rounded bg-white dark:bg-slate-800">
                        {products.map(product => {
                            const checked = (newCoupon.applicableProducts || []).includes(product.id)
                            return (
                                <label key={product.id} className="flex items-center gap-2 p-1 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <input type="checkbox" checked={checked} onChange={(e) => {
                                        const arr = Array.isArray(newCoupon.applicableProducts) ? [...newCoupon.applicableProducts] : []
                                        if (e.target.checked) {
                                            const next = Array.from(new Set([...arr, product.id]))
                                            setNewCoupon({ ...newCoupon, applicableProducts: next, selectAllProducts: next.length === products.length })
                                        } else {
                                            const next = arr.filter(x => x !== product.id)
                                            setNewCoupon({ ...newCoupon, applicableProducts: next, selectAllProducts: false })
                                        }
                                    }} />
                                    <span className="text-sm">{product.name} — ₹{product.price}</span>
                                </label>
                            )
                        })}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Use the checkboxes to select specific products. Leave empty to apply to all.</p>
                </div>

                {/* Charges Affected */}
                <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Charges Affected (optional)</label>
                    <div className="flex items-center gap-4 mb-2">
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={newCoupon.waiveAllCharges} onChange={(e)=>{
                                const checked = e.target.checked
                                setNewCoupon({...newCoupon, waiveAllCharges: checked, appliesToCharges: checked ? ['shipping','convenience','platform'] : []})
                            }} /> Waive All Charges
                        </label>
                        <p className="text-xs text-slate-500">Quick: toggle to make this coupon waive shipping, convenience and platform fees in one click.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={newCoupon.appliesToCharges.includes('shipping')} onChange={(e)=>{
                                const arr = newCoupon.appliesToCharges || []
                                if (e.target.checked) setNewCoupon({...newCoupon, appliesToCharges: Array.from(new Set([...arr,'shipping'])), waiveAllCharges: false})
                                else setNewCoupon({...newCoupon, appliesToCharges: arr.filter(a=>a!=='shipping'), waiveAllCharges: false})
                            }} /> Shipping
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={newCoupon.appliesToCharges.includes('convenience')} onChange={(e)=>{
                                const arr = newCoupon.appliesToCharges || []
                                if (e.target.checked) setNewCoupon({...newCoupon, appliesToCharges: Array.from(new Set([...arr,'convenience'])), waiveAllCharges: false})
                                else setNewCoupon({...newCoupon, appliesToCharges: arr.filter(a=>a!=='convenience'), waiveAllCharges: false})
                            }} /> Convenience Fee
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={newCoupon.appliesToCharges.includes('platform')} onChange={(e)=>{
                                const arr = newCoupon.appliesToCharges || []
                                if (e.target.checked) setNewCoupon({...newCoupon, appliesToCharges: Array.from(new Set([...arr,'platform'])), waiveAllCharges: false})
                                else setNewCoupon({...newCoupon, appliesToCharges: arr.filter(a=>a!=='platform'), waiveAllCharges: false})
                            }} /> Platform Fee
                        </label>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">If selected, this coupon may waive or affect the selected charge categories when applied.</p>
                </div>

                {/* Toggles */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="w-5 h-5 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                            checked={newCoupon.forNewUser}
                            onChange={(e) => setNewCoupon({ ...newCoupon, forNewUser: e.target.checked })}
                        />
                        <span className="text-sm">New Users Only</span>
                    </label>

                    <label className="flex flex-col">
                        <span className="text-sm">Per-User Limit</span>
                        <input
                            type="number"
                            name="perUserLimit"
                            value={newCoupon.perUserLimit}
                            onChange={(e) => setNewCoupon({ ...newCoupon, perUserLimit: e.target.value })}
                            className="mt-1 p-2 border rounded-md w-40"
                            placeholder="e.g. 1"
                        />
                        <p className="text-xs text-slate-500 mt-1">Leave empty for no per-user limit.</p>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="w-5 h-5 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                            checked={newCoupon.forMember}
                            onChange={(e) => setNewCoupon({ ...newCoupon, forMember: e.target.checked })}
                        />
                        <span className="text-sm">Members Only</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="w-5 h-5 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                            checked={newCoupon.isPublic}
                            onChange={(e) => setNewCoupon({ ...newCoupon, isPublic: e.target.checked })}
                        />
                        <span className="text-sm">Public</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="w-5 h-5 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                            checked={newCoupon.isActive}
                            onChange={(e) => setNewCoupon({ ...newCoupon, isActive: e.target.checked })}
                        />
                        <span className="text-sm">Active</span>
                    </label>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 mt-6">
                    <button 
                        type="submit"
                        className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition active:scale-95 flex items-center gap-2"
                    >
                        <Tag size={18} />
                        {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                    </button>
                    {editingCoupon && (
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-6 py-3 rounded-lg bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-medium transition"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            {/* List Coupons */}
            <div className="mt-14">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
                    Active <span className="text-red-600">Coupons</span>
                </h2>
                
                {loading ? (
                    <p className="text-center py-8">Loading coupons...</p>
                ) : coupons.length === 0 ? (
                    <p className="text-center py-8 text-slate-500">No coupons created yet</p>
                ) : (
                    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                        <table className="min-w-full bg-white dark:bg-slate-800 text-sm">
                            <thead className="bg-slate-100 dark:bg-slate-700">
                                <tr>
                                    <th className="py-3 px-4 text-left font-semibold">Code</th>
                                    <th className="py-3 px-4 text-left font-semibold">Type</th>
                                    <th className="py-3 px-4 text-left font-semibold">Discount</th>
                                    <th className="py-3 px-4 text-left font-semibold">Min Order</th>
                                    <th className="py-3 px-4 text-left font-semibold">Usage</th>
                                    <th className="py-3 px-4 text-left font-semibold">Status</th>
                                    <th className="py-3 px-4 text-left font-semibold">Expires</th>
                                    <th className="py-3 px-4 text-left font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {coupons.map((coupon) => {
                                    const isExpired = new Date(coupon.expiresAt) < new Date()
                                    const isInactive = !coupon.isActive
                                    const isLimitReached = coupon.usageLimit && coupon.usedCount >= coupon.usageLimit
                                    
                                    return (
                                        <tr key={coupon.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <Tag size={16} className="text-red-600" />
                                                    <span className="font-semibold text-slate-800 dark:text-white">
                                                        {coupon.code}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                                    coupon.couponType === 'freeDelivery' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                                    coupon.couponType === 'flat' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                                }`}>
                                                    {coupon.couponType === 'freeDelivery' ? <Truck size={12} /> : 
                                                     coupon.couponType === 'flat' ? <ShoppingCart size={12} /> : 
                                                     coupon.couponType === 'waiveCharges' ? <Gift size={12} /> : <Percent size={12} />}
                                                    {coupon.couponType === 'freeDelivery' ? 'Free Delivery' :
                                                     coupon.couponType === 'flat' ? 'Flat' :
                                                     coupon.couponType === 'waiveCharges' ? 'Waive Charges' : 'Percentage'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                                                {coupon.couponType === 'freeDelivery' ? 
                                                    'Free Shipping' : coupon.couponType === 'waiveCharges' ? (
                                                        coupon.appliesToCharges && coupon.appliesToCharges.length ? coupon.appliesToCharges.join(', ') : 'Waives charges'
                                                    ) : (
                                                    `${coupon.couponType === 'percentage' ? coupon.discount + '%' : '₹' + coupon.discount}`
                                                )}
                                                {coupon.maxDiscount && coupon.couponType === 'percentage' && (
                                                    <span className="text-xs text-slate-500 ml-1">(max ₹{coupon.maxDiscount})</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                                                {coupon.minOrderValue ? `₹${coupon.minOrderValue}` : '-'}
                                            </td>
                                            <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                                                {coupon.usedCount || 0}
                                                {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                                    isExpired || isInactive || isLimitReached ? 
                                                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 
                                                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                }`}>
                                                    {isLimitReached ? 'Limit Reached' : isExpired ? 'Expired' : isInactive ? 'Inactive' : 'Active'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                                                {format(new Date(coupon.expiresAt), 'MMM dd, yyyy')}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => editCoupon(coupon)}
                                                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition"
                                                        title="Edit coupon"
                                                    >
                                                        <Edit size={16} className="text-blue-600 dark:text-blue-400" />
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            const { showConfirm } = await import('@/lib/alertUtils')
                                                            const confirmed = await showConfirm(
                                                                'Delete coupon',
                                                                `Delete coupon ${coupon.code}?`,
                                                                'Delete',
                                                                'Cancel'
                                                            )
                                                            if (confirmed) {
                                                                toast.promise(deleteCoupon(coupon.id), {
                                                                    loading: 'Deleting...',
                                                                    success: 'Deleted!',
                                                                    error: 'Failed to delete'
                                                                })
                                                            }
                                                        }}
                                                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition"
                                                        title="Delete coupon"
                                                    >
                                                        <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}