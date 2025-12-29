'use client';

import { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import cookiePolicyAnimation from '@/public/animations/cookie policy.json';
import { X } from 'lucide-react';
import NeonCheckbox from './NeonCheckbox';

export default function CookiePopup() {
    const [showPopup, setShowPopup] = useState(false);
    const [preferences, setPreferences] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [settingsPreferences, setSettingsPreferences] = useState({
        analytics: true,
        marketing: true,
        functional: true,
    });

    // Check if user has already made a choice
    useEffect(() => {
        // Run only on client side
        if (typeof window !== 'undefined') {
            const cookieConsent = localStorage.getItem('cookieConsent');
            if (cookieConsent) {
                // User has already made a choice, don't show popup
                setShowPopup(false);
                return;
            }
            // Show popup after a small delay to ensure page is fully loaded
            const timer = setTimeout(() => {
                setShowPopup(true);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, []);

    // Handle Allow All
    const handleAllowAll = () => {
        const consentData = {
            analytics: true,
            marketing: true,
            functional: true,
            timestamp: new Date().toISOString(),
        };
        localStorage.setItem('cookieConsent', JSON.stringify(consentData));
        setPreferences('allowed');
        setShowPopup(false);
        // Trigger analytics and marketing pixels
        loadAnalytics();
        loadMarketing();
    };

    // Handle Deny All
    const handleDenyAll = () => {
        const consentData = {
            analytics: false,
            marketing: false,
            functional: true, // Functional cookies are always needed
            timestamp: new Date().toISOString(),
        };
        localStorage.setItem('cookieConsent', JSON.stringify(consentData));
        setPreferences('denied');
        setShowPopup(false);
    };

    // Handle Custom Settings
    const handleSaveSettings = () => {
        const consentData = {
            analytics: settingsPreferences.analytics,
            marketing: settingsPreferences.marketing,
            functional: settingsPreferences.functional,
            timestamp: new Date().toISOString(),
        };
        localStorage.setItem('cookieConsent', JSON.stringify(consentData));
        setPreferences('custom');
        setShowPopup(false);
        setShowSettings(false);

        if (settingsPreferences.analytics) loadAnalytics();
        if (settingsPreferences.marketing) loadMarketing();
    };

    // Placeholder functions for loading analytics and marketing
    const loadAnalytics = () => {
        // Load Google Analytics or similar
        console.log('Loading analytics cookies...');
        // Add your analytics script here
    };

    const loadMarketing = () => {
        // Load marketing cookies
        console.log('Loading marketing cookies...');
        // Add your marketing pixels here
    };

    const handleSettingChange = (key) => {
        if (key !== 'functional') {
            // Functional cookies cannot be disabled
            setSettingsPreferences(prev => ({
                ...prev,
                [key]: !prev[key]
            }));
        }
    };

    const openCookiePolicy = () => {
        // You can replace this with actual cookie policy URL or PDF
        const policyUrl = '/cookie-policy'; // Change to your actual policy path
        window.open(policyUrl, '_blank');
    };

    if (!showPopup) return null;

    return (
        <>
            {/* Overlay - Very Subtle */}
            <div
                className="fixed inset-0 bg-black/5 z-40 cursor-pointer"
                onClick={() => !showSettings && setShowPopup(false)}
            />

            {/* Popup Container */}
            <div className="fixed bottom-6 right-6 z-50 w-96 animate-slide-up">
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                    {!showSettings ? (
                        <>
                            {/* Header with Animation */}
                            <div className="relative bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-750 p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                            🍪 Cookie Policy
                                        </h2>
                                    </div>
                                    <button
                                        onClick={() => setShowPopup(false)}
                                        className="p-1 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all duration-200 flex-shrink-0 ml-2"
                                        title="Close cookie popup"
                                        aria-label="Close cookie popup"
                                    >
                                        <X size={20} className="text-gray-700 dark:text-gray-200 hover:text-red-500 dark:hover:text-red-400 transition-colors" />
                                    </button>
                                </div>

                                {/* Lottie Animation */}
                                <div className="flex justify-center mt-2">
                                    <div className="w-20 h-20">
                                        <Lottie
                                            animationData={cookiePolicyAnimation}
                                            loop={true}
                                            autoplay={true}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4 space-y-3">
                                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                                    We use cookies to enhance your experience, serve personalized ads, and analyze traffic.
                                </p>

                                <button
                                    onClick={openCookiePolicy}
                                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline transition-colors"
                                >
                                    Read our Cookie Policy →
                                </button>
                            </div>

                            {/* Action Buttons */}
                            <div className="px-4 pb-4 space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={handleDenyAll}
                                        className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-semibold rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                                    >
                                        Deny
                                    </button>
                                    <button
                                        onClick={handleAllowAll}
                                        className="px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold rounded-md hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                                    >
                                        Allow
                                    </button>
                                </div>

                                <button
                                    onClick={() => setShowSettings(true)}
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm font-semibold rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                                >
                                    Settings
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Settings Header */}
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-750 p-4 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                        ⚙️ Settings
                                    </h2>
                                    <button
                                        onClick={() => {
                                            setShowSettings(false);
                                            setShowPopup(false);
                                        }}
                                        className="p-1 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all duration-200 flex-shrink-0"
                                        title="Close cookie popup"
                                        aria-label="Close cookie popup"
                                    >
                                        <X size={20} className="text-gray-700 dark:text-gray-200 hover:text-red-500 dark:hover:text-red-400 transition-colors" />
                                    </button>
                                </div>
                            </div>

                            {/* Settings Content */}
                            <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                                {/* Functional Cookies */}
                                <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <NeonCheckbox
                                        checked={settingsPreferences.functional}
                                        onChange={() => {}}
                                        size={20}
                                    />
                                    <div className="flex-1">
                                        <label className="font-semibold text-gray-900 dark:text-white block">
                                            Functional Cookies
                                        </label>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            Essential for website functionality (always enabled)
                                        </p>
                                    </div>
                                </div>

                                {/* Analytics Cookies */}
                                <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                    <NeonCheckbox
                                        checked={settingsPreferences.analytics}
                                        onChange={() => handleSettingChange('analytics')}
                                        size={20}
                                    />
                                    <div className="flex-1">
                                        <label className="font-semibold text-gray-900 dark:text-white block cursor-pointer">
                                            Analytics Cookies
                                        </label>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            Help us understand how you use our site
                                        </p>
                                    </div>
                                </div>

                                {/* Marketing Cookies */}
                                <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                    <NeonCheckbox
                                        checked={settingsPreferences.marketing}
                                        onChange={() => handleSettingChange('marketing')}
                                        size={20}
                                    />
                                    <div className="flex-1">
                                        <label className="font-semibold text-gray-900 dark:text-white block cursor-pointer">
                                            Marketing Cookies
                                        </label>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            Used to show you relevant ads and content
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Settings Buttons */}
                            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="w-full px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-semibold rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleSaveSettings}
                                    className="w-full px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold rounded-md hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    Save
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Slide-up animation keyframes */}
            <style jsx>{`
                @keyframes slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-slide-up {
                    animation: slide-up 0.4s ease-out;
                }
            `}</style>
        </>
    );
}
