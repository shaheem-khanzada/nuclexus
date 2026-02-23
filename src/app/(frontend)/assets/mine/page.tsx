'use client'

import { useAccount } from 'wagmi'
import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAssets } from '@/app/(frontend)/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function MyAssetsPage() {
  const { address, isConnected } = useAccount()
  const { data: assets = [], isLoading: loading, error: queryError } = useAssets({
    creator: address ?? undefined,
    enabled: !!address,
  })
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to load') : null

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-2xl">
          <header className="flex items-center justify-between border-b border-border pb-6">
            <nav className="flex items-center gap-4">
              <Link href="/" className="text-sm text-muted-foreground hover:underline">Home</Link>
              <span className="text-muted-foreground">/</span>
              <Link href="/assets" className="text-sm text-muted-foreground hover:underline">Assets</Link>
              <span className="text-muted-foreground">/</span>
              <span className="text-sm font-medium">My Assets</span>
            </nav>
            <ConnectButton />
          </header>
          <Card className="mt-8 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">Connect your wallet to see your assets.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <nav className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:underline">Home</Link>
              <span>/</span>
              <Link href="/assets" className="hover:underline">Assets</Link>
              <span>/</span>
              <span className="font-medium text-foreground">My Assets</span>
            </nav>
            <h1 className="text-xl font-semibold tracking-tight">My Assets</h1>
          </div>
          <ConnectButton />
        </header>

        {error && (
          <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <p className="text-sm text-muted-foreground">Loading…</p>
          </div>
        ) : assets.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">You don’t have any assets yet.</p>
              <Link
                href="/assets"
                className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
              >
                Create your first asset
              </Link>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {assets.map((a) => (
              <li key={a.id}>
                <Link href={`/assets/${a.assetId}`}>
                  <Card className="transition-colors hover:bg-muted/50">
                    <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">
                          {a.title || `Asset #${a.assetId}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ID: {a.assetId}
                          {a.category && ` · ${a.category}`}
                        </p>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(a.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-muted-foreground">→</span>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
