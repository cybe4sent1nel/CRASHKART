'use client'
import PageTitle from "@/components/PageTitle"
import { useEffect, useState } from "react";
import OrderItem from "@/components/OrderItem";
import { productDummyData } from "@/assets/assets";

export default function Orders() {

    const [orders, setOrders] = useState([]);

    // Load and enrich orders function
    const loadOrders = () => {
        const savedOrders = localStorage.getItem('userOrders');
        const localOrders = savedOrders ? JSON.parse(savedOrders) : [];

        // CRITICAL: Enrich all orders with complete product data - MUST get images
        const enrichedLocalOrders = localOrders.map(order => {
            return {
                ...order,
                orderItems: order.orderItems.map(item => {
                    // Get full product data from productDummyData
                    const productId = item.productId || item.product?.id;
                    if (!productId) return item;

                    // Look up complete product with images
                    const fullProduct = productDummyData.find(p => p.id === productId);
                    if (fullProduct) {
                        return {
                            ...item,
                            product: fullProduct
                        };
                    }
                    return item;
                })
            };
        });

        // Only show user's actual orders, not dummy data
        // Sort by date (newest first)
        enrichedLocalOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setOrders(enrichedLocalOrders);
    };

    // Initial load
    useEffect(() => {
        loadOrders();
    }, []);

    // Listen for real-time order status updates from admin
    useEffect(() => {
        const handleOrderStatusUpdate = (event) => {
            console.log('📱 USER: Order status updated event received:', event.detail);
            // Reload orders from localStorage to reflect changes
            console.log('🔄 USER: Reloading orders from localStorage');
            loadOrders();
        };

        window.addEventListener('orderStatusUpdated', handleOrderStatusUpdate);
        console.log('👂 USER: Event listener registered for orderStatusUpdated');

        return () => {
            window.removeEventListener('orderStatusUpdated', handleOrderStatusUpdate);
            console.log('👁️ USER: Event listener removed');
        };
    }, []);

    return (
        <div className="min-h-[70vh] mx-6">
            {orders.length > 0 ? (
                (
                    <div className="my-20 max-w-7xl mx-auto">
                        <PageTitle heading="My Orders" text={`Showing total ${orders.length} orders`} linkText={'Go to home'} />

                        <table className="w-full max-w-5xl text-slate-500 table-auto border-separate border-spacing-y-12 border-spacing-x-4">
                            <thead>
                                <tr className="max-sm:text-sm text-slate-600 max-md:hidden">
                                    <th className="text-left">Product</th>
                                    <th className="text-center">Total Price</th>
                                    <th className="text-left">Address</th>
                                    <th className="text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <OrderItem order={order} key={order.id} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            ) : (
                <div className="min-h-[80vh] mx-6 flex items-center justify-center text-slate-400">
                    <h1 className="text-2xl sm:text-4xl font-semibold">You have no orders</h1>
                </div>
            )}
        </div>
    )
}