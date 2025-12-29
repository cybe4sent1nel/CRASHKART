/**
 * Feedback Service - Handles feedback popup timing and storage
 */

const FEEDBACK_KEY = 'crashkart_feedback'
const MAYBE_LATER_KEY = 'crashkart_feedback_maybe_later'
const APP_VERSION_KEY = 'crashkart_app_version'
const DAYS_TO_WAIT = 15
const CURRENT_APP_VERSION = '1.0.0' // Update this when app changes significantly

/**
 * Check if feedback popup should be shown
 */
export function shouldShowFeedback() {
    if (typeof window === 'undefined') return false

    // Check app version - if version changed, clear old feedback
    const storedVersion = localStorage.getItem(APP_VERSION_KEY)
    if (storedVersion !== CURRENT_APP_VERSION) {
        // App version changed, clear old feedback and allow new submission
        localStorage.removeItem(FEEDBACK_KEY)
        localStorage.removeItem(MAYBE_LATER_KEY)
        localStorage.setItem(APP_VERSION_KEY, CURRENT_APP_VERSION)
        return true
    }

    // Check if user has already submitted feedback for this version
    const feedback = localStorage.getItem(FEEDBACK_KEY)
    if (feedback) {
        const feedbackData = JSON.parse(feedback)
        // If feedback was for current version, don't show again
        if (feedbackData.appVersion === CURRENT_APP_VERSION) {
            return false
        }
    }

    // Check if user clicked "Maybe Later"
    const maybeLaterTime = localStorage.getItem(MAYBE_LATER_KEY)
    if (maybeLaterTime) {
        const lastTime = parseInt(maybeLaterTime)
        const now = Date.now()
        const daysPassed = (now - lastTime) / (1000 * 60 * 60 * 24)

        // Show again if 15 days have passed
        if (daysPassed >= DAYS_TO_WAIT) {
            localStorage.removeItem(MAYBE_LATER_KEY)
            return true
        }
        return false
    }

    return true
}

/**
 * Save "Maybe Later" timestamp
 */
export function saveMaybeLater() {
    if (typeof window === 'undefined') return
    localStorage.setItem(MAYBE_LATER_KEY, Date.now().toString())
}

/**
 * Save feedback to localStorage and backend
 */
export async function saveFeedback(feedbackData) {
    if (typeof window === 'undefined') return false

    try {
        // Save to localStorage with app version
        localStorage.setItem(FEEDBACK_KEY, JSON.stringify({
            ...feedbackData,
            appVersion: CURRENT_APP_VERSION,
            timestamp: new Date().toISOString()
        }))
        localStorage.setItem(APP_VERSION_KEY, CURRENT_APP_VERSION)

        // Optionally send to backend
        if (process.env.NEXT_PUBLIC_API_URL) {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(feedbackData)
            }).catch(err => console.log('Backend feedback save error:', err))
        }

        return true
    } catch (error) {
        console.error('Feedback save error:', error)
        return false
    }
}

/**
 * Clear feedback (for testing)
 */
export function clearFeedbackStorage() {
    if (typeof window === 'undefined') return
    localStorage.removeItem(FEEDBACK_KEY)
    localStorage.removeItem(MAYBE_LATER_KEY)
}

/**
 * Get feedback submission status
 */
export function getFeedbackStatus() {
    if (typeof window === 'undefined') return null

    const feedback = localStorage.getItem(FEEDBACK_KEY)
    const maybeLater = localStorage.getItem(MAYBE_LATER_KEY)

    return {
        submitted: !!feedback,
        data: feedback ? JSON.parse(feedback) : null,
        maybeLaterUntil: maybeLater ? new Date(parseInt(maybeLater) + DAYS_TO_WAIT * 24 * 60 * 60 * 1000) : null
    }
}
