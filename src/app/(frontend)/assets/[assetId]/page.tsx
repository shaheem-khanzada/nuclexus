'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAsset, useUpdateAsset, useTemplates, useCreateProcess } from '@/app/(frontend)/hooks'
import type { TemplateItem, Participant } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EVENT_TYPES } from '@/lib/constants/eventTypes'

export default function AssetDetailPage() {
  const params = useParams()
  const assetId = params?.assetId as string
  const { address, isConnected } = useAccount()
  const id = parseInt(assetId, 10)
  const isValidId = !Number.isNaN(id)
  const { data, isLoading: loading, error: queryError } = useAsset(isValidId ? id : null)
  const updateAsset = useUpdateAsset()
  const { data: templates = [] } = useTemplates()
  const createProcess = useCreateProcess()
  const [editing, setEditing] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [participantAddrs, setParticipantAddrs] = useState<Record<string, string>>({})

  const selectedTpl: TemplateItem | null =
    templates.find((t) => t.id === selectedTemplate) ?? null

  const handleTemplateSelect = (tplId: string) => {
    setSelectedTemplate(tplId)
    const tpl = templates.find((t) => t.id === tplId)
    if (tpl?.roles) {
      const addrs: Record<string, string> = {}
      tpl.roles.forEach((r) => {
        addrs[r.name] = r.name === 'owner' ? (address ?? '') : ''
      })
      setParticipantAddrs(addrs)
    } else {
      setParticipantAddrs({})
    }
  }

  const allParticipantsFilled = selectedTpl?.roles?.every(
    (r) => (participantAddrs[r.name]?.trim() ?? '').length > 0,
  ) ?? false

  const buildParticipants = (): Participant[] => {
    if (!selectedTpl?.roles) return []
    return selectedTpl.roles.map((r) => ({
      role: r.name,
      address: participantAddrs[r.name]?.trim() ?? '',
    }))
  }
  const [form, setForm] = useState({ title: '', description: '', category: '', tagsStr: '' })

  useEffect(() => {
    if (!data) return
    setForm({
      title: data.asset?.title ?? '',
      description: data.asset?.description ?? '',
      category: data.asset?.category ?? '',
      tagsStr: (data.asset?.tags ?? []).join(', '),
    })
  }, [data])

  const error = !isValidId ? 'Invalid asset ID' : queryError ? (queryError instanceof Error ? queryError.message : 'Failed to load') : null
  const saveError = updateAsset.error ? (updateAsset.error instanceof Error ? updateAsset.error.message : 'Update failed') : null
  const isOwner = data?.asset && address && data.asset.creator.toLowerCase() === address.toLowerCase()

  const handleSave = async () => {
    if (!data?.asset || updateAsset.isPending) return
    const tags = form.tagsStr.split(/[\s,]+/).filter(Boolean)
    try {
      await updateAsset.mutateAsync({
        assetId: data.asset.assetId,
        title: form.title || undefined,
        description: form.description || undefined,
        category: form.category || undefined,
        tags: tags.length ? tags : undefined,
      })
      setEditing(false)
    } catch {
      // error surfaced via updateAsset.error
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-3xl">
          <header className="flex items-center justify-between border-b border-border pb-6">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:underline">Home</Link>
              <span>/</span>
              <Link href="/assets" className="hover:underline">Assets</Link>
              <span>/</span>
              <Link href="/assets/mine" className="hover:underline">My Assets</Link>
            </nav>
            <ConnectButton />
          </header>
          <Card className="mt-8 border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Connect your wallet to view this asset.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-3xl">
          <header className="flex items-center justify-between border-b border-border pb-6">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:underline">Home</Link>
              <span>/</span>
              <Link href="/assets" className="hover:underline">Assets</Link>
              <span>/</span>
              <Link href="/assets/mine" className="hover:underline">My Assets</Link>
            </nav>
            <ConnectButton />
          </header>
          <div className="py-12 text-center text-muted-foreground">
            {error ? <p className="text-destructive">{error}</p> : 'Loading…'}
          </div>
        </div>
      </div>
    )
  }

  const { asset, events } = data

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <nav className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:underline">Home</Link>
              <span>/</span>
              <Link href="/assets" className="hover:underline">Assets</Link>
              <span>/</span>
              <Link href="/assets/mine" className="hover:underline">My Assets</Link>
              <span>/</span>
              <span className="font-medium text-foreground">{asset.title || `Asset #${asset.assetId}`}</span>
            </nav>
            <h1 className="text-xl font-semibold tracking-tight">
              {asset.title || `Asset #${asset.assetId}`}
            </h1>
            <p className="text-sm text-muted-foreground">ID: {asset.assetId}</p>
          </div>
          <ConnectButton />
        </header>

        <div className="grid gap-6 lg:grid-cols-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Details</CardTitle>
              {isOwner && (
                !editing ? (
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSave} disabled={updateAsset.isPending}>
                      {updateAsset.isPending ? 'Saving…' : 'Save'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditing(false)
                        setForm({
                          title: asset.title ?? '',
                          description: asset.description ?? '',
                          category: asset.category ?? '',
                          tagsStr: (asset.tags ?? []).join(', '),
                        })
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {saveError && (
                <p className="text-sm text-destructive">{saveError}</p>
              )}
              {editing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Title</Label>
                    <Input
                      id="edit-title"
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="Asset title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Input
                      id="edit-description"
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Optional description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-category">Category</Label>
                    <Input
                      id="edit-category"
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      placeholder="Optional category"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-tags">Tags (comma separated)</Label>
                    <Input
                      id="edit-tags"
                      value={form.tagsStr}
                      onChange={(e) => setForm((f) => ({ ...f, tagsStr: e.target.value }))}
                      placeholder="tag1, tag2"
                    />
                  </div>
                </div>
              ) : (
                <dl className="grid gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Creator</dt>
                    <dd className="font-mono">{asset.creator}</dd>
                  </div>
                  {asset.title && (
                    <div>
                      <dt className="text-muted-foreground">Title</dt>
                      <dd>{asset.title}</dd>
                    </div>
                  )}
                  {asset.description && (
                    <div>
                      <dt className="text-muted-foreground">Description</dt>
                      <dd className="whitespace-pre-wrap">{asset.description}</dd>
                    </div>
                  )}
                  {asset.category && (
                    <div>
                      <dt className="text-muted-foreground">Category</dt>
                      <dd>{asset.category}</dd>
                    </div>
                  )}
                  {asset.tags && asset.tags.length > 0 && (
                    <div>
                      <dt className="text-muted-foreground">Tags</dt>
                      <dd>{asset.tags.join(', ')}</dd>
                    </div>
                  )}
                  {asset.url && (
                    <div>
                      <dt className="text-muted-foreground">Proof file</dt>
                      <dd>
                        <a
                          href={asset.url.startsWith('http') ? asset.url : `${window.location.origin}${asset.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-all text-primary underline-offset-4 hover:underline"
                        >
                          {asset.url}
                        </a>
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-muted-foreground">Created</dt>
                    <dd>{new Date(asset.createdAt).toLocaleString()}</dd>
                  </div>
                </dl>
              )}
            </CardContent>
          </Card>

          {isOwner && (
            <Card>
              <CardHeader>
                <CardTitle>Start Rental</CardTitle>
                <CardDescription>Create a rental process for this asset from a template</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {createProcess.error && (
                  <p className="text-sm text-destructive">
                    {createProcess.error instanceof Error ? createProcess.error.message : 'Failed to create process'}
                  </p>
                )}
                {templates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No templates available.{' '}
                    <Link href="/templates" className="text-primary underline-offset-4 hover:underline">Create one</Link>.
                  </p>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Template</Label>
                      <select
                        value={selectedTemplate}
                        onChange={(e) => handleTemplateSelect(e.target.value)}
                        className="flex h-9 w-full max-w-sm rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                      >
                        <option value="">Select a template</option>
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} — {t.terms.price} {t.terms.currency ?? 'ETH'} / {t.terms.duration} {t.terms.durationUnit}
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedTpl?.roles && selectedTpl.roles.length > 0 && (
                      <div className="space-y-3">
                        <Label>Assign Participants</Label>
                        {selectedTpl.roles.map((r) => (
                          <div key={r.name} className="flex items-center gap-3">
                            <span className="w-24 shrink-0 text-sm font-medium capitalize">{r.label}</span>
                            <Input
                              value={participantAddrs[r.name] ?? ''}
                              onChange={(e) =>
                                setParticipantAddrs((prev) => ({ ...prev, [r.name]: e.target.value }))
                              }
                              placeholder="0x..."
                              className="flex-1 font-mono"
                              readOnly={r.name === 'owner'}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    <Button
                      disabled={!selectedTemplate || !allParticipantsFilled || createProcess.isPending}
                      onClick={async () => {
                        if (!selectedTemplate || !address || !allParticipantsFilled) return
                        try {
                          const p = await createProcess.mutateAsync({
                            assetId: asset.assetId,
                            template: selectedTemplate,
                            owner: address,
                            participants: buildParticipants(),
                          })
                          window.location.href = `/processes/${p.id}`
                        } catch {
                          // error surfaced via createProcess.error
                        }
                      }}
                    >
                      {createProcess.isPending ? 'Creating...' : 'Create Process'}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Events</CardTitle>
              <CardDescription>Event history for this asset</CardDescription>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No events yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium">Type</th>
                        <th className="px-4 py-3 text-left font-medium">Sender</th>
                        <th className="px-4 py-3 text-left font-medium">Timestamp</th>
                        <th className="px-4 py-3 text-left font-medium">Transaction</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((e) => (
                        <tr key={e.id} className="border-b border-border last:border-0">
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                                e.type === EVENT_TYPES.CREATED
                                  ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                                  : e.type === EVENT_TYPES.PROOF_SUBMITTED
                                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                                    : e.type === 'CLAIM'
                                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                      : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {e.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-muted-foreground">
                            {e.sender.slice(0, 6)}…{e.sender.slice(-4)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(e.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            {e.transactionHash ? (
                              <a
                                href={`https://sepolia.etherscan.io/tx/${e.transactionHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-primary underline-offset-4 hover:underline"
                              >
                                {e.transactionHash.slice(0, 10)}…
                              </a>
                            ) : (
                              <span className="text-muted-foreground">off-chain</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
