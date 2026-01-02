'use client'
import { useEffect, useMemo } from 'react'
import { Provider } from 'react-redux'
import { makeStore } from '../lib/store'
import ProductDataSyncProvider from '@/components/ProductDataSyncProvider'
import { initializeCrashCashStorage } from '@/lib/crashcashStorage'

export default function StoreProvider({ children }) {
  const store = useMemo(() => makeStore(), [])

  // Initialize CrashCash storage on mount
  useEffect(() => {
    initializeCrashCashStorage()
  }, [])

  return (
    <Provider store={store}>
      <ProductDataSyncProvider>
        {children}
      </ProductDataSyncProvider>
    </Provider>
  )
}