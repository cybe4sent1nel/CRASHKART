'use client'
import React from 'react'
import { Check } from 'lucide-react'

export function CheckoutSteps({ currentStep = 0, steps = ['Cart', 'Delivery', 'Payment', 'Confirmation'] }) {
    return (
        <div className='w-full max-w-2xl mx-auto mb-8'>
            <div className='flex items-center justify-between'>
                {steps.map((step, index) => (
                    <React.Fragment key={index}>
                        {/* Step Circle */}
                        <div className='flex flex-col items-center flex-1'>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                                index < currentStep 
                                    ? 'bg-green-500 text-white' 
                                    : index === currentStep 
                                    ? 'bg-blue-500 text-white ring-4 ring-blue-200 animate-pulse' 
                                    : 'bg-gray-300 text-gray-600'
                            }`}>
                                {index < currentStep ? <Check className="w-5 h-5" /> : index + 1}
                            </div>
                            <p className={`text-xs sm:text-sm mt-2 text-center font-medium ${
                                index <= currentStep ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                                {step}
                            </p>
                        </div>

                        {/* Connecting Line */}
                        {index < steps.length - 1 && (
                            <div className={`h-1 flex-1 mx-2 mb-8 rounded-full transition-all ${
                                index < currentStep ? 'bg-green-500' : 'bg-gray-300'
                            }`}></div>
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Progress Bar */}
            <div className='mt-8 w-full bg-gray-200 rounded-full h-2 overflow-hidden'>
                <div 
                    className='bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full transition-all duration-500'
                    style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                ></div>
            </div>
        </div>
    )
}

export default CheckoutSteps
