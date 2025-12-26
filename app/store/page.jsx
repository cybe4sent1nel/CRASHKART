'use client'
import { dummyStoreDashboardData } from "@/assets/assets"
import Loading from "@/components/Loading"
import { CircleDollarSignIcon, ShoppingBasketIcon, StarIcon, TagsIcon } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { MovingBorder } from "@/components/ui/moving-border"
import { Spotlight } from "@/components/ui/spotlight"
import { CardStack } from "@/components/ui/card-stack"
import { Globe } from "@/components/ui/globe"

export default function Dashboard() {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'

    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [dashboardData, setDashboardData] = useState({
        totalProducts: 0,
        totalEarnings: 0,
        totalOrders: 0,
        ratings: [],
    })

    const dashboardCardsData = [
        { title: 'Total Products', value: dashboardData.totalProducts, icon: ShoppingBasketIcon, gradient: 'from-blue-500 to-cyan-500' },
        { title: 'Total Earnings', value: currency + dashboardData.totalEarnings, icon: CircleDollarSignIcon, gradient: 'from-green-500 to-emerald-500' },
        { title: 'Total Orders', value: dashboardData.totalOrders, icon: TagsIcon, gradient: 'from-purple-500 to-pink-500' },
        { title: 'Total Ratings', value: dashboardData.ratings.length, icon: StarIcon, gradient: 'from-yellow-500 to-orange-500' },
    ]

    const fetchDashboardData = async () => {
        setDashboardData(dummyStoreDashboardData)
        setLoading(false)
    }

    useEffect(() => {
        fetchDashboardData()
    }, [])

    if (loading) return <Loading />

    return (
        <div className="text-slate-500 mb-28 relative">
            <Spotlight className="absolute top-0 left-0 w-full h-[600px] pointer-events-none" fill="rgba(34, 197, 94, 0.08)" />
            <div className="relative z-10">
                <h1 className="text-2xl">Seller <span className="text-slate-800 font-medium">Dashboard</span></h1>

                {/* Enhanced Dashboard Cards */}
                <div className="flex flex-wrap gap-5 my-10 mt-4">
                    {
                        dashboardCardsData.map((card, index) => (
                            <MovingBorder key={index} duration={3000} borderClassName={`bg-gradient-to-r ${card.gradient}`}>
                                <div className="bg-white rounded-lg p-6 flex items-center gap-11">
                                    <div className="flex flex-col gap-3 text-xs">
                                        <p className="text-slate-600">{card.title}</p>
                                        <b className="text-2xl font-medium text-slate-800">{card.value}</b>
                                    </div>
                                    <card.icon size={50} className="w-11 h-11 p-2.5 text-white bg-gradient-to-br rounded-full" style={{backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))`}} />
                                </div>
                            </MovingBorder>
                        ))
                    }
                </div>

                {/* Global Sales Map */}
                <div className="my-12">
                    <h2 className="text-xl font-semibold text-slate-800 mb-6">Sales by Region</h2>
                    <MovingBorder duration={3000} borderClassName="bg-gradient-to-r from-indigo-500 to-blue-500">
                        <div className="bg-white rounded-lg p-8 flex items-center justify-center min-h-96">
                            <Globe className="w-full h-full opacity-70" />
                        </div>
                    </MovingBorder>
                </div>

                <h2 className="text-xl font-semibold text-slate-800 mb-6 mt-12">Customer Reviews</h2>

            <div className="mt-8 space-y-4">
                {
                    dashboardData.ratings.map((review, index) => (
                        <MovingBorder key={index} duration={3000} borderClassName="bg-gradient-to-r from-amber-500 to-orange-500">
                            <div className="bg-white rounded-lg p-6 flex max-sm:flex-col gap-5 sm:items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex gap-3 mb-3">
                                        <Image src={review.user.image?.src || review.user.image} alt="" className="w-10 aspect-square rounded-full" width={100} height={100} />
                                        <div>
                                            <p className="font-medium text-slate-800">{review.user.name}</p>
                                            <p className="font-light text-slate-500 text-sm">{new Date(review.createdAt).toDateString()}</p>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-slate-600 max-w-xs leading-6">{review.review}</p>
                                </div>
                                <div className="flex flex-col justify-between gap-4 sm:items-end">
                                    <div className="flex flex-col sm:items-end">
                                        <p className="text-slate-500 text-xs">{review.product?.category}</p>
                                        <p className="font-medium text-slate-800">{review.product?.name}</p>
                                        <div className='flex items-center gap-1 mt-1'>
                                            {Array(5).fill('').map((_, i) => (
                                                <StarIcon key={i} size={16} className='text-transparent' fill={review.rating >= i + 1 ? "#fbbf24" : "#e5e7eb"} />
                                            ))}
                                        </div>
                                    </div>
                                    <button onClick={() => router.push(`/product/${review.product.id}`)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-all font-medium">View Product</button>
                                </div>
                            </div>
                        </MovingBorder>
                    ))
                }
            </div>
            </div>
            </div>
            )
            }