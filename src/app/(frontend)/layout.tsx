import React from 'react'
import { ClientProviders } from '@/components/ClientProviders'
import './globals.css'

export const metadata = {
  description: 'Nuclexus — Asset registry and proof verification.',
  title: 'Nuclexus',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en" className="dark">
      <body>
        <ClientProviders>
          <main className="min-h-screen">{children}</main>
        </ClientProviders>
      </body>
    </html>
  )
}
