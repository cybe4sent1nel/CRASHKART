'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CookiePolicyPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-950">
            {/* Header with Animation */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-12 animate-fade-in-down">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Link href="/" className="flex items-center gap-2 mb-6 w-fit hover:opacity-80 transition-opacity">
                        <ArrowLeft size={20} />
                        <span className="font-semibold">Back to Home</span>
                    </Link>
                    <h1 className="text-4xl font-bold mb-4 animate-slide-in-left">Cookie Policy</h1>
                    <p className="text-lg text-amber-50">Last updated: December 6, 2025</p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="prose dark:prose-invert max-w-none">
                    {/* What are Cookies */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            What are Cookies?
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            Cookies are small files that are stored on your browser or device when you visit our website. They help us remember your preferences, understand how you use our site, and provide you with a better experience. Cookies are not harmful and do not contain viruses.
                        </p>
                    </section>

                    {/* Types of Cookies */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                            Types of Cookies We Use
                        </h2>

                        <div className="space-y-6">
                            {/* Functional Cookies */}
                            <div className="border-l-4 border-amber-500 pl-6 py-4 bg-amber-50 dark:bg-gray-900 dark:border-amber-600 rounded-r-lg">
                                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                                    1. Functional Cookies (Essential)
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 mb-3">
                                    These cookies are necessary for the website to function properly. They help us remember your login information, maintain your shopping cart, and provide security features.
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold">
                                    Status: Always enabled (cannot be disabled)
                                </p>
                            </div>

                            {/* Analytics Cookies */}
                            <div className="border-l-4 border-blue-500 pl-6 py-4 bg-blue-50 dark:bg-gray-900 dark:border-blue-600 rounded-r-lg">
                                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                                    2. Analytics Cookies
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 mb-3">
                                    These cookies help us understand how visitors interact with our website. We use tools like Google Analytics to track page views, user behavior, and other metrics to improve our services.
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    <strong>Tools Used:</strong> Google Analytics
                                </p>
                            </div>

                            {/* Marketing Cookies */}
                            <div className="border-l-4 border-green-500 pl-6 py-4 bg-green-50 dark:bg-gray-900 dark:border-green-600 rounded-r-lg">
                                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                                    3. Marketing Cookies
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 mb-3">
                                    These cookies are used to deliver personalized advertisements based on your interests and browsing behavior. They help us show you relevant products and services.
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    <strong>Tools Used:</strong> Facebook Pixel, Google Ads, Retargeting platforms
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Cookie Consent */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            Your Cookie Preferences
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                            You have the right to control which cookies you allow on your device. When you first visit our website, we present you with a cookie consent banner where you can:
                        </p>
                        <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                            <li><strong>Allow All:</strong> Accept all cookies including analytics and marketing</li>
                            <li><strong>Deny All:</strong> Refuse non-essential cookies (functional cookies remain enabled)</li>
                            <li><strong>Cookie Settings:</strong> Customize your preferences for each cookie category</li>
                        </ul>
                    </section>

                    {/* How to Manage */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            How to Manage Cookies
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                            You can control and delete cookies in your browser settings. Here are links to instructions for popular browsers:
                        </p>
                        <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                            <li>
                                <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                    Google Chrome
                                </a>
                            </li>
                            <li>
                                <a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                    Firefox
                                </a>
                            </li>
                            <li>
                                <a href="https://support.apple.com/en-us/HT201265" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                    Safari
                                </a>
                            </li>
                            <li>
                                <a href="https://support.microsoft.com/en-us/microsoft-edge/security-privacy-and-performance" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                    Microsoft Edge
                                </a>
                            </li>
                        </ul>
                    </section>

                    {/* Contact */}
                    <section className="bg-gray-100 dark:bg-gray-900 rounded-lg p-8">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            Questions About Our Cookie Policy?
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                            If you have any questions about our cookie policy or how we use cookies, please don't hesitate to contact us.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                            <strong>Email:</strong> privacy@crashkart.com<br />
                            <strong>Address:</strong> CrashKart Headquarters, [Your Address]
                        </p>
                    </section>
                </div>
            </div>

            {/* Animations */}
            <style jsx>{`
                @keyframes fade-in-down {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes slide-in-left {
                    from {
                        opacity: 0;
                        transform: translateX(-30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                .animate-fade-in-down {
                    animation: fade-in-down 0.6s ease-out;
                }

                .animate-slide-in-left {
                    animation: slide-in-left 0.7s ease-out 0.2s both;
                }
            `}</style>
        </div>
    );
}
