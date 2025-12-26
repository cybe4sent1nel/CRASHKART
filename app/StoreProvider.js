'use client'
import { useRef } from 'react'
import { Provider } from 'react-redux'
import { makeStore } from '../lib/store'
import { ThemeProvider } from './ThemeProvider'
import ProductDataSyncProvider from '@/components/ProductDataSyncProvider'

export default function StoreProvider({ children }) {
  const storeRef = useRef(undefined)
  if (!storeRef.current) {
    // Create the store instance the first time this renders
    storeRef.current = makeStore()
  }

  return (
    <Provider store={storeRef.current}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <ProductDataSyncProvider>
          {children}
        </ProductDataSyncProvider>
      </ThemeProvider>
    </Provider>
  )
}