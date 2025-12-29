'use client'

import { motion } from 'framer-motion'
import SellerQueryForm from '@/components/SellerQueryForm'
import { TrendingUp, Zap, Shield, Users, Award, Headphones } from 'lucide-react'

const benefits = [
  {
    icon: TrendingUp,
    title: 'Grow Your Business',
    description: 'Reach millions of customers and grow your business exponentially'
  },
  {
    icon: Zap,
    title: 'Easy to Use',
    description: 'Simple seller dashboard to manage products, orders, and inventory'
  },
  {
    icon: Shield,
    title: 'Secure & Safe',
    description: 'Your business is protected with our secure payment and seller protection policy'
  },
  {
    icon: Users,
    title: 'Large Customer Base',
    description: 'Access to millions of active customers across India'
  },
  {
    icon: Award,
    title: 'Quality Assurance',
    description: 'We ensure quality products and customer satisfaction for all sellers'
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Dedicated support team to help you succeed as a seller'
  }
]

export default function BecomeSellerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              Become a <span className="text-red-600">CrashKart</span> Seller
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Join thousands of successful sellers and grow your business on CrashKart. Get access to millions of customers and powerful selling tools.
            </p>
          </motion.div>

          {/* Benefits Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-3 gap-8 mb-20"
          >
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (idx + 1) }}
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition"
                >
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="text-red-600 dark:text-red-400" size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    {benefit.description}
                  </p>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-20 px-6 bg-white dark:bg-slate-800">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <SellerQueryForm />
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {[
              {
                q: 'What are the eligibility criteria to become a seller?',
                a: 'You must be at least 18 years old, have a valid business license (if applicable), a bank account, and a government-issued ID. We accept individual sellers, businesses, and partnerships.'
              },
              {
                q: 'How long does the approval process take?',
                a: 'Our team reviews applications within 5-7 business days. Once approved, you can start selling immediately with access to our seller dashboard.'
              },
              {
                q: 'Are there any seller fees?',
                a: 'Yes, we charge a commission on each order (typically 5-15% depending on the category). There are no listing fees or subscription charges.'
              },
              {
                q: 'Can I sell multiple product categories?',
                a: 'Yes! Once approved, you can add products from multiple categories. You can manage your inventory and expand your catalog at any time.'
              },
              {
                q: 'What payment methods are supported?',
                a: 'We support multiple payment methods including bank transfers, UPI, and other digital payment options. Payouts are processed weekly.'
              },
              {
                q: 'Do you provide seller support?',
                a: 'Absolutely! Our dedicated support team is available 24/7 to help you with any questions or issues. You\'ll have access to seller resources and training materials.'
              }
            ].map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * idx }}
                className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md"
              >
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {faq.q}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {faq.a}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-red-600 to-red-700">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to start selling?</h2>
          <p className="text-red-100 text-lg mb-8">
            Fill out the form above and join our thriving community of sellers
          </p>
        </div>
      </section>
    </div>
  )
}
