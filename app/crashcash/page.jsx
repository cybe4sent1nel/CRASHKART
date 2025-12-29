import CrashCashBalance from '@/components/CrashCashBalance'

export const metadata = {
    title: 'CrashCash Balance - CrashKart',
    description: 'View your CrashCash balance and rewards history',
}

export default function CrashCashPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <h1 className="text-4xl font-bold text-slate-900 mb-2">CrashCash Wallet</h1>
                <p className="text-slate-600 mb-8">Track your CrashCash winnings and discount offers</p>
                <CrashCashBalance />
            </div>
        </div>
    )
}
