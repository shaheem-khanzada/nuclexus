'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { ASSET_REGISTRY_ADDRESS } from '@/lib/contracts'
import {
  useCreateAsset,
  useSubmitProof,
  useVerifyAsset,
  useUpload,
  useUpdateAsset,
} from '@/app/(frontend)/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function CreateAssetCard() {
  const { address } = useAccount()
  const { create, loading: createLoading, error: createError, hash, confirmed, createdAssetId } = useCreateAsset()
  const { submit, loading: submitLoading, error: submitError, confirmed: submitConfirmed } = useSubmitProof()
  const { verify, loading: verifyLoading, error: verifyError, confirmed: verifyConfirmed } = useVerifyAsset()
  const uploadMutation = useUpload()
  const updateAssetMutation = useUpdateAsset()

  const [step, setStep] = useState<'create' | 'created' | 'uploaded' | 'verified'>('create')
  const [file, setFile] = useState<File | null>(null)
  const [uploadResult, setUploadResult] = useState<{ url: string; hash: string; name: string } | null>(null)

  useEffect(() => {
    if (confirmed && createdAssetId) setStep('created')
  }, [confirmed, createdAssetId])

  const handleCreate = async () => {
    await create()
  }

  const handleUpload = async () => {
    if (!file) return
    setUploadResult(null)
    try {
      const data = await uploadMutation.mutateAsync({ file })
      setUploadResult({ url: data.url, hash: data.hash, name: data.name })
      setStep('uploaded')
      if (createdAssetId && address) {
        try {
          await updateAssetMutation.mutateAsync({
            assetId: Number(createdAssetId),
            creatorWallet: address,
            url: data.url,
          })
        } catch {
          // error surfaced via updateAssetMutation.error
        }
      }
    } catch {
      // error surfaced via uploadMutation.error
    }
  }

  const handleSubmitProof = async () => {
    if (!createdAssetId || !uploadResult?.hash) return
    await submit(Number(createdAssetId), uploadResult.hash)
  }

  const handleVerify = async () => {
    if (!createdAssetId || !uploadResult?.hash) return
    await verify(Number(createdAssetId), uploadResult.hash)
  }

  useEffect(() => {
    if (submitConfirmed || verifyConfirmed) setStep('verified')
  }, [submitConfirmed, verifyConfirmed])

  const uploadError = uploadMutation.error ? (uploadMutation.error instanceof Error ? uploadMutation.error.message : 'Upload failed') : null
  const updateError = updateAssetMutation.error ? (updateAssetMutation.error instanceof Error ? updateAssetMutation.error.message : 'Asset URL could not be saved') : null
  const error = createError || submitError || verifyError || uploadError || updateError

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Asset</CardTitle>
        <CardDescription>
          Create a new asset on-chain. You become the owner. The asset is synced to the app when
          the event is received. You can add title, description, and more later via update.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}

        {step === 'create' && (
          <Button onClick={handleCreate} disabled={createLoading}>
            {createLoading ? 'Creating…' : 'Create asset'}
          </Button>
        )}

        {(step === 'created' || step === 'uploaded' || step === 'verified') && (
          <>
            {hash && (
              <p className="text-sm text-muted-foreground">
                Create tx:{' '}
                <a
                  href={`https://sepolia.etherscan.io/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {hash.slice(0, 10)}…
                </a>
                {confirmed && ' ✓ Confirmed'}
              </p>
            )}
            {createdAssetId && (
              <div className="rounded-md border border-border bg-muted/50 p-3">
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Asset created</p>
                <p className="mt-1 font-mono text-sm">Asset ID: {createdAssetId}</p>
              </div>
            )}

            {!uploadResult ? (
              <div className="space-y-3 border-t border-border pt-4">
                <p className="text-sm font-medium">Upload proof file</p>
                <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="max-w-sm" />
                <Button onClick={handleUpload} disabled={uploadMutation.isPending || !file}>
                  {uploadMutation.isPending ? 'Uploading…' : 'Upload'}
                </Button>
              </div>
            ) : (
              <div className="space-y-3 border-t border-border pt-4">
                <div className="rounded-md border border-border bg-muted/50 p-3 text-sm">
                  <p className="font-medium">File uploaded</p>
                  <p className="mt-1 break-all font-mono text-muted-foreground">{uploadResult.url}</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">Hash: {uploadResult.hash}</p>
                </div>
                {step !== 'verified' && (
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={handleSubmitProof} disabled={submitLoading}>
                      {submitLoading ? 'Submitting…' : 'Submit proof on-chain'}
                    </Button>
                    <Button variant="secondary" onClick={handleVerify} disabled={verifyLoading}>
                      {verifyLoading ? 'Verifying…' : 'Verify asset'}
                    </Button>
                  </div>
                )}
                {(submitConfirmed || verifyConfirmed) && (
                  <p className="text-sm text-green-600 dark:text-green-400">Proof submitted and/or verified on-chain.</p>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function MyAssetsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Assets</CardTitle>
        <CardDescription>
          View and manage assets you own. Open the list and select an asset to see details, edit
          metadata, and view event history.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link
          href="/assets/mine"
          className="inline-flex h-9 items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground shadow hover:bg-secondary/80"
        >
          Open My Assets
        </Link>
      </CardContent>
    </Card>
  )
}

export function AssetDashboard() {
  const { isConnected } = useAccount()

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <nav className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:underline">Home</Link>
              <span>/</span>
              <span className="font-medium text-foreground">Assets</span>
            </nav>
            <h1 className="text-xl font-semibold tracking-tight">Assets</h1>
            <p className="text-sm text-muted-foreground">Create, verify, and manage your assets</p>
          </div>
          <ConnectButton />
        </header>

        {!isConnected ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">
                Connect your wallet to create assets, verify proofs, and view asset details.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            <CreateAssetCard />
            <MyAssetsCard />
          </div>
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
