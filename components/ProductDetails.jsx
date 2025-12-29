'use client'

import { addToCart } from "@/lib/features/cart/cartSlice";
import { StarIcon, TagIcon, EarthIcon, CreditCardIcon, UserIcon, MapPin, Calendar, Check, Package, AlertCircle, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import Counter from "./Counter";
import { useDispatch, useSelector } from "react-redux";
import { Lens } from "./Lens";
import ShoppingBagAnimation from "./animations/ShoppingBagAnimation";
import SellerStoreCard from "./SellerStoreCard";
import OutOfStockDisplay from "./OutOfStockDisplay";
import { toast } from "react-hot-toast";
import CrashCashCard from "./CrashCashCard";

const ProductDetails = ({ product, flashSaleData }) => {

    const productId = product.id;
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$';
    
    // Calculate flash sale price if product is in active sale
    const flashSaleDiscount = flashSaleData?.discount || 0;
    const basePrice = product.price || product.originalPrice;
    const displayPrice = flashSaleDiscount > 0 ? basePrice * (1 - flashSaleDiscount / 100) : basePrice;
    const displayMRP = product.mrp || basePrice;

    const cart = useSelector(state => state.cart.cartItems);
    const dispatch = useDispatch();

    const router = useRouter()

    const [mainImage, setMainImage] = useState(product.images && product.images.length > 0 ? product.images[0] : null);
    const [showAddedAnimation, setShowAddedAnimation] = useState(false);
    const [pincode, setPincode] = useState('');
    const [deliveryInfo, setDeliveryInfo] = useState(null);
    const [pincodeError, setPincodeError] = useState('');
    const [notifyEmail, setNotifyEmail] = useState('');
    const [showNotifyModal, setShowNotifyModal] = useState(false);
    const [notifyLoading, setNotifyLoading] = useState(false);
    const [locationData, setLocationData] = useState(null);
    const [geocodingLoading, setGeocodingLoading] = useState(false);

    const checkPincode = async () => {
        setPincodeError('');
        setDeliveryInfo(null);
        setLocationData(null);

        // Validate pincode (6 digits)
        if (!pincode || pincode.length !== 6 || isNaN(pincode)) {
            setPincodeError('❌ Please enter a valid 6-digit pincode');
            return;
        }

        // Lookup pincode using free Postalpincode API
        setGeocodingLoading(true);
        let isValidPincode = false;
        
        try {
            const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
            const data = await response.json();

            if (data && data[0] && data[0].Status === 'Success') {
                isValidPincode = true;
                const postOffice = data[0].PostOffice[0];
                const city = postOffice.District;
                const state = postOffice.State;
                const address = `${postOffice.Name}, ${city}, ${state}`;

                // Use Nominatim for reverse geocoding to get coordinates
                try {
                    const nominatimResponse = await fetch(
                        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
                    );
                    const nominatimData = await nominatimResponse.json();

                    if (nominatimData && nominatimData.length > 0) {
                        const location = nominatimData[0];
                        setLocationData({
                            address: address,
                            latitude: parseFloat(location.lat),
                            longitude: parseFloat(location.lon),
                            city,
                            state
                        });
                    } else {
                        // Location data without coordinates
                        setLocationData({
                            address: address,
                            city,
                            state
                        });
                    }
                } catch (nominatimError) {
                    console.log('Nominatim geocoding failed, showing pincode data only', nominatimError);
                    // Still show location data even if nominatim fails
                    setLocationData({
                        address: address,
                        city,
                        state
                    });
                }
            } else {
                setPincodeError('❌ Invalid pincode. This pincode does not exist in India. Please enter a valid pincode.');
                setGeocodingLoading(false);
                return;
            }
        } catch (error) {
            console.error('Pincode lookup error:', error);
            setPincodeError('⚠️ Failed to lookup pincode. Please check your internet connection and try again.');
            setGeocodingLoading(false);
            return;
        }

        // Only calculate delivery if pincode is valid
        if (isValidPincode) {
            // Mock delivery calculation (in real app, this would be an API call)
            // Different pincodes can have different delivery times
            const pincodeNum = parseInt(pincode);
            let deliveryDays = 3;

            if (pincodeNum < 200000) {
                deliveryDays = 2; // Metro areas
            } else if (pincodeNum < 400000) {
                deliveryDays = 3; // Semi-metro
            } else if (pincodeNum < 600000) {
                deliveryDays = 4; // Tier 2 cities
            } else {
                deliveryDays = 5; // Remote areas
            }

            // Calculate delivery date from today
            const today = new Date();
            const deliveryDate = new Date(today.getTime() + deliveryDays * 24 * 60 * 60 * 1000);

            setDeliveryInfo({
                days: deliveryDays,
                date: deliveryDate,
                pincode: pincode
            });
        }
        
        setGeocodingLoading(false);
    };

    const formatDeliveryDate = (date) => {
        return date.toLocaleDateString('en-IN', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const addToCartHandler = () => {
        dispatch(addToCart({ productId }))
        setShowAddedAnimation(true);
        setTimeout(() => {
            setShowAddedAnimation(false);
        }, 2500);
    }

    const averageRating = product.rating.reduce((acc, item) => acc + item.rating, 0) / product.rating.length;
    
    const handleNotifyOutOfStock = async () => {
        if (!notifyEmail || !notifyEmail.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }

        setNotifyLoading(true);
        try {
            const response = await fetch('/api/notify-me/out-of-stock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: product.id,
                    productName: product.name,
                    userEmail: notifyEmail
                })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('You will be notified when this product is back in stock');
                setShowNotifyModal(false);
                setNotifyEmail('');
            } else {
                toast.error(data.error || 'Failed to set notification');
            }
        } catch (error) {
            console.error('Error setting notification:', error);
            toast.error('Failed to set notification');
        } finally {
            setNotifyLoading(false);
        }
    };
    
    return (
        <div className="w-full">
            {/* Main Product Section */}
            <div className="flex max-lg:flex-col gap-8 lg:gap-12 mb-12">
                {/* Product Images */}
                <div className="flex max-sm:flex-col-reverse gap-3 lg:flex-1">
                    <div className="flex sm:flex-col gap-3">
                        {product.images && product.images.length > 0 && product.images.map((image, index) => (
                            <div key={index} onClick={() => setMainImage(product.images[index])} className="bg-slate-100 dark:bg-slate-800 flex items-center justify-center size-26 rounded-lg group cursor-pointer border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition">
                                <Image src={image} className="group-hover:scale-105 group-active:scale-95 transition" alt="" width={45} height={45} />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-center items-center h-100 sm:size-113 bg-slate-100 dark:bg-slate-800 rounded-lg relative border border-slate-200 dark:border-slate-700 shadow-sm">
                         {product.quantity === 0 ? (
                              <>
                                  {/* Show product image with out of stock overlay */}
                                  {mainImage && (
                                      <Image src={mainImage} alt="" width={250} height={250} className="opacity-40" />
                                  )}
                                  {/* Out of stock animation overlay */}
                                  <div className="absolute inset-0 flex items-center justify-center">
                                      <OutOfStockDisplay size="medium" />
                                  </div>
                              </>
                          ) : (
                              mainImage && (
                                  <Lens zoomFactor={1.5} lensSize={200}>
                                      <Image src={mainImage} alt="" width={250} height={250} />
                                  </Lens>
                              )
                          )}
                      </div>
                </div>

                {/* Product Details */}
                <div className="flex-1">
                <h1 className="text-3xl font-semibold text-slate-800 dark:text-white">{product.name}</h1>
                <div className='flex items-center mt-2'>
                    {Array(5).fill('').map((_, index) => (
                        <StarIcon key={index} size={14} className='text-transparent mt-0.5' fill={averageRating >= index + 1 ? "#00C950" : "#D1D5DB"} />
                    ))}
                    <p className="text-sm ml-3 text-slate-500 dark:text-slate-400">{product.rating.length} Reviews</p>
                </div>
                <div className="flex items-start my-6 gap-3 text-2xl font-semibold text-slate-800 dark:text-white">
                     <p> {currency}{displayPrice.toFixed(2)} </p>
                     <p className="text-xl text-slate-500 dark:text-slate-400 line-through">{currency}{displayMRP}</p>
                     {flashSaleDiscount > 0 && (
                         <span className="text-sm bg-red-600 text-white px-3 py-1 rounded-lg font-semibold">
                             -{flashSaleDiscount}% FLASH SALE
                         </span>
                     )}
                 </div>
                 <div className="flex items-center gap-2 text-slate-500">
                     <TagIcon size={14} />
                     <p>Save {((displayMRP - displayPrice) / displayMRP * 100).toFixed(0)}% right now</p>
                 </div>

                {/* Pincode Check Section */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 my-6">
                    <div className="flex items-center gap-2 mb-3">
                        <MapPin size={18} className="text-green-600" />
                        <h3 className="text-base font-semibold text-slate-800 dark:text-white">Check Delivery Estimate</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Enter 6-digit pincode"
                                value={pincode}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                    setPincode(val);
                                }}
                                onKeyPress={(e) => e.key === 'Enter' && checkPincode()}
                                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                            <button
                                onClick={checkPincode}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                            >
                                Check
                            </button>
                        </div>

                        {geocodingLoading && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg text-center">
                                <p className="text-sm text-blue-700 dark:text-blue-400">Detecting location...</p>
                            </div>
                        )}

                        {pincodeError && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
                                <p className="text-red-700 dark:text-red-400 text-sm font-medium">{pincodeError}</p>
                            </div>
                        )}

                        {locationData && !geocodingLoading && (
                            <div className="p-3 bg-white dark:bg-slate-800 border border-green-300 dark:border-green-700 rounded-lg">
                                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2"><strong>📍 Location Detected:</strong></p>
                                <p className="text-sm font-semibold text-slate-800 dark:text-white">{locationData.city || 'N/A'}</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400">{locationData.state || 'N/A'}</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">{locationData.address}</p>
                            </div>
                        )}

                        {deliveryInfo && (
                            <div className="p-3 bg-white dark:bg-slate-800 border border-green-300 dark:border-green-700 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Check size={16} className="text-green-600" />
                                    <span className="text-sm font-semibold text-slate-800 dark:text-white">Delivery Available!</span>
                                </div>
                                <div className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                                    <p className="flex items-center gap-2">
                                        <Calendar size={14} className="text-green-600" />
                                        Estimated Delivery: <span className="font-semibold">{formatDeliveryDate(deliveryInfo.date)}</span>
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <Package size={14} className="text-green-600" />
                                        Expected in {deliveryInfo.days} business day{deliveryInfo.days > 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* CrashCash Earning Card */}
                <CrashCashCard product={product} />

                {/* Hurry Only Few Left Alert - Show only when stock > 0 AND stock <= 5 */}
                {product.quantity > 0 && product.quantity <= 5 && (
                    <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg p-4 my-6 flex items-center gap-3">
                        <AlertCircle size={24} className="text-red-600 flex-shrink-0" />
                        <div>
                            <p className="font-bold text-red-700 dark:text-red-400 text-lg">Hurry! Only {product.quantity} left</p>
                            <p className="text-sm text-red-600 dark:text-red-300">Limited stock available - order soon!</p>
                        </div>
                    </div>
                )}

                <div className="flex items-end gap-5 mt-10 flex-wrap">
                    {
                        cart[productId] && product.quantity > 0 && (
                            <div className="flex flex-col gap-3">
                                <p className="text-lg text-slate-800 font-semibold">Quantity</p>
                                <Counter productId={productId} />
                            </div>
                        )
                    }
                    <div className="flex gap-3 flex-wrap">
                        {product.inStock && product.quantity > 0 ? (
                            <>
                                <button onClick={() => !cart[productId] ? addToCartHandler() : router.push('/cart')} className="bg-slate-800 text-white px-10 py-3 text-sm font-medium rounded hover:bg-slate-900 active:scale-95 transition">
                                    {!cart[productId] ? 'Add to Cart' : 'View Cart'}
                                </button>
                                <button onClick={() => {
                                     // For Buy Now: Save only this product to session storage
                                     // Use sale price if available for flash sale items
                                     const effectivePrice = product.salePrice || product.price || product.originalPrice
                                     const buyNowData = {
                                          isBuyNow: true,
                                          product: {
                                              id: product.id,
                                              productId: product.id,
                                              name: product.name,
                                              price: effectivePrice,
                                              salePrice: effectivePrice,
                                              quantity: 1,
                                              images: product.images,
                                              originalPrice: product.originalPrice || product.price,
                                              storeId: product.storeId || product.store_id || 'seller_1',
                                              category: product.category,
                                              description: product.description
                                          }
                                      };
                                      sessionStorage.setItem('buyNowData', JSON.stringify(buyNowData));
                                      // Redirect to dedicated buy-now-checkout route
                                      router.push('/buy-now-checkout');
                                  }} className="bg-red-600 text-white px-10 py-3 text-sm font-medium rounded hover:bg-red-700 active:scale-95 transition">
                                      Buy Now
                                  </button>
                            </>
                        ) : (
                            <button 
                                onClick={() => setShowNotifyModal(true)}
                                className="bg-amber-600 hover:bg-amber-700 text-white px-10 py-3 text-sm font-medium rounded transition flex items-center gap-2"
                            >
                                <Bell size={18} />
                                Notify Me
                            </button>
                        )}
                    </div>
                </div>
                
                {/* Crash Cash Reward Section */}
                {product.crashCashValue && product.crashCashValue > 0 && (
                    <>
                    <hr className="border-gray-300 my-5" />
                    <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <img src="/crashcash.ico" alt="Crash Cash" className="w-6 h-6" />
                            <h3 className="text-lg font-bold text-amber-900">Earn Crash Cash on this Purchase!</h3>
                        </div>
                        <p className="text-amber-900 font-semibold text-lg">Get up to {currency}{product.crashCashValue} Crash Cash</p>
                        <p className="text-sm text-amber-800 mt-2">Use it as a discount code on your next purchase. Expires in 30 days from order date.</p>
                    </div>
                    </>
                )}
                
                <hr className="border-gray-300 my-5" />

                {/* Offers Section */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-3">Available Offers</h3>
                    <ul className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <li className="flex items-start gap-2">
                            <span className="text-green-600 font-bold">•</span>
                            <span>Save {((product.mrp - product.price) / product.mrp * 100).toFixed(0)}% on this product</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-600 font-bold">•</span>
                            <span>Free shipping on orders above {currency}500</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-600 font-bold">•</span>
                            <span>Get instant cashback up to 5% with credit cards</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-600 font-bold">•</span>
                            <span>Easy 30-day return policy</span>
                        </li>
                    </ul>
                </div>

                <div className="flex flex-col gap-4 text-slate-500 dark:text-slate-400">
                    <p className="flex gap-3"> <EarthIcon className="text-slate-400 dark:text-slate-500" /> Free shipping worldwide </p>
                    <p className="flex gap-3"> <CreditCardIcon className="text-slate-400 dark:text-slate-500" /> 100% Secured Payment </p>
                    <p className="flex gap-3"> <UserIcon className="text-slate-400 dark:text-slate-500" /> Trusted by top brands </p>
                </div>

            </div>

            </div>

            {/* Seller Store Card - Full Width */}
            <div className="w-full mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
                <SellerStoreCard seller={product.store} />
            </div>

            {/* Out of Stock Notify Modal */}
            {showNotifyModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                                <Bell size={20} className="text-amber-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Get Notified</h3>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            We'll notify you as soon as <strong>{product.name}</strong> is back in stock.
                        </p>
                        <div className="space-y-3 mb-4">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={notifyEmail}
                                onChange={(e) => setNotifyEmail(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowNotifyModal(false)}
                                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleNotifyOutOfStock}
                                disabled={notifyLoading}
                                className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg transition font-medium flex items-center justify-center gap-2"
                            >
                                {notifyLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Setting...
                                    </>
                                ) : (
                                    <>
                                        <Bell size={16} />
                                        Set Notification
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Shopping Bag Animation Modal */}
            {showAddedAnimation && (
                <div className="fixed inset-0 flex items-center justify-center z-[100]">
                    <div className="text-center">
                        <ShoppingBagAnimation width="250px" height="250px" />
                    </div>
                </div>
            )}
        </div>
    )
}

export default ProductDetails