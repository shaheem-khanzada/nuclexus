'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useProcesses, useTemplates, useCreateProcess } from '@/app/(frontend)/hooks'
import type { ProcessItem, TemplateItem, Participant } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  PENDING_RENTER: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
  NEGOTIATING: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
  TERMS_AGREED: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
  DEPOSIT_PENDING: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400',
  DEPOSIT_DECLARED: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
  ACTIVE: 'bg-green-500/20 text-green-600 dark:text-green-400',
  RETURN_PENDING: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
  RETURN_VERIFIED: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
  DEPOSIT_RESOLVING: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
  COMPLETED: 'bg-green-500/20 text-green-600 dark:text-green-400',
  REJECTED: 'bg-red-500/20 text-red-600 dark:text-red-400',
}

function templateName(t: ProcessItem['template']): string {
  if (typeof t === 'object' && t !== null) return (t as TemplateItem).name
  return String(t)
}

function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function ProcessCard({ p }: { p: ProcessItem }) {
  const ownerParticipant = p.participants.find((x) => x.role === 'owner')
  return (
    <Link href={`/processes/${p.id}`}>
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="min-w-0 flex-1">
            <p className="font-medium">Asset #{p.assetId}</p>
            <p className="text-sm text-muted-foreground">
              Template: {templateName(p.template)}
              {ownerParticipant && ` · Owner: ${shortAddr(ownerParticipant.address)}`}
            </p>
          </div>
          <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[p.status] ?? 'bg-muted text-muted-foreground'}`}>
            {p.status.replace(/_/g, ' ')}
          </span>
          <span className="text-muted-foreground">&rarr;</span>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function ProcessesPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()

  const { data: myProcesses = [], isLoading: myLoading } = useProcesses({
    participantAddress: address ?? undefined,
    enabled: !!address,
  })
  const { data: pendingProcesses = [], isLoading: pendingLoading } = useProcesses({
    status: 'PENDING_RENTER',
    enabled: !!address,
  })

  const openProcesses = useMemo(() => {
    if (!address) return []
    const myIds = new Set(myProcesses.map((p) => p.id))
    return pendingProcesses.filter((p) => !myIds.has(p.id))
  }, [address, myProcesses, pendingProcesses])

  const isLoading = myLoading || pendingLoading
  const isEmpty = myProcesses.length === 0 && openProcesses.length === 0

  const { data: templates = [] } = useTemplates()
  const createProcess = useCreateProcess()

  const [showCreate, setShowCreate] = useState(false)
  const [assetId, setAssetId] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [participantAddresses, setParticipantAddresses] = useState<Record<string, string>>({})

  const selectedTpl = useMemo(
    () => templates.find((t) => t.id === selectedTemplate) ?? null,
    [templates, selectedTemplate],
  )

  const handleTemplateChange = (tplId: string) => {
    setSelectedTemplate(tplId)
    const tpl = templates.find((t) => t.id === tplId)
    if (tpl?.roles) {
      const addrs: Record<string, string> = {}
      tpl.roles.forEach((r) => {
        addrs[r.name] = r.name === 'owner' ? (address ?? '') : ''
      })
      setParticipantAddresses(addrs)
    } else {
      setParticipantAddresses({})
    }
  }

  const buildParticipants = (): Participant[] => {
    if (!selectedTpl?.roles) return []
    return selectedTpl.roles.map((r) => ({
      role: r.name,
      address: participantAddresses[r.name]?.trim() ?? '',
    }))
  }

  const allParticipantsFilled = selectedTpl?.roles?.every(
    (r) => (participantAddresses[r.name]?.trim() ?? '').length > 0,
  ) ?? false

  const handleCreate = async () => {
    if (!address || !assetId || !selectedTemplate || !allParticipantsFilled) return
    try {
      const p = await createProcess.mutateAsync({
        assetId: Number(assetId),
        template: selectedTemplate,
        owner: address,
        participants: buildParticipants(),
      })
      setAssetId('')
      setSelectedTemplate('')
      setParticipantAddresses({})
      setShowCreate(false)
      router.push(`/processes/${p.id}`)
    } catch {
      // error surfaced via createProcess.error
    }
  }

  const createError = createProcess.error instanceof Error ? createProcess.error.message : createProcess.error ? 'Create failed' : null

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <nav className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:underline">Home</Link>
              <span>/</span>
              <span className="font-medium text-foreground">Processes</span>
            </nav>
            <h1 className="text-xl font-semibold tracking-tight">My Processes</h1>
            <p className="text-sm text-muted-foreground">Rental flows you participate in</p>
          </div>
          <ConnectButton />
        </header>

        {isConnected && (
          <div className="flex justify-end">
            <Button
              variant={showCreate ? 'secondary' : 'default'}
              onClick={() => setShowCreate(!showCreate)}
            >
              {showCreate ? 'Cancel' : 'Create Process'}
            </Button>
          </div>
        )}

        {showCreate && (
          <Card>
            <CardHeader>
              <CardTitle>New Process</CardTitle>
              <CardDescription>Start a rental flow for an asset using a template</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {createError && <p className="text-sm text-destructive">{createError}</p>}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Asset ID</Label>
                  <Input
                    type="number"
                    value={assetId}
                    onChange={(e) => setAssetId(e.target.value)}
                    placeholder="e.g. 1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Template</Label>
                  {templates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No templates available.{' '}
                      <Link href="/templates" className="text-primary underline-offset-4 hover:underline">Create one</Link>.
                    </p>
                  ) : (
                    <select
                      value={selectedTemplate}
                      onChange={(e) => handleTemplateChange(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    >
                      <option value="">Select a template</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} — {t.terms.price} {t.terms.currency ?? 'ETH'} / {t.terms.duration} {t.terms.durationUnit}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {selectedTpl?.roles && selectedTpl.roles.length > 0 && (
                <div className="space-y-3">
                  <Label>Assign Participants</Label>
                  <p className="text-xs text-muted-foreground">
                    Assign a wallet address to each role defined in the template.
                  </p>
                  {selectedTpl.roles.map((r) => (
                    <div key={r.name} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 text-sm font-medium capitalize">{r.label}</span>
                      <Input
                        value={participantAddresses[r.name] ?? ''}
                        onChange={(e) =>
                          setParticipantAddresses((prev) => ({ ...prev, [r.name]: e.target.value }))
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
                onClick={handleCreate}
                disabled={!assetId || !selectedTemplate || !allParticipantsFilled || createProcess.isPending}
              >
                {createProcess.isPending ? 'Creating...' : 'Create Process'}
              </Button>
            </CardContent>
          </Card>
        )}

        {!isConnected ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Connect your wallet to see your processes.</p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Loading...</p>
        ) : isEmpty ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No processes yet. Create one above or start a rental from an asset detail page.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {myProcesses.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">My Processes</h2>
                <ul className="space-y-3">
                  {myProcesses.map((p) => (
                    <li key={p.id}><ProcessCard p={p} /></li>
                  ))}
                </ul>
              </section>
            )}
            {openProcesses.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Available to Join</h2>
                <p className="text-xs text-muted-foreground">Processes waiting for a renter — click to view and confirm participation</p>
                <ul className="space-y-3">
                  {openProcesses.map((p) => (
                    <li key={p.id}><ProcessCard p={p} /></li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
