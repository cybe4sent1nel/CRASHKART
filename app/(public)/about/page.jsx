'use client'
import Link from 'next/link'
import { Mail, Phone, MapPin, Heart, Zap, Shield, Linkedin, Github } from 'lucide-react'
import LottieAnimation from '@/components/LottieAnimation'
import teamAnimData from '@/public/About Us Team.json'

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 transition">
            {/* Hero Section with Animation */}
            <section className="max-w-6xl mx-auto px-6 py-20">
                {/* Animated Team Background */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 dark:opacity-5">
                    <LottieAnimation 
                        animationData={teamAnimData}
                        loop={true}
                        autoplay={true}
                        style={{ width: '100%', height: '100%', maxWidth: '1200px' }}
                    />
                </div>

                <div className="text-center mb-16 relative z-10">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <img src="/logo.bmp" alt="CrashKart" className="w-16 h-16" />
                        <h1 className="text-5xl font-bold">
                            <span className="text-red-600">crash</span>kart
                        </h1>
                    </div>
                    <p className="text-2xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                        Your Ultimate Destination for Smart Gadgets & Innovation
                    </p>
                </div>

                {/* About CrashKart */}
                <div className="grid md:grid-cols-2 gap-12 mb-20">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">About CrashKart</h2>
                        <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                            CrashKart is your premier online marketplace for cutting-edge gadgets, electronics, and innovative technology products. We are committed to bringing you the latest smartphones, smartwatches, earphones, headphones, laptops, and essential accessories—all in one convenient platform.
                        </p>
                        <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                            Founded with a passion for technology and customer satisfaction, CrashKart combines quality, affordability, and convenience. We curate the best products from trusted brands and sellers, ensuring you get authentic products at competitive prices.
                        </p>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            Our mission is to make technology accessible to everyone by providing a seamless shopping experience, reliable customer support, and innovative features like CrashCash rewards.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 p-6 rounded-lg">
                            <Zap className="w-8 h-8 text-red-600 mb-3" />
                            <h3 className="font-bold text-slate-800 dark:text-white mb-2">Fast Delivery</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300">Quick and reliable shipping to your doorstep</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 p-6 rounded-lg">
                            <Shield className="w-8 h-8 text-blue-600 mb-3" />
                            <h3 className="font-bold text-slate-800 dark:text-white mb-2">Secure Shopping</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300">100% secure transactions and buyer protection</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 p-6 rounded-lg">
                            <Heart className="w-8 h-8 text-purple-600 mb-3" />
                            <h3 className="font-bold text-slate-800 dark:text-white mb-2">Customer First</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300">24/7 customer support for all your needs</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 p-6 rounded-lg">
                            <Zap className="w-8 h-8 text-green-600 mb-3" />
                            <h3 className="font-bold text-slate-800 dark:text-white mb-2">CrashCash Rewards</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300">Earn rewards on every purchase and more</p>
                        </div>
                    </div>
                </div>

                {/* Our Values */}
                <div className="mb-20">
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-12 text-center">Our Core Values</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="p-8 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-lg transition">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">Quality</h3>
                            <p className="text-slate-600 dark:text-slate-300">
                                We only partner with trusted brands and sellers to ensure you receive authentic, high-quality products that meet international standards.
                            </p>
                        </div>
                        <div className="p-8 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-lg transition">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">Affordability</h3>
                            <p className="text-slate-600 dark:text-slate-300">
                                We believe technology should be accessible to everyone. Our competitive prices and frequent deals make premium gadgets affordable.
                            </p>
                        </div>
                        <div className="p-8 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-lg transition">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">Transparency</h3>
                            <p className="text-slate-600 dark:text-slate-300">
                                Clear pricing, honest product descriptions, and transparent policies—we believe in building trust with our customers.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Developer Section */}
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800/30 p-12 rounded-lg mb-20">
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-8 text-center">Meet the Developer</h2>
                    <div className="max-w-2xl mx-auto text-center">
                        <div className="mb-6">
                            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-600 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
                                FK
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Fahad Khan</h3>
                            <p className="text-slate-600 dark:text-slate-300 mb-6">
                                Full-Stack Developer & Founder of CrashKart
                            </p>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                            Fahad Khan is a passionate full-stack developer with expertise in modern web technologies. He built CrashKart from the ground up with a vision to revolutionize the online gadget shopping experience. With a focus on user experience, security, and innovation, Fahad has created a platform that serves thousands of customers with quality and reliability.
                        </p>
                        <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                            When he's not coding, Fahad is constantly exploring new technologies and staying updated with the latest trends in web development and e-commerce.
                        </p>

                        {/* Developer Contact */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                            <h4 className="font-bold text-slate-800 dark:text-white mb-6">Get in Touch with the Developer</h4>
                            <div className="space-y-4">
                                <a
                                    href="mailto:fahadkhanxyz8816@gmail.com"
                                    className="flex items-center justify-center gap-3 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
                                >
                                    <Mail size={18} />
                                    fahadkhanxyz8816@gmail.com
                                </a>
                                <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                                    Send feedback, suggestions, or feature requests
                                </p>
                                
                                {/* Social Media Icons */}
                                <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                                    <a
                                        href="https://www.linkedin.com/in/fahad-cybersecurity-ai/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition transform hover:scale-110"
                                        title="LinkedIn"
                                    >
                                        <Linkedin size={20} />
                                    </a>
                                    <a
                                        href="https://github.com/cybe4sent1nel"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-3 bg-slate-800 hover:bg-slate-900 text-white rounded-full transition transform hover:scale-110"
                                        title="GitHub"
                                    >
                                        <Github size={20} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Support & Contact Section */}
                <div className="mb-20">
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-12 text-center">Contact & Support</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
                            <Mail className="w-12 h-12 text-red-600 mx-auto mb-4" />
                            <h3 className="font-bold text-slate-800 dark:text-white mb-3">Support Email</h3>
                            <p className="text-slate-600 dark:text-slate-300 mb-4">For customer support and general inquiries</p>
                            <a
                                href="mailto:crashkart.help@gmail.com"
                                className="inline-block px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium text-sm"
                            >
                                crashkart.help@gmail.com
                            </a>
                        </div>

                        <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
                            <Mail className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                            <h3 className="font-bold text-slate-800 dark:text-white mb-3">Developer Feedback</h3>
                            <p className="text-slate-600 dark:text-slate-300 mb-4">Send feedback and feature requests directly</p>
                            <a
                                href="mailto:fahadkhanxyz8816@gmail.com"
                                className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium text-sm"
                            >
                                fahadkhanxyz8816@gmail.com
                            </a>
                        </div>

                        <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
                            <Phone className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                            <h3 className="font-bold text-slate-800 dark:text-white mb-3">Phone Support</h3>
                            <p className="text-slate-600 dark:text-slate-300 mb-4">Call us for immediate assistance</p>
                            <a
                                href="tel:1-800-2727-5278"
                                className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium text-sm"
                            >
                                1-800-CRASH-KART
                            </a>
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="bg-gradient-to-r from-red-600 to-purple-600 rounded-lg p-12 text-center text-white">
                    <h2 className="text-3xl font-bold mb-4">Ready to Explore CrashKart?</h2>
                    <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
                        Join thousands of satisfied customers and discover the latest gadgets at unbeatable prices. Start your shopping journey today!
                    </p>
                    <Link
                        href="/shop"
                        className="inline-block px-8 py-3 bg-white hover:bg-slate-100 text-red-600 rounded-lg transition font-bold"
                    >
                        Start Shopping
                    </Link>
                </div>
            </section>
        </div>
    )
}
