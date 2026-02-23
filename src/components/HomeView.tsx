'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { ASSET_REGISTRY_ADDRESS } from '@/lib/contracts'
import { useAssets, useVerifyAsset } from '@/app/(frontend)/hooks'
import type { AssetItem } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function HomeView() {
  const { isConnected } = useAccount()
  const { data: assets = [], isLoading: assetsLoading } = useAssets({ enabled: isConnected })
  const { verify, loading: txPending, error: verifyError, hash: txHash, confirmed: txSuccess } = useVerifyAsset()
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [proofHash, setProofHash] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const openVerify = (asset: AssetItem) => {
    const isOpening = expandedId !== asset.assetId
    setExpandedId(isOpening ? asset.assetId : null)
    setProofHash(isOpening ? (asset.latestProofHash ?? '') : '')
    setValidationError(null)
  }

  const handleVerify = async (assetId: number) => {
    const h = proofHash.trim().startsWith('0x') ? proofHash.trim() : '0x' + proofHash.trim()
    if (h.length !== 66) {
      setValidationError('Proof hash must be 0x + 64 hex characters')
      return
    }
    setValidationError(null)
    await verify(assetId, h)
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Nuclexus</h1>
            <p className="text-sm text-muted-foreground">Asset registry</p>
          </div>
          <ConnectButton />
        </header>

        {!isConnected ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">
                Connect your wallet to access Assets and create or verify assets.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle>Assets</CardTitle>
                  <CardDescription>Create, verify, and manage assets.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link
                    href="/assets"
                    className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
                  >
                    Open Assets
                  </Link>
                </CardContent>
              </Card>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle>Templates</CardTitle>
                  <CardDescription>Reusable rental blueprints.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link
                    href="/templates"
                    className="inline-flex h-9 items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground shadow hover:bg-secondary/80"
                  >
                    Open Templates
                  </Link>
                </CardContent>
              </Card>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle>Processes</CardTitle>
                  <CardDescription>Active rental flows.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link
                    href="/processes"
                    className="inline-flex h-9 items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground shadow hover:bg-secondary/80"
                  >
                    Open Processes
                  </Link>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All assets</CardTitle>
                <CardDescription>
                  Select an asset and verify it (as owner: claim; as validator: attestation).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {assetsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading assets…</p>
                ) : assets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No assets yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {assets.map((a) => (
                      <li key={a.id} className="rounded-md border border-border">
                        <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                          <div>
                            <p className="font-medium">{a.title || `Asset #${a.assetId}`}</p>
                            <p className="text-xs text-muted-foreground">
                              ID: {a.assetId} · {a.creator.slice(0, 6)}…{a.creator.slice(-4)}
                            </p>
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openVerify(a)}
                          >
                            {expandedId === a.assetId ? 'Cancel' : 'Verify'}
                          </Button>
                        </div>
                        {expandedId === a.assetId && (
                          <div className="border-t border-border bg-muted/30 p-3">
                            <div className="space-y-2">
                              <Label htmlFor="home-verify-hash">Proof hash (0x + 64 hex)</Label>
                              <Input
                                id="home-verify-hash"
                                type="text"
                                value={proofHash}
                                onChange={(e) => setProofHash(e.target.value)}
                                placeholder="0x..."
                                className="font-mono text-sm"
                              />
                              {(validationError ?? verifyError) && (
                                <p className="text-sm text-destructive">{validationError ?? verifyError}</p>
                              )}
                              {txHash && (
                                <p className="text-sm text-muted-foreground">
                                  Tx:{' '}
                                  <a
                                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary underline-offset-4 hover:underline"
                                  >
                                    {txHash.slice(0, 10)}…
                                  </a>
                                  {txSuccess && ' ✓ Verified'}
                                </p>
                              )}
                              <Button
                                size="sm"
                                onClick={() => handleVerify(a.assetId)}
                                disabled={txPending}
                              >
                                {txPending ? 'Confirming…' : 'Submit verify'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {ASSET_REGISTRY_ADDRESS && (
          <footer className="flex flex-wrap items-center gap-2 border-t border-border pt-6 text-sm text-muted-foreground">
            <span>
              Contract: {ASSET_REGISTRY_ADDRESS.slice(0, 10)}…{ASSET_REGISTRY_ADDRESS.slice(-8)}
            </span>
            <a
              href={`https://sepolia.etherscan.io/address/${ASSET_REGISTRY_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              View on Etherscan
            </a>
          </footer>
        )}
      </div>
    </div>
  )
}
