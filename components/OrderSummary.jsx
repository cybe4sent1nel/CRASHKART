'use client'
import { PlusIcon, SquarePenIcon, XIcon, Share2, Star } from 'lucide-react';
import React, { useState, useEffect } from 'react'
import AddressModal from './AddressModal';
import { useSelector, useDispatch } from 'react-redux';
import { selectAddress, setDefaultAddress } from '@/lib/features/address/addressSlice';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import PaymentAnimation from './animations/PaymentAnimation';
import SuccessAnimation from './animations/SuccessAnimation';
import { Boxes } from './ui/boxes';
import NeonCheckbox from '@/components/NeonCheckbox';

const OrderSummary = ({ totalPrice, items }) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$';

    const router = useRouter();
    const dispatch = useDispatch();

    const addressList = useSelector(state => state.address.list);
    const selectedAddressId = useSelector(state => state.address.selectedAddressId);

    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [couponCodeInput, setCouponCodeInput] = useState('');
    const [coupon, setCoupon] = useState('');
    const [showPaymentProcessing, setShowPaymentProcessing] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [realOrderId, setRealOrderId] = useState(null);

    // Auto-select default address on mount
    useEffect(() => {
        if (addressList.length > 0 && !selectedAddress) {
            const defaultAddr = addressList.find(addr => addr.isDefault) || addressList[0];
            setSelectedAddress(defaultAddr);
        }
    }, [addressList, selectedAddress]);

    useEffect(() => {
        // Disable nav loader on this component mount
        if (typeof window !== 'undefined') {
            window.__disableNavigationLoader = true
        }
    }, [])

    const handleCouponCode = async (event) => {
        event.preventDefault();
        
    }

    const handlePlaceOrder = async (e) => {
        e.preventDefault();

        console.log('Place Order clicked from OrderSummary');
        
        if (!selectedAddress) {
            toast.error('Please select a delivery address');
            return;
        }

        // Disable nav animation
        if (typeof window !== 'undefined') {
            window.__disableNavigationLoader = true
        }

        console.log('Showing payment processing');
        setShowPaymentProcessing(true);

        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
            if (!token) {
                toast.error('Please sign in to place the order')
                router.push('/login')
                return
            }

            // Call API to create order and get real order ID
            const orderPayload = {
                items: items,
                selectedAddressId: selectedAddress.id,
                paymentMethod: paymentMethod,
                total: totalPrice,
                subtotal: totalPrice,
                discount: 0,
                mobileNumber: selectedAddress.phone,
                transactionId: null,
                timestamp: new Date().toISOString()
            };

            const response = await fetch('/api/orders/create', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderPayload)
            });

            const result = await response.json();

            if (response.status === 401) {
                toast.error('Session expired. Please sign in again.')
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('token')
                    localStorage.removeItem('user')
                }
                router.push('/login')
                return
            }

            if (!response.ok || !result.orderId) {
                throw new Error(result.message || 'Failed to create order');
            }

            // Save the real order ID from API response
            setRealOrderId(result.orderId);
            console.log('✅ Real Order ID from API:', result.orderId);

        } catch (error) {
            console.error('Order creation error:', error);
            setShowPaymentProcessing(false);
            toast.error('Failed to create order: ' + error.message, { duration: 5000 });
            return;
        }

        // After 3 seconds, show success with real order ID
        setTimeout(() => {
            console.log('Showing success confirmation');
            setShowPaymentProcessing(false);
            setShowConfirmation(true);
        }, 3000);
    }

    const handleOrderConfirm = () => {
         // Use the real order ID from API response
         const orderId = realOrderId || 'ORD-ERROR';
         const now = new Date();
         const order = {
             id: orderId,
             date: now.toISOString().split('T')[0],
             createdAt: now.toISOString(),
             orderDate: now.toLocaleDateString(),
             total: totalPrice,
             status: 'ORDER_PLACED',
             paymentMethod: paymentMethod,
             address: `${selectedAddress.name}, ${selectedAddress.city}, ${selectedAddress.state} ${selectedAddress.zip}`,
             trackingLink: `${typeof window !== 'undefined' ? window.location.origin : ''}/track/${orderId}`,
             items: items,
             tracking: {
                 step: 1,
                 steps: [
                     { label: 'Order Placed', date: new Date().toISOString().split('T')[0], completed: true },
                     { label: 'Processing', date: 'In Progress', completed: false },
                     { label: 'Shipped', date: 'Pending', completed: false },
                     { label: 'Delivered', date: 'Pending', completed: false }
                 ]
             }
         };
         
         // Save order to allOrders array in localStorage
         if (typeof window !== 'undefined') {
             const allOrders = localStorage.getItem('allOrders');
             let orders = [];
             if (allOrders) {
                 try {
                     orders = JSON.parse(allOrders);
                 } catch (e) {
                     orders = [];
                 }
             }
             orders.unshift(order);
             localStorage.setItem('allOrders', JSON.stringify(orders));
             localStorage.setItem('lastOrderId', orderId);
             window.__disableNavigationLoader = false;
         }

         setShowConfirmation(false);
         router.push(`/my-orders?orderId=${orderId}`);
     };

    const handleContinueShopping = () => {
        if (typeof window !== 'undefined') {
            window.__disableNavigationLoader = false;
        }
        router.push('/');
    };

    // Payment Processing Screen
    if (showPaymentProcessing) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] overflow-hidden">
                <div className="absolute inset-0 w-full h-full">
                    <Boxes className="opacity-50" />
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-8 max-w-md w-full mx-6 text-center relative z-10">
                    <div className="flex justify-center mb-4">
                        <PaymentAnimation width="250px" height="250px" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Processing Payment</h2>
                    <p className="text-slate-600 dark:text-slate-400">Please wait while we securely process your payment...</p>
                </div>
            </div>
        );
    }

    // Success Confirmation Screen
      if (showConfirmation) {
          // Use the real order ID from API, not a fake random one
          const orderId = realOrderId || 'ORD-ERROR';
          const trackingLink = typeof window !== 'undefined' ? `${window.location.origin}/track/${orderId}` : '';
         
         return (
             <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] overflow-hidden">
                 <div className="absolute inset-0 w-full h-full">
                     <Boxes className="opacity-50" />
                 </div>
                 <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-8 max-w-md w-full mx-6 relative z-10">
                     <div className="text-center mb-6">
                         <div className="flex justify-center mb-4">
                              <SuccessAnimation width="200px" height="200px" animationPath="/animations/Sucesso.json" />
                          </div>
                         
                         <h2 className="text-2xl font-bold text-green-600 mb-2">Order Placed Successfully!</h2>
                         <p className="text-slate-600 dark:text-slate-400 mb-6">Your order has been confirmed. We'll send you updates soon.</p>
                     </div>

                     {/* Order Details */}
                     <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 mb-6 space-y-2">
                         <div className="flex justify-between">
                             <span className="text-slate-600 dark:text-slate-400">Order ID</span>
                             <span className="font-semibold text-slate-800 dark:text-white">{orderId}</span>
                         </div>
                         <div className="flex justify-between">
                             <span className="text-slate-600 dark:text-slate-400">Amount</span>
                             <span className="font-semibold text-slate-800 dark:text-white">{currency}{totalPrice.toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between">
                             <span className="text-slate-600 dark:text-slate-400">Method</span>
                             <span className="font-semibold text-slate-800 dark:text-white">{paymentMethod}</span>
                         </div>
                         <div className="flex justify-between">
                             <span className="text-slate-600 dark:text-slate-400">Delivery</span>
                             <span className="font-semibold text-slate-800 dark:text-white">3-5 Days</span>
                         </div>
                     </div>

                     {/* Share Tracking Link Button */}
                     <button
                         onClick={() => {
                             if (typeof navigator !== 'undefined' && navigator.share) {
                                 navigator.share({
                                     title: `Order ${orderId} Tracking`,
                                     text: `Track my order ${orderId}`,
                                     url: trackingLink
                                 }).catch(err => console.log('Share error:', err))
                             } else {
                                 if (typeof navigator !== 'undefined' && navigator.clipboard) {
                                     navigator.clipboard.writeText(trackingLink)
                                     toast.success('📋 Tracking link copied to clipboard!', { duration: 3000 })
                                 }
                             }
                         }}
                         className="w-full mb-3 px-4 py-2.5 bg-blue-100 dark:bg-blue-900 dark:bg-opacity-30 hover:bg-blue-200 dark:hover:bg-blue-900 dark:hover:bg-opacity-50 text-blue-700 dark:text-blue-400 rounded-lg font-medium transition text-sm flex items-center justify-center gap-2"
                     >
                         <Share2 size={16} />
                         Share Order Tracking Link
                     </button>

                     {/* Action Buttons */}
                     <div className="space-y-2">
                         <button
                             onClick={handleOrderConfirm}
                             className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
                         >
                             Go to My Orders
                         </button>
                         <button
                             onClick={handleContinueShopping}
                             className="w-full px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition"
                         >
                             Continue Shopping
                         </button>
                     </div>
                 </div>
             </div>
         );
     }

    return (
        <div className='w-full max-w-lg lg:max-w-[340px] bg-slate-50/30 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm rounded-xl p-7'>
            <h2 className='text-xl font-medium text-slate-600 dark:text-white'>Payment Summary</h2>
            <p className='text-slate-400 dark:text-slate-500 text-xs my-4'>Payment Method</p>
            <div className='flex gap-2 items-center'>
                <input type="radio" id="COD" onChange={() => setPaymentMethod('COD')} checked={paymentMethod === 'COD'} className='accent-gray-500' />
                <label htmlFor="COD" className='cursor-pointer'>COD</label>
            </div>
            <div className='my-4 py-4 border-y border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'>
                <p className='mb-2'>Delivery Address</p>
                {
                    selectedAddress ? (
                        <div className='flex gap-2 items-start'>
                            <div className='flex-1'>
                                <div className='flex items-center gap-2'>
                                    <p className='dark:text-slate-300 font-medium'>{selectedAddress.name}</p>
                                    {selectedAddress.isDefault && (
                                        <span className='inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full text-xs'>
                                            <Star className='w-3 h-3' /> Default
                                        </span>
                                    )}
                                </div>
                                <p className='dark:text-slate-400 text-sm'>{selectedAddress.street || selectedAddress.city}, {selectedAddress.city}, {selectedAddress.state}, {selectedAddress.zip}</p>
                            </div>
                            <SquarePenIcon onClick={() => setSelectedAddress(null)} className='cursor-pointer dark:text-slate-400 hover:text-red-500 transition' size={18} />
                        </div>
                    ) : (
                        <div className='space-y-2'>
                            {
                                addressList.length > 0 && (
                                    <div className='space-y-2 max-h-48 overflow-y-auto'>
                                        {addressList.map((address, index) => (
                                            <div 
                                                key={address.id || index} 
                                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                                                    selectedAddress?.id === address.id 
                                                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                                }`}
                                                onClick={() => setSelectedAddress(address)}
                                            >
                                                <NeonCheckbox 
                                                    checked={selectedAddress?.id === address.id}
                                                    onChange={() => setSelectedAddress(address)}
                                                    size={18}
                                                />
                                                <div className='flex-1 min-w-0'>
                                                    <div className='flex items-center gap-2'>
                                                        <span className='text-slate-700 dark:text-slate-200 font-medium text-sm truncate'>{address.name}</span>
                                                        {address.isDefault && (
                                                            <span className='inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded text-xs'>
                                                                <Star className='w-2.5 h-2.5' /> Default
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className='text-slate-500 dark:text-slate-400 text-xs truncate'>{address.city}, {address.state}, {address.zip}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            }
                            <button className='flex items-center gap-1 text-slate-600 dark:text-slate-400 mt-1 hover:text-red-500 transition' onClick={() => setShowAddressModal(true)} >Add Address <PlusIcon size={18} /></button>
                        </div>
                    )
                }
            </div>
            <div className='pb-4 border-b border-slate-200'>
                <p className='text-slate-400 text-xs mb-2'>Payment Method</p>
                <div className='space-y-2 mb-4'>
                    <label className='flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-100'>
                        <input type="radio" value="COD" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} />
                        <span className='text-sm text-slate-600'>Cash on Delivery (COD)</span>
                    </label>
                    <label className='flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-100'>
                        <input type="radio" value="CARD" checked={paymentMethod === 'CARD'} onChange={() => setPaymentMethod('CARD')} />
                        <span className='text-sm text-slate-600'>Credit/Debit Card</span>
                    </label>
                    <label className='flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-100'>
                        <input type="radio" value="UPI" checked={paymentMethod === 'UPI'} onChange={() => setPaymentMethod('UPI')} />
                        <span className='text-sm text-slate-600'>UPI Payment</span>
                    </label>
                    <label className='flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-100'>
                        <input type="radio" value="WALLET" checked={paymentMethod === 'WALLET'} onChange={() => setPaymentMethod('WALLET')} />
                        <span className='text-sm text-slate-600'>Digital Wallet</span>
                    </label>
                </div>
                
                {paymentMethod === 'CARD' && (
                    <div className='space-y-2 mb-3 bg-slate-100 p-3 rounded'>
                        <input type="text" placeholder='Card Number' className='w-full border border-slate-300 p-1.5 rounded text-xs outline-none' />
                        <div className='flex gap-2'>
                            <input type="text" placeholder='MM/YY' className='w-1/2 border border-slate-300 p-1.5 rounded text-xs outline-none' />
                            <input type="text" placeholder='CVV' className='w-1/2 border border-slate-300 p-1.5 rounded text-xs outline-none' />
                        </div>
                    </div>
                )}
                
                {paymentMethod === 'UPI' && (
                    <div className='mb-3 bg-slate-100 p-3 rounded'>
                        <input type="text" placeholder='UPI ID (example@upi)' className='w-full border border-slate-300 p-1.5 rounded text-xs outline-none' />
                    </div>
                )}
                
                {paymentMethod === 'WALLET' && (
                    <div className='mb-3 bg-slate-100 p-3 rounded'>
                        <select className='w-full border border-slate-300 p-1.5 rounded text-xs outline-none'>
                            <option>Select Wallet</option>
                            <option>Google Pay</option>
                            <option>PhonePe</option>
                            <option>Paytm</option>
                        </select>
                    </div>
                )}
            </div>

            <div className='pb-4 border-b border-slate-200'>
                <div className='flex justify-between'>
                    <div className='flex flex-col gap-1 text-slate-400'>
                        <p>Subtotal:</p>
                        <p>Shipping:</p>
                        {coupon && <p>Coupon:</p>}
                    </div>
                    <div className='flex flex-col gap-1 font-medium text-right'>
                        <p>{currency}{totalPrice.toLocaleString()}</p>
                        <p>Free</p>
                        {coupon && <p>{`-${currency}${(coupon.discount / 100 * totalPrice).toFixed(2)}`}</p>}
                    </div>
                </div>
                {
                    !coupon ? (
                        <form onSubmit={e => toast.promise(handleCouponCode(e), { loading: 'Checking Coupon...' })} className='flex justify-center gap-3 mt-3'>
                            <input onChange={(e) => setCouponCodeInput(e.target.value)} value={couponCodeInput} type="text" placeholder='Coupon Code' className='border border-slate-400 p-1.5 rounded w-full outline-none' />
                            <button className='bg-slate-600 text-white px-3 rounded hover:bg-slate-800 active:scale-95 transition-all'>Apply</button>
                        </form>
                    ) : (
                        <div className='w-full flex items-center justify-center gap-2 text-xs mt-2'>
                            <p>Code: <span className='font-semibold ml-1'>{coupon.code.toUpperCase()}</span></p>
                            <p>{coupon.description}</p>
                            <XIcon size={18} onClick={() => setCoupon('')} className='hover:text-red-700 transition cursor-pointer' />
                        </div>
                    )
                }
            </div>
            <div className='flex justify-between py-4'>
                 <p>Total:</p>
                 <p className='font-medium text-right'>{currency}{coupon ? (totalPrice - (coupon.discount / 100 * totalPrice)).toFixed(2) : totalPrice.toLocaleString()}</p>
             </div>
             <button onClick={handlePlaceOrder} className='w-full bg-slate-700 text-white py-2.5 rounded hover:bg-slate-900 active:scale-95 transition-all'>Place Order</button>

            {showAddressModal && <AddressModal setShowAddressModal={setShowAddressModal} />}

        </div>
    )
}

export default OrderSummary
