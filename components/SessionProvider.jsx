'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'

export function SessionProvider({ children }) {
    return (
        <NextAuthSessionProvider basePath="/api/auth" refetchInterval={0}>
            {children}
        </NextAuthSessionProvider>
    )
}
