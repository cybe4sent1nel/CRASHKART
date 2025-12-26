'use client'
import React, { useState } from 'react'
import FeedbackInvitation from '@/components/FeedbackInvitation'
import FeedbackForm from '@/components/FeedbackForm'

export default function FeedbackPopup() {
    const [showForm, setShowForm] = useState(false)

    const handleAccept = () => {
        setShowForm(true)
    }

    const handleClose = () => {
        setShowForm(false)
    }

    return (
        <>
            <FeedbackInvitation
                onAccept={handleAccept}
                onDismiss={() => {}}
            />
            <FeedbackForm
                isOpen={showForm}
                onClose={handleClose}
            />
        </>
    )
}
