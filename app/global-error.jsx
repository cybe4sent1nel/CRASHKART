'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import noConnectionAnimation from '@/public/no-connection.json'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

export default function GlobalError({ error, reset }) {
    const [isOnline, setIsOnline] = useState(true)

    useEffect(() => {
        setIsOnline(navigator.onLine)

        const handleOnline = () => setIsOnline(true)
        const handleOffline = () => setIsOnline(false)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    if (!isOnline) {
        return (
            <html>
                <body style={{ margin: 0, padding: 0 }}>
                    <div style={{
                        minHeight: '100vh',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#ffffff',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        color: '#000',
                        padding: '20px'
                    }}>
                        {/* Animation */}
                        <div style={{ width: '224px', height: '224px', marginBottom: '30px' }}>
                            <Lottie
                                animationData={noConnectionAnimation}
                                loop={true}
                                autoplay={true}
                                style={{ width: '100%', height: '100%' }}
                            />
                        </div>

                        <div style={{ textAlign: 'center', maxWidth: '500px' }}>
                            <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px', color: '#1f2937' }}>
                                No Internet Connection
                            </h1>
                            <h2 style={{ fontSize: '18px', marginBottom: '20px', color: '#6b7280' }}>
                                You're Offline
                            </h2>
                            <p style={{ fontSize: '16px', color: '#4b5563', marginBottom: '30px', lineHeight: '1.6' }}>
                                Please check your internet connection and try again.
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                style={{
                                    padding: '12px 40px',
                                    background: '#dc2626',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                }}
                                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                </body>
            </html>
        )
    }

    return (
        <html>
            <body>
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    color: '#fff',
                    padding: '20px'
                }}>
                    <div style={{ textAlign: 'center', maxWidth: '500px' }}>
                        <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '10px', color: '#ef4444' }}>
                            ⚠️ Error
                        </h1>
                        <h2 style={{ fontSize: '28px', marginBottom: '20px', color: '#e0e7ff' }}>
                            Something Went Wrong
                        </h2>
                        <p style={{ fontSize: '16px', color: '#cbd5e1', marginBottom: '30px', lineHeight: '1.6' }}>
                            We're experiencing a temporary issue. Our team is working to fix it.
                        </p>
                        {error?.message && (
                            <div style={{
                                background: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: '8px',
                                padding: '15px',
                                marginBottom: '30px',
                                textAlign: 'left'
                            }}>
                                <p style={{ margin: '0', fontSize: '13px', color: '#94a3b8' }}>
                                    <strong style={{ color: '#f87171' }}>Error Details:</strong><br />
                                    {error.message}
                                </p>
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => reset()}
                                style={{
                                    padding: '12px 40px',
                                    background: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                }}
                                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                style={{
                                    padding: '12px 40px',
                                    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                }}
                                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                            >
                                Go Home
                            </button>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    )
}
