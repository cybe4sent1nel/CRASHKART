'use client'
import ProductDescription from "@/components/ProductDescription";
import ProductDetails from "@/components/ProductDetails";
import RecentlyViewedSection from "@/components/sections/RecentlyViewedSection";
import FlashSaleSection from "@/components/sections/FlashSaleSection";
import BestSellingSection from "@/components/sections/BestSellingSection";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { trackProductView } from "@/components/RecentlyViewed";

export default function Product() {

    const { productId } = useParams();
    const [product, setProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [flashSaleData, setFlashSaleData] = useState(null);
    const reduxProducts = useSelector(state => state.product.list);

    useEffect(() => {
        if (!productId) return;
        
        setIsLoading(true);
        let isMounted = true;
        
        // Fetch flash sale data to check if product is in any active sale
        const fetchFlashSaleData = async () => {
            try {
                const response = await fetch('/api/admin/flash-sales?isActive=true');
                if (response.ok) {
                    const salesData = await response.json();
                    // Find if this product is in any active flash sale
                    const activeSale = salesData.find(sale => 
                        sale.products && sale.products.includes(productId)
                    );
                    if (isMounted && activeSale) {
                        setFlashSaleData(activeSale);
                    }
                }
            } catch (error) {
                console.error('Error fetching flash sales:', error);
            }
        };
        
        fetchFlashSaleData();
        
        // Check Redux first for instant load
        if (reduxProducts && reduxProducts.length > 0) {
            const foundProduct = reduxProducts.find(p => p.id === productId);
            if (foundProduct && isMounted) {
                setProduct(foundProduct);
                trackProductView(foundProduct);
                setIsLoading(false);
                window.scrollTo(0, 0);
                return;
            }
        }
        
        // Fetch from API as fallback
        const fetchProductData = async () => {
            try {
                // First try direct ID lookup
                let response = await fetch(`/api/products/${productId}`);
                let data = await response.json();
                
                if (!isMounted) return;
                
                // If not found by ID, try searching by name (for old product IDs)
                if (!data.success || !data.product) {
                    console.log('Product not found by ID, trying search...');
                    response = await fetch(`/api/products/search?q=${productId}&limit=1`);
                    data = await response.json();
                    
                    if (!data.success || !data.products || data.products.length === 0) {
                        console.warn('Product not found:', productId);
                        if (isMounted) {
                            setProduct(null);
                            setIsLoading(false);
                            window.scrollTo(0, 0);
                        }
                        return;
                    }
                    
                    data.product = data.products[0];
                }
                
                if (data.success && data.product) {
                    const foundProduct = data.product;
                    const formattedProduct = {
                        ...foundProduct,
                        rating: foundProduct.rating || [],
                        quantity: foundProduct.quantity || 0,
                        inStock: foundProduct.inStock !== undefined ? foundProduct.inStock : (foundProduct.quantity > 0),
                        originalPrice: foundProduct.mrp || foundProduct.price,
                        crashCashValue: foundProduct.crashCashValue || 0,
                        store: foundProduct.store || { name: 'CrashKart', id: 'default' }
                    };
                    if (isMounted) {
                        setProduct(formattedProduct);
                        trackProductView(formattedProduct);
                    }
                }
            } catch (error) {
                console.error('Error fetching product:', error);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                    window.scrollTo(0, 0);
                }
            }
        }
        
        fetchProductData();
        
        return () => {
            isMounted = false;
        };
    }, [productId, reduxProducts]);

    if (isLoading) {
        return (
            <div className="mx-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-gray-600 dark:text-gray-400 text-sm mt-8 mb-5">
                        Home / Products /
                    </div>
                    <div className="min-h-[400px] flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <p className="text-gray-600 dark:text-gray-400">Loading product...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="mx-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-gray-600 dark:text-gray-400 text-sm mt-8 mb-5">
                        Home / Products /
                    </div>
                    <div className="min-h-[400px] flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-gray-600 dark:text-gray-400 text-lg">Product not found</p>
                            <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">The product you're looking for doesn't exist or has been removed.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-6">
            <div className="max-w-7xl mx-auto">

                {/* Breadcrums */}
                <div className="  text-gray-600 dark:text-gray-400 text-sm mt-8 mb-5">
                    Home / Products / {product?.category}
                </div>

                {/* Product Details */}
                {product && (<ProductDetails product={product} flashSaleData={flashSaleData} />)}

                {/* Description & Reviews */}
                {product && (<ProductDescription product={product} />)}

                {/* Recently Viewed Products - will only show if there are recently viewed items */}
                <div className="mt-16">
                    <RecentlyViewedSection />
                </div>

                {/* Flash Sale Section */}
                <div className="mt-16">
                    <FlashSaleSection />
                </div>

                {/* Best Selling Products Section */}
                <div className="mt-16">
                    <BestSellingSection />
                </div>
            </div>
        </div>
    );
    }