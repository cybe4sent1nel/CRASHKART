'use client'
import React, { useState } from 'react'
import { saveFeedback } from '@/lib/feedbackService'
import styled from 'styled-components'
import { ChevronRight, ChevronLeft, Check, X, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const FeedbackForm = ({ onClose, isOpen }) => {
    const [step, setStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        overallRating: '',
        appExperience: '',
        productQuality: '',
        deliveryExperience: '',
        customerService: '',
        feedback: ''
    })

    const totalSteps = 5

    const handleNext = () => {
        // Validate current step
        if (step === 1 && !formData.email) {
            setError('Email is required')
            return
        }
        if (step === 1 && !formData.email.includes('@')) {
            setError('Please enter a valid email')
            return
        }
        if (step === 2 && !formData.overallRating) {
            setError('Please select a rating')
            return
        }
        if (step === 3 && !formData.appExperience) {
            setError('Please select a rating')
            return
        }
        if (step === 4 && (!formData.deliveryExperience || !formData.customerService)) {
            setError('Please select ratings for all questions')
            return
        }
        if (step === 5 && formData.feedback.length < 120) {
            setError(`Feedback must be at least 120 characters (${formData.feedback.length}/120)`)
            return
        }

        setError('')
        if (step < totalSteps) {
            setStep(step + 1)
        }
    }

    const handleBack = () => {
        setError('')
        if (step > 1) {
            setStep(step - 1)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (formData.feedback.length < 120) {
            setError(`Feedback must be at least 120 characters (${formData.feedback.length}/120)`)
            return
        }

        setIsSubmitting(true)
        try {
            const success = await saveFeedback(formData)
            if (success) {
                toast.success('Thank you for your feedback!')
                setStep(6) // Show success screen
                setTimeout(() => {
                    onClose?.()
                }, 2000)
            } else {
                setError('Failed to submit feedback. Please try again.')
            }
        } catch (err) {
            setError('An error occurred. Please try again.')
            console.error(err)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) return null

    return (
        <StyledWrapper>
            <div className="fixed inset-0 z-50 overflow-y-auto bg-white dark:bg-slate-900">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="fixed top-4 right-4 z-10 p-2 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition"
                    aria-label="Close"
                >
                    <X size={24} className="text-slate-700 dark:text-slate-300" />
                </button>

                {/* Form Container */}
                <div className="min-h-screen flex items-center justify-center p-4 py-12">
                    <div className="w-full max-w-2xl">
                        <div className="testbox">
                        {step === 6 ? (
                            // Success Screen
                            <form className="success-screen">
                                <div className="success-content">
                                    <div className="success-icon">
                                        <Check size={40} />
                                    </div>
                                    <p id="h1">Thank You!</p>
                                    <p id="success-text">
                                        Your feedback helps us serve you better. We appreciate your time!
                                    </p>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                {/* Progress Bar */}
                                <div className="progress-container">
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${(step / totalSteps) * 100}%` }}
                                        />
                                    </div>
                                    <p className="progress-text">Step {step} of {totalSteps}</p>
                                </div>

                                {/* Step 1: Name & Email */}
                                {step === 1 && (
                                    <div className="form-step">
                                        <p id="h1">Your Information</p>
                                        <p id="h4">Name</p>
                                        <input
                                            placeholder="Enter your full name (optional)"
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="input"
                                        />
                                        <p id="h4">Email <span>*</span></p>
                                        <input
                                            placeholder="Enter your email"
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="input"
                                        />
                                        {error && <p className="error-message">{error}</p>}
                                    </div>
                                )}

                                {/* Step 2: Overall Rating */}
                                {step === 2 && (
                                    <div className="form-step">
                                        <p id="h1">Overall Experience</p>
                                        <p id="h4">How satisfied are you with your overall shopping experience? <span>*</span></p>
                                        <div className="rating-buttons">
                                            {['Very Satisfied', 'Satisfied', 'Neutral', 'Unsatisfied'].map((option) => (
                                                <button
                                                    key={option}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData(prev => ({ ...prev, overallRating: option }))
                                                        setError('')
                                                    }}
                                                    className={`rating-btn ${formData.overallRating === option ? 'selected' : ''}`}
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        </div>
                                        {error && <p className="error-message">{error}</p>}
                                    </div>
                                )}

                                {/* Step 3: App Experience */}
                                {step === 3 && (
                                    <div className="form-step">
                                        <p id="h1">App Experience</p>
                                        <p id="h4">How easy is it to use our app? <span>*</span></p>
                                        <div className="rating-buttons">
                                            {['Very Easy', 'Easy', 'Neutral', 'Difficult'].map((option) => (
                                                <button
                                                    key={option}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData(prev => ({ ...prev, appExperience: option }))
                                                        setError('')
                                                    }}
                                                    className={`rating-btn ${formData.appExperience === option ? 'selected' : ''}`}
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        </div>
                                        {error && <p className="error-message">{error}</p>}
                                    </div>
                                )}

                                {/* Step 4: Product & Delivery */}
                                {step === 4 && (
                                    <div className="form-step">
                                        <p id="h1">Products & Delivery</p>

                                        <p id="h4">Product quality and variety? <span>*</span></p>
                                        <div className="rating-buttons">
                                            {['Excellent', 'Good', 'Average', 'Poor'].map((option) => (
                                                <button
                                                    key={option}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData(prev => ({ ...prev, productQuality: option }))
                                                        setError('')
                                                    }}
                                                    className={`rating-btn ${formData.productQuality === option ? 'selected' : ''}`}
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        </div>

                                        <p id="h4" style={{ marginTop: '20px' }}>Delivery experience? <span>*</span></p>
                                        <div className="rating-buttons">
                                            {['On Time', 'Slightly Late', 'Late', 'Very Late'].map((option) => (
                                                <button
                                                    key={option}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData(prev => ({ ...prev, deliveryExperience: option }))
                                                        setError('')
                                                    }}
                                                    className={`rating-btn ${formData.deliveryExperience === option ? 'selected' : ''}`}
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        </div>

                                        <p id="h4" style={{ marginTop: '20px' }}>Customer service? <span>*</span></p>
                                        <div className="rating-buttons">
                                            {['Excellent', 'Good', 'Average', 'Poor'].map((option) => (
                                                <button
                                                    key={option}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData(prev => ({ ...prev, customerService: option }))
                                                        setError('')
                                                    }}
                                                    className={`rating-btn ${formData.customerService === option ? 'selected' : ''}`}
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        </div>

                                        {error && <p className="error-message">{error}</p>}
                                    </div>
                                )}

                                {/* Step 5: Final Feedback */}
                                {step === 5 && (
                                    <div className="form-step">
                                        <p id="h1">Your Feedback</p>
                                        <p id="h4">Tell us what we can improve: <span>*</span></p>
                                        <p className="char-hint">Minimum 120 characters</p>
                                        <textarea
                                            name="feedback"
                                            value={formData.feedback}
                                            onChange={handleChange}
                                            placeholder="Share your thoughts, suggestions, or concerns..."
                                            rows={6}
                                            className="feedback-textarea"
                                        />
                                        <p className="char-count">
                                            {formData.feedback.length}/120 characters
                                            {formData.feedback.length >= 120 && (
                                                <span className="char-valid"> ✓</span>
                                            )}
                                        </p>
                                        {error && <p className="error-message">{error}</p>}
                                    </div>
                                )}

                                {/* Buttons */}
                                <div className="btn-block">
                                    {step > 1 && (
                                        <button
                                            type="button"
                                            onClick={handleBack}
                                            className="btn btn-secondary"
                                        >
                                            <ChevronLeft size={16} />
                                            Back
                                        </button>
                                    )}

                                    {step < totalSteps && (
                                        <button
                                            type="button"
                                            onClick={handleNext}
                                            disabled={isSubmitting}
                                            className="btn btn-primary"
                                        >
                                            Next
                                            <ChevronRight size={16} />
                                        </button>
                                    )}

                                    {step === totalSteps && (
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="btn btn-primary"
                                        >
                                            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                                        </button>
                                    )}
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
            </div>
        </StyledWrapper>
    )
}

const StyledWrapper = styled.div`
  form, p {
    padding: 0;
    margin: 0;
    outline: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    font-size: 14px;
    color: #1f2937;
    line-height: 13px;
    border-radius: 10px;
  }

  #h1 {
    font-size: 24px;
    font-weight: 600;
    text-align: center;
    margin-bottom: 20px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  #h4 {
    margin: 15px 0 8px;
    color: #374151;
    font-weight: 500;

    span {
      color: #ef4444;
    }
  }

  #success-text {
    color: #6b7280;
    text-align: center;
    font-size: 16px;
  }

  .testbox {
    display: flex;
    justify-content: center;
    align-items: center;
    max-height: 90vh;
    overflow-y: auto;
  }

  form {
    width: 100%;
    padding: 30px;
    background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 50%, #e0f2fe 100%);
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    border: 2px solid #d1fae5;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: #10b981;
      border-radius: 3px;

      &:hover {
        background: #059669;
      }
    }
  }

  .progress-container {
    margin-bottom: 30px;
  }

  .progress-bar {
    width: 100%;
    height: 8px;
    background: #e5e7eb;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 10px;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #10b981 0%, #059669 100%);
    transition: width 0.3s ease;
  }

  .progress-text {
    font-size: 12px;
    color: #6b7280;
    text-align: center;
  }

  .form-step {
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .input {
    width: 100%;
    padding: 10px 12px;
    border: 2px solid #d1fae5;
    border-radius: 8px;
    background-color: #f0fdf4;
    font-size: 14px;
    transition: all 0.3s ease;

    &:hover {
      border-color: #10b981;
    }

    &:focus {
      outline: none;
      border-color: #10b981;
      background-color: white;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    }
  }

  .rating-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin: 15px 0;
  }

  .rating-btn {
    padding: 12px;
    border: 2px solid #d1fae5;
    background-color: #f9fafb;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    color: #374151;
    transition: all 0.3s ease;
    font-size: 13px;

    &:hover {
      border-color: #10b981;
      background-color: #f0fdf4;
    }

    &.selected {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      border-color: #059669;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    &:active {
      transform: scale(0.98);
    }
  }

  .feedback-textarea {
    width: 100%;
    padding: 12px;
    border: 2px solid #d1fae5;
    border-radius: 8px;
    background-color: #f0fdf4;
    font-family: inherit;
    font-size: 14px;
    resize: vertical;
    transition: all 0.3s ease;

    &:hover {
      border-color: #10b981;
    }

    &:focus {
      outline: none;
      border-color: #10b981;
      background-color: white;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    }
  }

  .char-hint {
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 10px;
  }

  .char-count {
    font-size: 12px;
    color: #6b7280;
    margin-top: 8px;
    text-align: right;

    .char-valid {
      color: #10b981;
      font-weight: bold;
    }
  }

  .error-message {
    color: #ef4444;
    font-size: 13px;
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 5px;

    &::before {
      content: '⚠';
      font-size: 14px;
    }
  }

  .btn-block {
    margin-top: 30px;
    display: flex;
    gap: 10px;
    justify-content: space-between;
  }

  .btn {
    flex: 1;
    padding: 12px 20px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.3s ease;
    white-space: nowrap;

    &:hover {
      transform: translateY(-2px);
    }

    &:active {
      transform: translateY(0);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
  }

  .btn-primary {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);

    &:hover:not(:disabled) {
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
    }
  }

  .btn-secondary {
    background-color: #e5e7eb;
    color: #374151;

    &:hover:not(:disabled) {
      background-color: #d1d5db;
    }
  }

  .success-screen {
    text-align: center;
    padding: 60px 30px;
  }

  .success-content {
    animation: scaleIn 0.5s ease;
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .success-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border-radius: 50%;
    color: white;
    margin-bottom: 20px;
    animation: bounce 0.6s ease;
  }

  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  @media (max-width: 640px) {
    .testbox {
      padding: 0;
    }

    form {
      padding: 20px;
      border-radius: 16px;
      max-height: none;
    }

    #h1 {
      font-size: 20px;
    }

    .rating-buttons {
      grid-template-columns: 1fr;
    }

    .btn-block {
      flex-direction: column;
    }

    .btn {
      width: 100%;
    }
  }
`

export default FeedbackForm
