'use client'
import { XIcon, Star } from "lucide-react"
import { useState } from "react"
import { toast } from "react-hot-toast"
import { useDispatch } from "react-redux"
import { addAddress } from "@/lib/features/address/addressSlice"
import NeonCheckbox from "@/components/NeonCheckbox"

const AddressModal = ({ setShowAddressModal }) => {
    const dispatch = useDispatch()

    const [address, setAddress] = useState({
        name: '',
        email: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        phone: '',
        isDefault: false
    })

    const handleAddressChange = (e) => {
        setAddress({
            ...address,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        dispatch(addAddress({
            ...address,
            id: `addr_${Date.now()}`,
            createdAt: new Date().toISOString()
        }))
        toast.success('Address added successfully!')
        setShowAddressModal(false)
    }

    return (
        <form onSubmit={e => toast.promise(handleSubmit(e), { loading: 'Adding Address...' })} className="fixed inset-0 z-50 bg-white/60 dark:bg-slate-900/80 backdrop-blur h-screen flex items-center justify-center">
            <div className="flex flex-col gap-5 text-slate-700 dark:text-slate-200 w-full max-w-sm mx-6">
                <h2 className="text-3xl ">Add New <span className="font-semibold">Address</span></h2>
                <input name="name" onChange={handleAddressChange} value={address.name} className="p-2 px-4 outline-none border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded w-full" type="text" placeholder="Enter your name" required />
                <input name="email" onChange={handleAddressChange} value={address.email} className="p-2 px-4 outline-none border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded w-full" type="email" placeholder="Email address" required />
                <input name="street" onChange={handleAddressChange} value={address.street} className="p-2 px-4 outline-none border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded w-full" type="text" placeholder="Street" required />
                <div className="flex gap-4">
                    <input name="city" onChange={handleAddressChange} value={address.city} className="p-2 px-4 outline-none border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded w-full" type="text" placeholder="City" required />
                    <input name="state" onChange={handleAddressChange} value={address.state} className="p-2 px-4 outline-none border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded w-full" type="text" placeholder="State" required />
                </div>
                <div className="flex gap-4">
                    <input name="zip" onChange={handleAddressChange} value={address.zip} className="p-2 px-4 outline-none border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded w-full" type="number" placeholder="Zip code" required />
                    <input name="country" onChange={handleAddressChange} value={address.country} className="p-2 px-4 outline-none border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded w-full" type="text" placeholder="Country" required />
                </div>
                <input name="phone" onChange={handleAddressChange} value={address.phone} className="p-2 px-4 outline-none border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded w-full" type="text" placeholder="Phone" required />
                
                {/* Set as Default Checkbox */}
                <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-lg">
                    <NeonCheckbox 
                        checked={address.isDefault}
                        onChange={() => setAddress(prev => ({ ...prev, isDefault: !prev.isDefault }))}
                        size={20}
                    />
                    <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500" />
                        <span className="text-slate-700 dark:text-slate-200 text-sm font-medium">Set as default address</span>
                    </div>
                </div>
                
                <button className="bg-slate-800 dark:bg-slate-700 text-white text-sm font-medium py-2.5 rounded-md hover:bg-slate-900 dark:hover:bg-slate-600 active:scale-95 transition-all">SAVE ADDRESS</button>
            </div>
            <XIcon size={30} className="absolute top-5 right-5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer" onClick={() => setShowAddressModal(false)} />
        </form>
    )
}

export default AddressModal