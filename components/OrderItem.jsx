'use client'
import Image from "next/image";
import { DotIcon, Star, ChevronDown, ChevronUp } from "lucide-react";
import { useSelector } from "react-redux";
import Rating from "./Rating";
import { useState, useEffect } from "react";
import RatingModal from "./RatingModal";
import { getProductImage } from "@/lib/productImageHelper";
import OrderTracking from "./OrderTracking";
import OutOfStockDisplay from "./OutOfStockDisplay";
import { toast } from "react-hot-toast";

const OrderItem = ({ order: initialOrder }) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$';
    const [ratingModal, setRatingModal] = useState(null);
    const [showTracking, setShowTracking] = useState(false);
    const [order, setOrder] = useState(initialOrder);

    const handleDownloadInvoice = async (orderId) => {
        try {
            const response = await fetch(`/api/orders/${orderId}/invoice`);
            if (!response.ok) throw new Error('Failed to generate invoice');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${orderId}.html`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('Invoice downloaded successfully');
        } catch (error) {
            console.error('Invoice download error:', error);
            toast.error('Failed to download invoice');
        }
    };

    // Sync with localStorage whenever tracking is shown
    useEffect(() => {
        if (!showTracking) return;

        const updateOrderFromStorage = () => {
            const userOrders = JSON.parse(localStorage.getItem('userOrders') || '[]');
            const updatedOrder = userOrders.find(o => o.id === order.id);
            if (updatedOrder && updatedOrder.status !== order.status) {
                console.log('🔄 Order status updated from storage:', {
                    from: order.status,
                    to: updatedOrder.status
                });
                setOrder(updatedOrder);
            }
        };

        // Check immediately
        updateOrderFromStorage();

        // Poll every 500ms while tracking is open
        const interval = setInterval(updateOrderFromStorage, 500);

        return () => clearInterval(interval);
    }, [showTracking, order.id]);

    const { ratings } = useSelector(state => state.rating);

    return (
        <>
            <tr className="text-sm">
                <td className="text-left">
                    <div className="flex flex-col gap-6">
                        {order.orderItems.map((item, index) => {
                            const productImage = getProductImage(item.product);
                            return (
                                <div key={index} className="flex items-center gap-4">
                                     <div className="w-20 aspect-square bg-slate-100 flex items-center justify-center rounded-md overflow-hidden relative">
                                         {!item.product?.inStock ? (
                                             <>
                                                 {/* Show product image with out of stock overlay */}
                                                 {productImage ? (
                                                     <Image
                                                         className="h-full w-full object-contain opacity-30"
                                                         src={productImage}
                                                         alt={item.product?.name || "product_img"}
                                                         width={80}
                                                         height={80}
                                                         priority={false}
                                                         unoptimized={true}
                                                     />
                                                 ) : (
                                                     <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs bg-slate-100 opacity-30">
                                                         No Image
                                                     </div>
                                                 )}
                                                 {/* Out of stock animation overlay */}
                                                 <div className='absolute inset-0 flex items-center justify-center'>
                                                     <OutOfStockDisplay size="small" />
                                                 </div>
                                             </>
                                         ) : (
                                             <>
                                                 {productImage ? (
                                                     <Image
                                                         className="h-full w-full object-contain"
                                                         src={productImage}
                                                         alt={item.product?.name || "product_img"}
                                                         width={80}
                                                         height={80}
                                                         priority={false}
                                                         unoptimized={true}
                                                     />
                                                 ) : (
                                                     <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs bg-slate-100">
                                                         No Image
                                                     </div>
                                                 )}
                                             </>
                                         )}
                                     </div>
                                    <div className="flex flex-col justify-center text-sm">
                                        <p className="font-medium text-slate-600 text-base">{item.product.name}</p>
                                        <p>{currency}{item.price} Qty : {item.quantity} </p>
                                        <p className="mb-1">{new Date(order.createdAt).toDateString()}</p>
                                        <div>
                                            {ratings.find(rating => order.id === rating.orderId && item.product.id === rating.productId)
                                                ? <Rating value={ratings.find(rating => order.id === rating.orderId && item.product.id === rating.productId).rating} />
                                                : (
                                                    <button
                                                        onClick={() => setRatingModal({ orderId: order.id, productId: item.product.id, productName: item.product.name })}
                                                        className={`px-3 py-1 rounded-md text-sm font-medium transition ${order.status === "DELIVERED"
                                                            ? "text-green-600 hover:bg-green-100 bg-green-50 cursor-pointer"
                                                            : "text-gray-400 cursor-not-allowed opacity-50"
                                                            }`}
                                                        disabled={order.status !== "DELIVERED"}
                                                    >
                                                        <Star className="w-4 h-4 inline mr-1 fill-current" /> Rate Product
                                                    </button>
                                                )
                                            }</div>
                                        {ratingModal && <RatingModal ratingModal={ratingModal} setRatingModal={setRatingModal} />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </td>

                <td className="text-center max-md:hidden">{currency}{order.total}</td>

                <td className="text-left max-md:hidden">
                    <p>{order.address.name}, {order.address.street},</p>
                    <p>{order.address.city}, {order.address.state}, {order.address.zip}, {order.address.country},</p>
                    <p>{order.address.phone}</p>
                </td>

                <td className="text-left space-y-2 text-sm max-md:hidden">
                    <button
                        onClick={() => setShowTracking(!showTracking)}
                        className={`w-full flex items-center justify-between gap-1 rounded-lg p-2 transition ${order.status?.toUpperCase().includes('DELIVERED') || order.status === 'delivered'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                            : order.status?.toUpperCase().includes('PROCESSING') || order.status === 'confirmed'
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                            }`}
                    >
                        <span className="flex items-center gap-1">
                            <DotIcon size={10} className="scale-250" />
                            {(order.status || 'pending').split('_').join(' ').toLowerCase()}
                        </span>
                        {showTracking ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <button
                        onClick={() => handleDownloadInvoice(order.id)}
                        className="w-full px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-lg text-xs font-medium transition"
                    >
                        📄 Download Invoice
                    </button>
                </td>
            </tr>
            {/* Expanded Tracking View */}
            {showTracking && (
                <tr>
                    <td colSpan={4} className="p-6 bg-slate-50 dark:bg-slate-700/50">
                        <OrderTracking order={order} onStatusChange={setOrder} />
                    </td>
                </tr>
            )}
            {/* Mobile */}
            <tr className="md:hidden">
                <td colSpan={5}>
                    <p>{order.address.name}, {order.address.street}</p>
                    <p>{order.address.city}, {order.address.state}, {order.address.zip}, {order.address.country}</p>
                    <p>{order.address.phone}</p>
                    <br />
                    <div className="flex items-center">
                        <span className='text-center mx-auto px-6 py-1.5 rounded bg-green-100 text-green-700' >
                            {order.status.replace(/_/g, ' ').toLowerCase()}
                        </span>
                    </div>
                </td>
            </tr>
            <tr>
                <td colSpan={4}>
                    <div className="border-b border-slate-300 w-6/7 mx-auto" />
                </td>
            </tr>
        </>
    )
}

export default OrderItem