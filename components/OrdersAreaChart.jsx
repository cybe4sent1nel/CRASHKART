'use client'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function OrdersAreaChart({ allOrders, timePeriod = 'monthly' }) {

    const getChartLabel = () => {
        switch(timePeriod) {
            case 'daily':
                return 'Orders / Day (Last 30 Days)'
            case 'weekly':
                return 'Orders / Week (Last 12 Weeks)'
            case 'monthly':
                return 'Orders / Month (Last 12 Months)'
            case 'yearly':
                return 'Orders / Year (Last 5 Years)'
            default:
                return 'Orders / Day'
        }
    }

    // Convert allOrders data format (which is revenue-based) to count-based for display
    const chartData = allOrders && allOrders.length > 0 ? allOrders : []

    return (
        <div className="w-full max-w-4xl h-[300px] text-xs">
            <h3 className="text-lg font-medium text-slate-800 mb-4 pt-2 text-right">
                <span className='text-slate-500'>{getChartLabel()}</span>
            </h3>
            <ResponsiveContainer width="100%" height="100%"> 
                <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                        dataKey="createdAt" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                    />
                    <YAxis 
                        allowDecimals={false} 
                        label={{ value: 'Revenue', angle: -90, position: 'insideLeft' }} 
                    />
                    <Tooltip 
                        formatter={(value) => `₹${value.toFixed(2)}`}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="total" 
                        stroke="#ef4444" 
                        fill="#fca5a5" 
                        strokeWidth={2}
                        name="Revenue"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
