'use client'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

// Helper: fetch products for dropdowns
async function fetchProducts() {
  try {
    const res = await fetch('/api/products/search?limit=1000')
    if (!res.ok) return []
    const data = await res.json()
    return data.products || []
  } catch (e) {
    console.error('Failed to fetch products', e)
    return []
  }
}

export default function AdminCharges() {
  const [charges, setCharges] = useState({ global: { shippingFee: 40, freeAbove: 999, convenienceFee: 0, platformFee: 0 }, rules: [] })
  const [newRule, setNewRule] = useState({ scopeType: 'category', scope: '', shippingFee: 0, convenienceFee: 0, platformFee: 0, selectedProducts: [], selectAllProducts: false })
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState([])

  useEffect(() => {
    const fetchCharges = async () => {
      try {
        const res = await fetch('/api/admin/charges')
        const data = await res.json()
                        if (data.success) setCharges(data.charges)
      } catch (e) {
        console.error('Failed to load charges', e)
      }
    }
    fetchCharges()
    // load products for product/category selectors
    fetchProducts().then(pl => setProducts(pl))
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Clean rules to remove UI-only fields (selectedProducts, selectAllProducts)
      const cleaned = {
        ...charges,
        rules: (charges.rules || []).map(r => ({
          id: r.id,
          scopeType: r.scopeType,
          scope: r.scope,
          shippingFee: Number(r.shippingFee || 0),
          convenienceFee: Number(r.convenienceFee || 0),
          platformFee: Number(r.platformFee || 0)
        }))
      }

      const res = await fetch('/api/admin/charges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleaned)
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Charges saved')
        setCharges(data.charges)
      } else {
        toast.error('Failed to save charges')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to save charges')
    } finally { setLoading(false) }
  }

  return (
    <div className="p-6 text-slate-700">
      <h2 className="text-2xl font-bold mb-4">Admin Charges</h2>
      <form onSubmit={handleSave} className="max-w-lg space-y-4">
        <h3 className="text-lg font-semibold">Global Charges</h3>
        <label className="block">
          <div className="text-sm font-medium">Shipping fee (flat)</div>
          <input type="number" value={charges.global?.shippingFee} onChange={(e)=>setCharges({...charges, global:{...charges.global, shippingFee: Number(e.target.value)}})} className="mt-1 p-2 border rounded w-full"/>
        </label>
        <label className="block">
          <div className="text-sm font-medium">Free delivery threshold (₹)</div>
          <input type="number" value={charges.global?.freeAbove} onChange={(e)=>setCharges({...charges, global:{...charges.global, freeAbove: Number(e.target.value)}})} className="mt-1 p-2 border rounded w-full"/>
        </label>
        <label className="block">
          <div className="text-sm font-medium">Convenience fee (flat)</div>
          <input type="number" value={charges.global?.convenienceFee} onChange={(e)=>setCharges({...charges, global:{...charges.global, convenienceFee: Number(e.target.value)}})} className="mt-1 p-2 border rounded w-full"/>
        </label>
        <label className="block">
          <div className="text-sm font-medium">Platform fee (flat)</div>
          <input type="number" value={charges.global?.platformFee} onChange={(e)=>setCharges({...charges, global:{...charges.global, platformFee: Number(e.target.value)}})} className="mt-1 p-2 border rounded w-full"/>
        </label>

        <h3 className="text-lg font-semibold mt-6">Product / Category Rules</h3>
        <p className="text-xs text-slate-500">Create rules to apply different charges for specific products or categories.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <label>
            <div className="text-sm font-medium">Scope Type</div>
            <select value={newRule.scopeType} onChange={(e)=>setNewRule({...newRule, scopeType:e.target.value, scope:''})} className="mt-1 p-2 border rounded w-full">
              <option value="category">Category</option>
              <option value="product">Product</option>
              <option value="all">All</option>
            </select>
          </label>

          {/* Scope selector: category or product selector replaces free-text for clarity */}
          {newRule.scopeType === 'product' ? (
            <div>
              <div className="text-sm font-medium">Select Product(s)</div>
              <div className="flex items-center gap-4 mb-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={newRule.selectAllProducts} onChange={(e)=>{
                    const checked = e.target.checked
                    setNewRule({...newRule, selectAllProducts: checked, selectedProducts: checked ? products.map(p=>p.id) : []})
                  }} /> Select All Products
                </label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-auto p-2 border rounded bg-white dark:bg-slate-800">
                {products.map(p=> {
                  const checked = (newRule.selectedProducts || []).includes(p.id)
                  return (
                    <label key={p.id} className="flex items-center gap-2 p-1 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <input type="checkbox" checked={checked} onChange={(e)=>{
                        const arr = Array.isArray(newRule.selectedProducts) ? [...newRule.selectedProducts] : []
                        if (e.target.checked) {
                          const next = Array.from(new Set([...arr, p.id]))
                          setNewRule({...newRule, selectedProducts: next, selectAllProducts: next.length === products.length})
                        } else {
                          const next = arr.filter(x=>x!==p.id)
                          setNewRule({...newRule, selectedProducts: next, selectAllProducts: false})
                        }
                      }} />
                      <span className="text-sm">{p.name} — ₹{p.price}</span>
                    </label>
                  )
                })}
              </div>
              <p className="text-xs text-slate-500 mt-1">Select one or more products. Adding the rule will create one rule per selected product.</p>
            </div>
          ) : newRule.scopeType === 'category' ? (
            <label>
              <div className="text-sm font-medium">Select Category</div>
              <select value={newRule.scope} onChange={(e)=>setNewRule({...newRule, scope:e.target.value})} className="mt-1 p-2 border rounded w-full">
                <option value="">-- Select category --</option>
                {[...new Set(products.map(p=>p.category || 'Uncategorized'))].map(cat=> (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">Choose a category; this rule will apply to all products in the selected category.</p>
            </label>
          ) : (
            <label>
              <div className="text-sm font-medium">Scope</div>
              <input type="text" value={newRule.scope} onChange={(e)=>setNewRule({...newRule, scope:e.target.value})} className="mt-1 p-2 border rounded w-full" placeholder="Applies to all when Scope Type = All" readOnly />
            </label>
          )}
          <label>
            <div className="text-sm font-medium">Shipping Fee</div>
            <input type="number" value={newRule.shippingFee} onChange={(e)=>setNewRule({...newRule, shippingFee:Number(e.target.value)})} className="mt-1 p-2 border rounded w-full" />
          </label>
          <label>
            <div className="text-sm font-medium">Convenience Fee</div>
            <input type="number" value={newRule.convenienceFee} onChange={(e)=>setNewRule({...newRule, convenienceFee:Number(e.target.value)})} className="mt-1 p-2 border rounded w-full" />
          </label>
          <label>
            <div className="text-sm font-medium">Platform Fee</div>
            <input type="number" value={newRule.platformFee} onChange={(e)=>setNewRule({...newRule, platformFee:Number(e.target.value)})} className="mt-1 p-2 border rounded w-full" />
          </label>
        </div>
        <div className="flex gap-2 mt-3">
          <button type="button" onClick={()=>{
            const rulesToAdd = []
            if (newRule.scopeType === 'product') {
              const sel = Array.isArray(newRule.selectedProducts) ? newRule.selectedProducts : []
              if (sel.length === 0) {
                toast.error('Select at least one product')
                return
              }
              for (const pid of sel) {
                rulesToAdd.push({...newRule, id: `rule_${Date.now()}_${pid}`, scopeType: 'product', scope: pid, selectedProducts: undefined, selectAllProducts: undefined})
              }
            } else {
              const rule = {...newRule, id: `rule_${Date.now()}`}
              rulesToAdd.push(rule)
            }

            setCharges({...charges, rules:[...(charges.rules||[]), ...rulesToAdd]})
            setNewRule({ scopeType: 'category', scope: '', shippingFee: 0, convenienceFee: 0, platformFee: 0, selectedProducts: [], selectAllProducts: false })
          }} className="px-4 py-2 bg-emerald-600 text-white rounded">Add Rule</button>
        </div>

        {/* List rules */}
        <div className="mt-4 space-y-2">
          {(charges.rules||[]).map(r=> {
            const scopeDisplay = r.scopeType === 'product' ? (products.find(p=>p.id===r.scope)?.name || r.scope) : r.scopeType === 'category' ? r.scope : 'All Products'
            return (
              <div key={r.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="text-sm font-medium">{r.scopeType.toUpperCase()} : {scopeDisplay}</div>
                  <div className="text-xs text-slate-500">Shipping: ₹{r.shippingFee} · Convenience: ₹{r.convenienceFee} · Platform: ₹{r.platformFee}</div>
                </div>
                <div>
                  <button type="button" onClick={()=>setCharges({...charges, rules: (charges.rules||[]).filter(x=>x.id!==r.id)})} className="px-3 py-1 bg-red-500 text-white rounded">Remove</button>
                </div>
              </div>
            )
          })}
          
        </div>

        <div>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">Save Charges</button>
        </div>
      </form>
    </div>
  )
}
