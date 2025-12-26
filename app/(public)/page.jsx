'use client'
import dynamic from 'next/dynamic'
import BestSelling from "@/components/BestSelling";
import HeroEnhanced from "@/components/HeroEnhanced";
import Newsletter from "@/components/Newsletter";
import OurSpecs from "@/components/OurSpec";
import LatestProducts from "@/components/LatestProducts";
import FlashSaleNew from "@/components/FlashSaleNew";
import { Spotlight } from "@/components/ui/spotlight";
import MobileShoppingAnimation from "@/components/animations/MobileShoppingAnimation";
import RecentlyViewed from "@/components/RecentlyViewed";
import { Check } from "lucide-react";

const TestimonialsStack = dynamic(
    () => import("@/components/TestimonialsStack"),
    { ssr: false }
);

export default function Home() {
    return (
        <div>
            {/* Spotlight Effect Background */}
            <Spotlight className="absolute top-0 left-0 w-full h-[500px] pointer-events-none" fill="rgba(255, 0, 0, 0.1)" />

            {/* Enhanced Hero with Spotlight */}
            <HeroEnhanced />

            {/* App Purpose & Description Section */}
            <div className='bg-white py-12 border-b'>
                <div className='max-w-7xl mx-auto px-6'>
                    <div className='text-center max-w-4xl mx-auto'>
                        <h2 className='text-3xl font-bold mb-4 text-slate-900'>About CrashKart</h2>
                        <p className='text-lg text-slate-600 mb-6'>
                            <strong>CrashKart</strong> is your premier online shopping destination for the latest gadgets, electronics, and accessories. We offer a seamless e-commerce platform where you can browse thousands of products, compare prices, read reviews, and make secure purchases with confidence.
                        </p>
                        <div className='grid md:grid-cols-3 gap-6 mt-8'>
                            <div className='p-4 bg-slate-50 rounded-lg'>
                                <h3 className='font-semibold text-slate-900 mb-2'>🛒 Easy Shopping</h3>
                                <p className='text-sm text-slate-600'>Browse, compare, and buy products with our intuitive interface</p>
                            </div>
                            <div className='p-4 bg-slate-50 rounded-lg'>
                                <h3 className='font-semibold text-slate-900 mb-2'>🔒 Secure Payments</h3>
                                <p className='text-sm text-slate-600'>Shop safely with multiple payment options and encrypted transactions</p>
                            </div>
                            <div className='p-4 bg-slate-50 rounded-lg'>
                                <h3 className='font-semibold text-slate-900 mb-2'>📦 Fast Delivery</h3>
                                <p className='text-sm text-slate-600'>Track your orders in real-time and get fast, reliable shipping</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Shopping Animation Section */}
            <div className='relative py-16 bg-gradient-to-br from-slate-50 to-slate-100'>
                <div className='max-w-7xl mx-auto px-6 flex items-center justify-between gap-12'>
                    <div className='flex-1'>
                        <h2 className='text-4xl font-bold mb-6 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent'>
                            Shop Anytime, Anywhere
                        </h2>
                        <p className='text-lg text-slate-600 mb-6'>
                            Experience seamless shopping on your mobile device. Browse products, track orders, and manage your account all in one convenient app.
                        </p>
                        <div className='space-y-3'>
                            <p className='text-slate-700 flex items-center gap-3'>
                                <span className='text-blue-600'><Check size={18} /></span> Easy product discovery
                            </p>
                            <p className='text-slate-700 flex items-center gap-3'>
                                <span className='text-blue-600'><Check size={18} /></span> Quick checkout process
                            </p>
                            <p className='text-slate-700 flex items-center gap-3'>
                                <span className='text-blue-600'><Check size={18} /></span> Real-time order tracking
                            </p>
                            <p className='text-slate-700 flex items-center gap-3'>
                                <span className='text-blue-600'><Check size={18} /></span> 24/7 Customer support
                            </p>
                        </div>
                    </div>
                    <div className='flex-1 flex justify-center'>
                        <MobileShoppingAnimation width="350px" height="350px" />
                    </div>
                </div>
            </div>

            {/* Flash Sale Section - NOW USING DATABASE-DRIVEN COMPONENT */}
            <FlashSaleNew />

            {/* Latest Products */}
            <LatestProducts />

            {/* Best Selling Products */}
            <BestSelling />

            {/* Recently Viewed Products */}
            <RecentlyViewed />

            {/* Testimonials Stack with Spotlight Background */}
            <div className='relative py-16 bg-gradient-to-br from-blue-50 to-cyan-50 overflow-hidden'>
                <Spotlight className="absolute inset-0 pointer-events-none" fill="rgba(59, 130, 246, 0.15)" />
                <div className='max-w-7xl mx-auto px-6 relative z-10'>
                    <h2 className='text-4xl font-bold text-center mb-12 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent'>
                        What Our Customers Say
                    </h2>
                    <TestimonialsStack />
                </div>
            </div>

            {/* Specs Section */}
            <OurSpecs />

            {/* Newsletter */}
            <Newsletter />
        </div>
    );
}
