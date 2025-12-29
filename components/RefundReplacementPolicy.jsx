'use client'
import { motion } from 'framer-motion'
import { CheckCircle, Clock, Package, DollarSign, AlertCircle, RotateCcw } from 'lucide-react'

export default function RefundReplacementPolicy() {
    const policies = [
        {
            icon: Clock,
            title: '30 Days Return Policy',
            description: 'You have 30 days from delivery to return or exchange any item.',
            details: [
                'Items must be unused and in original condition',
                'Packaging should be intact',
                'With original bill/invoice',
            ],
            color: 'blue'
        },
        {
            icon: Package,
            title: 'Free Return Pickup',
            description: 'We arrange free pickup from your location for returns.',
            details: [
                'No additional shipping charges',
                'Simple return process',
                'Quick processing',
            ],
            color: 'green'
        },
        {
            icon: DollarSign,
            title: 'Fast Refund',
            description: 'Process refunds within 5-7 business days after receiving returned items.',
            details: [
                'Original payment method refund',
                'No hidden charges',
                'Transparent process',
            ],
            color: 'purple'
        },
        {
            icon: RotateCcw,
            title: 'Easy Exchange',
            description: 'Exchange for a different size, color, or variant at no additional cost.',
            details: [
                'Same day processing',
                'Free shipping for exchange',
                'Instant replacement dispatch',
            ],
            color: 'orange'
        },
    ]

    const conditionsData = [
        {
            title: 'Defective or Damaged Items',
            description: 'If you receive a defective or damaged item:',
            actions: [
                'Report within 7 days of delivery',
                'Provide photo/video evidence',
                'Full refund or replacement',
                'No questions asked'
            ]
        },
        {
            title: 'Wrong Item Received',
            description: 'If you received a wrong item:',
            actions: [
                'Contact us within 7 days',
                'Free return and replacement',
                'Express shipping for replacement',
                'Full refund option available'
            ]
        },
        {
            title: 'Changed Your Mind',
            description: 'Not satisfied with your purchase:',
            actions: [
                'Return within 30 days',
                'Item unused and in original packaging',
                'Full refund (minus shipping if applicable)',
                'Simple return process'
            ]
        },
    ]

    const getColorClasses = (color) => {
        const colors = {
            blue: 'from-blue-500 to-blue-600 bg-blue-50 dark:bg-blue-900/30',
            green: 'from-green-500 to-green-600 bg-green-50 dark:bg-green-900/30',
            purple: 'from-purple-500 to-purple-600 bg-purple-50 dark:bg-purple-900/30',
            orange: 'from-orange-500 to-orange-600 bg-orange-50 dark:bg-orange-900/30'
        }
        return colors[color] || colors.blue
    }

    const getTextColor = (color) => {
        const colors = {
            blue: 'text-blue-600 dark:text-blue-400',
            green: 'text-green-600 dark:text-green-400',
            purple: 'text-purple-600 dark:text-purple-400',
            orange: 'text-orange-600 dark:text-orange-400'
        }
        return colors[color] || colors.blue
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-6xl mx-auto px-4 py-12"
        >
            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-4">
                    Refund & Replacement Policy
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-400">
                    We stand behind our products. Your satisfaction is our priority.
                </p>
            </div>

            {/* Policy Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {policies.map((policy, index) => {
                    const IconComponent = policy.icon
                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`rounded-xl p-6 ${getColorClasses(policy.color)}`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-lg bg-gradient-to-br ${getColorClasses(policy.color)}`}>
                                    <IconComponent size={24} className="text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                                        {policy.title}
                                    </h3>
                                    <p className="text-slate-700 dark:text-slate-300 mb-4">
                                        {policy.description}
                                    </p>
                                    <ul className="space-y-2">
                                        {policy.details.map((detail, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm">
                                                <CheckCircle size={16} className={`flex-shrink-0 mt-0.5 ${getTextColor(policy.color)}`} />
                                                <span className="text-slate-700 dark:text-slate-300">{detail}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            {/* Conditions Section */}
            <div className="mb-12">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-8 text-center">
                    When Do We Refund or Replace?
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {conditionsData.map((condition, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700"
                        >
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                                {condition.title}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">
                                {condition.description}
                            </p>
                            <ul className="space-y-2">
                                {condition.actions.map((action, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm">
                                        <CheckCircle size={16} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                        <span className="text-slate-700 dark:text-slate-300">{action}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Important Notes */}
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl p-6 mb-12">
                <div className="flex gap-4">
                    <AlertCircle size={24} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <div>
                        <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-2">Important Notes</h3>
                        <ul className="space-y-2 text-amber-800 dark:text-amber-200 text-sm">
                            <li>• Returns must be initiated within the specified timeline from delivery date</li>
                            <li>• Items must be returned in original packaging and condition</li>
                            <li>• Refunds are processed to the original payment method</li>
                            <li>• For defective items, no condition on original packaging applies</li>
                            <li>• Return shipping is free for all eligible returns</li>
                            <li>• Refund processing time: 5-7 business days after inspection</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Process Steps */}
            <div>
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-8 text-center">
                    How to Return or Request Replacement
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { step: 1, title: 'Initiate Return', desc: 'Go to My Orders and click Return/Exchange' },
                        { step: 2, title: 'Select Reason', desc: 'Choose the reason for return or replacement' },
                        { step: 3, title: 'Arrange Pickup', desc: 'We arrange free pickup from your location' },
                        { step: 4, title: 'Get Refund', desc: 'Receive refund or replacement within 7 days' },
                    ].map((item, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="relative"
                        >
                            <div className="bg-white dark:bg-slate-800 border-2 border-blue-500 rounded-xl p-6 text-center">
                                <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-4">
                                    {item.step}
                                </div>
                                <h4 className="font-bold text-slate-800 dark:text-white mb-2">{item.title}</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{item.desc}</p>
                            </div>
                            {idx < 3 && (
                                <div className="hidden md:block absolute top-1/2 right-0 w-4 h-0.5 bg-blue-500 transform translate-x-1/2 -translate-y-1/2" />
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    )
}
