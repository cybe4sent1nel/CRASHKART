'use client'

import SellerQueryForm from '@/components/SellerQueryForm'
import CandyFlossPattern from '@/components/CandyFlossPattern'
import { motion } from 'framer-motion'

export default function SellerQueryPage() {
  return (
    <div className="min-h-screen relative">
      {/* Green Gradient Background */}
      <CandyFlossPattern />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative py-12 px-4 sm:px-6 lg:px-8"
      >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-12"
        >
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <img src="/logo.bmp" alt="CrashKart" className="w-12 h-12" />
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-semibold text-slate-900 dark:text-white">
                crash<span className="text-red-600">kart</span>
              </span>
              <span className="text-3xl text-red-600 font-bold">.</span>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Become a CrashKart Seller
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Join thousands of successful sellers. Fill out the form below to get started with your seller journey.
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <SellerQueryForm />
        </motion.div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16 grid md:grid-cols-3 gap-8"
        >
          {[
            {
              title: 'Easy Setup',
              description: 'Quick onboarding process to get your store live in minutes'
            },
            {
              title: 'Wide Reach',
              description: 'Access to thousands of customers across all tech categories'
            },
            {
              title: 'Support & Tools',
              description: 'Comprehensive tools and dedicated support to grow your business'
            }
          ].map((benefit, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md hover:shadow-lg transition"
            >
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {benefit.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {benefit.description}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
      </motion.div>
    </div>
  )
}
