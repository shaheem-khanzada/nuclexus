'use client'

import { useState, useEffect } from 'react'
import { Providers } from './Providers'

/**
 * Renders wallet providers only after mount so wagmi/RainbowKit
 * (which may use indexedDB) never run during SSR.
 */
export function ClientProviders({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">Loading…</div>
      </div>
    )
  }

  return <Providers>{children}</Providers>
}
