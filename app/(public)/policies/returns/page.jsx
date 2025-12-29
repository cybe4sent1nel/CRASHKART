'use client'
import { RotateCcw, Clock, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'

export default function ReturnPolicyPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-3">
                        <RotateCcw className="text-blue-600" size={40} />
                        Return & Replacement Policy
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400">
                        At CrashKart, we want you to be completely satisfied with your purchase. Read our comprehensive return policy below.
                    </p>
                </div>

                {/* Quick Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-blue-200 dark:border-blue-900/30">
                        <Clock size={32} className="text-blue-600 dark:text-blue-400 mb-3" />
                        <h3 className="font-semibold text-slate-800 dark:text-white mb-2">7-Day Return Window</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Return items within 7 days of delivery</p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-green-200 dark:border-green-900/30">
                        <CheckCircle2 size={32} className="text-green-600 dark:text-green-400 mb-3" />
                        <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Full Refund</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">100% refund for eligible returns</p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-orange-200 dark:border-orange-900/30">
                        <RotateCcw size={32} className="text-orange-600 dark:text-orange-400 mb-3" />
                        <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Free Return Shipping</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">No cost for authorized returns</p>
                    </div>
                </div>

                {/* Main Policy */}
                <div className="space-y-8">
                    {/* Return Eligibility */}
                    <section className="bg-white dark:bg-slate-800 rounded-lg p-8 border border-slate-200 dark:border-slate-700">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Return Eligibility</h2>
                        
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                                    <CheckCircle2 size={20} className="text-green-600" />
                                    ELIGIBLE FOR RETURN:
                                </h3>
                                <ul className="space-y-2 ml-7">
                                    <li className="flex gap-3">
                                        <span className="text-green-600">✓</span>
                                        <span className="text-slate-600 dark:text-slate-400">Items returned within 7 days of delivery</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-green-600">✓</span>
                                        <span className="text-slate-600 dark:text-slate-400">Original condition with all tags and packaging intact</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-green-600">✓</span>
                                        <span className="text-slate-600 dark:text-slate-400">Defective or damaged items (with proof)</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-green-600">✓</span>
                                        <span className="text-slate-600 dark:text-slate-400">Wrong item delivered</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-green-600">✓</span>
                                        <span className="text-slate-600 dark:text-slate-400">Items not matching description/photos</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                                <h3 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                                    <XCircle size={20} className="text-red-600" />
                                    NOT ELIGIBLE FOR RETURN:
                                </h3>
                                <ul className="space-y-2 ml-7">
                                    <li className="flex gap-3">
                                        <span className="text-red-600">✗</span>
                                        <span className="text-slate-600 dark:text-slate-400">Items returned after 7 days of delivery</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-red-600">✗</span>
                                        <span className="text-slate-600 dark:text-slate-400">Items with signs of wear, use, or washing</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-red-600">✗</span>
                                        <span className="text-slate-600 dark:text-slate-400">Customized or personalized products</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-red-600">✗</span>
                                        <span className="text-slate-600 dark:text-slate-400">Perishable items or food products</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-red-600">✗</span>
                                        <span className="text-slate-600 dark:text-slate-400">Items damaged by mishandling or negligence</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="text-red-600">✗</span>
                                        <span className="text-slate-600 dark:text-slate-400">Items missing original packaging or tags</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Return Process */}
                    <section className="bg-white dark:bg-slate-800 rounded-lg p-8 border border-slate-200 dark:border-slate-700">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">How to Initiate a Return</h2>
                        
                        <div className="space-y-6">
                            {[
                                {
                                    step: 1,
                                    title: 'Visit My Orders',
                                    desc: 'Go to "My Orders" in your account'
                                },
                                {
                                    step: 2,
                                    title: 'Select the Order',
                                    desc: 'Find and click on the order containing the item'
                                },
                                {
                                    step: 3,
                                    title: 'Click Return',
                                    desc: 'Select the item(s) you want to return'
                                },
                                {
                                    step: 4,
                                    title: 'Provide Details',
                                    desc: 'Select issue type and provide description with images'
                                },
                                {
                                    step: 5,
                                    title: 'Get RMA Number',
                                    desc: 'Receive RMA (Return Merchandise Authorization) number'
                                },
                                {
                                    step: 6,
                                    title: 'Send Items',
                                    desc: 'Pack securely and ship with RMA number on package'
                                }
                            ].map((item) => (
                                <div key={item.step} className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white font-bold">
                                            {item.step}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800 dark:text-white">{item.title}</h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Refund Policy */}
                    <section className="bg-white dark:bg-slate-800 rounded-lg p-8 border border-slate-200 dark:border-slate-700">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Refund Policy</h2>
                        
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Refund Amount</h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-4">
                                    You will receive a full refund of the product price. Shipping charges are non-refundable unless the return is due to our error or defective product.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Refund Timeline</h3>
                                <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                                    <li><strong>Receipt of Return:</strong> 1-2 days to process in warehouse</li>
                                    <li><strong>Inspection:</strong> 2-3 days to verify item condition</li>
                                    <li><strong>Approval:</strong> You'll receive notification of approval</li>
                                    <li><strong>Refund Processing:</strong> 3-5 business days to your original payment method</li>
                                    <li><strong>Total Timeline:</strong> 7-15 business days from return shipment</li>
                                </ul>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded p-4 mt-4">
                                <p className="text-sm text-blue-800 dark:text-blue-300">
                                    <strong>Note:</strong> For COD returns, refunds will be credited to your bank account. Provide bank details when initiating the return.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Replacement Policy */}
                    <section className="bg-white dark:bg-slate-800 rounded-lg p-8 border border-slate-200 dark:border-slate-700">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Replacement Policy</h2>
                        
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                            If your item is defective or damaged, we offer a replacement instead of refund, at no additional cost.
                        </p>

                        <div className="space-y-3">
                            <p className="text-slate-600 dark:text-slate-400">
                                <strong>How to Request Replacement:</strong>
                            </p>
                            <ul className="space-y-2 text-slate-600 dark:text-slate-400 ml-4">
                                <li>1. Select "Defective/Damaged" as the issue type</li>
                                <li>2. Upload clear photos of the damage</li>
                                <li>3. Provide detailed description</li>
                                <li>4. We'll approve and ship replacement within 7 days</li>
                            </ul>
                        </div>
                    </section>

                    {/* What's Not Covered */}
                    <section className="bg-red-50 dark:bg-red-900/20 rounded-lg p-8 border border-red-200 dark:border-red-900/50">
                        <h2 className="text-2xl font-bold text-red-900 dark:text-red-400 mb-6 flex items-center gap-2">
                            <AlertCircle size={28} />
                            What's NOT Covered Under Return Policy
                        </h2>
                        
                        <ul className="space-y-3 text-red-900 dark:text-red-300">
                            <li className="flex gap-3">
                                <span>•</span>
                                <span><strong>Normal wear and tear</strong> - Slight scratches, fading from use</span>
                            </li>
                            <li className="flex gap-3">
                                <span>•</span>
                                <span><strong>Water damage</strong> - Due to mishandling or negligence</span>
                            </li>
                            <li className="flex gap-3">
                                <span>•</span>
                                <span><strong>Manufacturing defects</strong> that develop after 30 days of purchase</span>
                            </li>
                            <li className="flex gap-3">
                                <span>•</span>
                                <span><strong>Damage from falls or impacts</strong> - User responsibility</span>
                            </li>
                            <li className="flex gap-3">
                                <span>•</span>
                                <span><strong>Modification or repair</strong> - Attempted repairs void warranty</span>
                            </li>
                            <li className="flex gap-3">
                                <span>•</span>
                                <span><strong>Missing accessories</strong> - Must be returned as complete set</span>
                            </li>
                        </ul>
                    </section>

                    {/* Contact Support */}
                    <section className="bg-white dark:bg-slate-800 rounded-lg p-8 border border-slate-200 dark:border-slate-700">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Need Help?</h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            If you have questions about our return policy, you can:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <a href="/support/complaints" className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                                <h4 className="font-semibold text-slate-800 dark:text-white mb-1">Register Complaint</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Submit your return complaint</p>
                            </a>
                            <a href="/chatbot" className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                                <h4 className="font-semibold text-slate-800 dark:text-white mb-1">Chat Support</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Talk to our support bot</p>
                            </a>
                            <a href="mailto:crashkart.help@gmail.com" className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                                <h4 className="font-semibold text-slate-800 dark:text-white mb-1">Email Support</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">crashkart.help@gmail.com</p>
                            </a>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
