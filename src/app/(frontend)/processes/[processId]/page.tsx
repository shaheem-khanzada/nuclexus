'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import {
  useProcess,
  useAddProcessEvent,
  useUpdateProcess,
  useSubmitProof,
  useUpload,
  useVerifyAsset,
} from '@/app/(frontend)/hooks'
import type { TemplateItem, TermsData } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EVENT_TYPES } from '@/lib/constants/eventTypes'

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
  EXPIRED: 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
}

const DURATION_UNITS = ['hours', 'days', 'weeks', 'months'] as const

const PROOF_EVENT_TYPES: Set<string> = new Set([EVENT_TYPES.HANDOVER_PROOF, EVENT_TYPES.RETURN_PROOF])
const VERIFIER_ROLES = new Set(['validator', 'witness'])

type TermsForm = {
  price: string
  currency: string
  duration: string
  durationUnit: string
  deposit: string
}

function termsToForm(t: Partial<TermsData> | undefined | null): TermsForm {
  return {
    price: t?.price != null ? String(t.price) : '',
    currency: t?.currency ?? 'ETH',
    duration: t?.duration != null ? String(t.duration) : '',
    durationUnit: t?.durationUnit ?? 'days',
    deposit: t?.deposit != null ? String(t.deposit) : '',
  }
}

function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export default function ProcessDetailPage() {
  const params = useParams()
  const processId = params?.processId as string
  const { address, isConnected } = useAccount()
  const { data, isLoading, error: queryError } = useProcess(processId || null)
  const addEvent = useAddProcessEvent()
  const updateProcess = useUpdateProcess()
  const submitProof = useSubmitProof()
  const uploadMutation = useUpload()
  const verifyAsset = useVerifyAsset()

  const [file, setFile] = useState<File | null>(null)
  const [depositResolution, setDepositResolution] = useState<string>('returned')
  const [incidentDesc, setIncidentDesc] = useState('')
  const [editingTerms, setEditingTerms] = useState(false)
  const [termsForm, setTermsForm] = useState<TermsForm>(termsToForm(null))
  const [countdown, setCountdown] = useState<string | null>(null)
  const [deadlineExpired, setDeadlineExpired] = useState(false)

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Failed to load' : null

  const actionError = (() => {
    const errs: string[] = []
    if (addEvent.error) errs.push(addEvent.error instanceof Error ? addEvent.error.message : 'Action failed')
    if (updateProcess.error) errs.push(updateProcess.error instanceof Error ? updateProcess.error.message : 'Update failed')
    if (verifyAsset.error) errs.push(verifyAsset.error)
    return errs.length ? errs.join('; ') : null
  })()

  const proc = data?.process
  const events = data?.events ?? []

  const userRole = useMemo(() => {
    if (!proc?.participants || !address) return null
    const addr = address.toLowerCase()
    return proc.participants.find((p) => p.address.toLowerCase() === addr)?.role ?? null
  }, [proc?.participants, address])

  const isOwner = userRole === 'owner'
  const isRenter = userRole === 'renter'
  const isVerifier = VERIFIER_ROLES.has(userRole ?? '')
  const template = proc ? (typeof proc.template === 'object' ? (proc.template as TemplateItem) : null) : null

  const latestProofHash = useMemo(() => {
    const proofEvent = events.find((e) => PROOF_EVENT_TYPES.has(e.type) && e.proofHash)
    return proofEvent?.proofHash ?? null
  }, [events])

  useEffect(() => {
    if (!proc) return
    const source = proc.agreedTerms ?? template?.terms
    setTermsForm(termsToForm(source))
  }, [proc, template])

  // Countdown timer for negotiation deadline
  useEffect(() => {
    if (proc?.status !== 'NEGOTIATING' || !proc.negotiationDeadline) {
      setCountdown(null)
      setDeadlineExpired(false)
      return
    }
    const deadlineMs = new Date(proc.negotiationDeadline).getTime()
    const tick = () => {
      const remaining = deadlineMs - Date.now()
      if (remaining <= 0) {
        setCountdown('00:00')
        setDeadlineExpired(true)
        return
      }
      const mins = Math.floor(remaining / 60000)
      const secs = Math.floor((remaining % 60000) / 1000)
      setCountdown(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`)
      setDeadlineExpired(false)
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [proc?.status, proc?.negotiationDeadline])

  // Auto-expire negotiation when deadline passes
  useEffect(() => {
    if (!deadlineExpired || !proc || proc.status !== 'NEGOTIATING' || !address) return
    addEvent.mutateAsync({
      type: EVENT_TYPES.NEGOTIATION_EXPIRED,
      assetId: proc.assetId,
      processId: proc.id,
      sender: address,
    }).catch(() => {})
  }, [deadlineExpired]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-3xl">
          <header className="flex items-center justify-between border-b border-border pb-6">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:underline">Home</Link>
              <span>/</span>
              <Link href="/processes" className="hover:underline">Processes</Link>
            </nav>
            <ConnectButton />
          </header>
          <Card className="mt-8 border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Connect your wallet to view this process.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (isLoading || !proc) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-3xl">
          <header className="flex items-center justify-between border-b border-border pb-6">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:underline">Home</Link>
              <span>/</span>
              <Link href="/processes" className="hover:underline">Processes</Link>
            </nav>
            <ConnectButton />
          </header>
          <div className="py-12 text-center text-muted-foreground">
            {error ? <p className="text-destructive">{error}</p> : 'Loading...'}
          </div>
        </div>
      </div>
    )
  }

  const canEditTerms =
    (isOwner && (proc.status === 'DRAFT' || proc.status === 'NEGOTIATING')) ||
    (isRenter && proc.status === 'NEGOTIATING')

  const fireEvent = async (type: string, metadata?: Record<string, unknown>) => {
    await addEvent.mutateAsync({
      type,
      assetId: proc.assetId,
      processId: proc.id,
      sender: address!,
      metadata,
    })
  }

  const handleUploadAndProof = async (eventType: string) => {
    if (!file) return
    try {
      const uploaded = await uploadMutation.mutateAsync({ file, processId: proc.id })
      await submitProof.submit(proc.assetId, uploaded.hash, eventType, proc.id)
      setFile(null)
    } catch {
      // errors surfaced via mutation states
    }
  }

  const handleSaveTerms = async () => {
    await updateProcess.mutateAsync({
      id: proc.id,
      agreedTerms: {
        price: Number(termsForm.price),
        currency: termsForm.currency || 'ETH',
        duration: Number(termsForm.duration),
        durationUnit: termsForm.durationUnit,
        deposit: Number(termsForm.deposit),
      },
    })
    setEditingTerms(false)
  }

  const handleVerifyProof = async () => {
    if (!latestProofHash) return
    await verifyAsset.verify(proc.assetId, latestProofHash, EVENT_TYPES.PROOF_VERIFIED, proc.id)
  }

  const displayTerms = proc.agreedTerms ?? template?.terms

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <nav className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:underline">Home</Link>
              <span>/</span>
              <Link href="/processes" className="hover:underline">Processes</Link>
              <span>/</span>
              <span className="font-medium text-foreground">Asset #{proc.assetId}</span>
            </nav>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight">Process — Asset #{proc.assetId}</h1>
              <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[proc.status] ?? 'bg-muted text-muted-foreground'}`}>
                {proc.status.replace(/_/g, ' ')}
              </span>
              {userRole && (
                <span className="inline-flex rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  Your role: {userRole}
                </span>
              )}
            </div>
          </div>
          <ConnectButton />
        </header>

        {actionError && (
          <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {actionError}
          </p>
        )}

        {/* Participants */}
        <Card>
          <CardHeader>
            <CardTitle>Participants</CardTitle>
            <CardDescription>Wallet addresses assigned to each role</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              {proc.participants.map((p) => (
                <div key={p.role}>
                  <dt className="capitalize text-muted-foreground">{p.role}</dt>
                  <dd className="font-mono">{shortAddr(p.address)}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        {/* Terms (read-only display or editable) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Terms</CardTitle>
              <CardDescription>
                {proc.agreedTerms
                  ? 'Agreed terms'
                  : template
                    ? `Template: ${template.name}`
                    : 'Template terms'}
              </CardDescription>
            </div>
            {canEditTerms && !editingTerms && (
              <Button variant="outline" size="sm" onClick={() => setEditingTerms(true)}>
                Edit Terms
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editingTerms ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Price</Label>
                    <Input
                      type="number"
                      value={termsForm.price}
                      onChange={(e) => setTermsForm((f) => ({ ...f, price: e.target.value }))}
                      placeholder="0.1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Input
                      value={termsForm.currency}
                      onChange={(e) => setTermsForm((f) => ({ ...f, currency: e.target.value }))}
                      placeholder="ETH"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Input
                      type="number"
                      value={termsForm.duration}
                      onChange={(e) => setTermsForm((f) => ({ ...f, duration: e.target.value }))}
                      placeholder="7"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration Unit</Label>
                    <select
                      value={termsForm.durationUnit}
                      onChange={(e) => setTermsForm((f) => ({ ...f, durationUnit: e.target.value }))}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    >
                      {DURATION_UNITS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Deposit</Label>
                    <Input
                      type="number"
                      value={termsForm.deposit}
                      onChange={(e) => setTermsForm((f) => ({ ...f, deposit: e.target.value }))}
                      placeholder="0.05"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveTerms}
                    disabled={updateProcess.isPending || !termsForm.price || !termsForm.duration || !termsForm.deposit}
                  >
                    {updateProcess.isPending ? 'Saving...' : 'Save Terms'}
                  </Button>
                  <Button variant="ghost" onClick={() => {
                    setEditingTerms(false)
                    setTermsForm(termsToForm(displayTerms))
                  }}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {displayTerms ? (
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-muted-foreground">Price</dt>
                      <dd>{displayTerms.price} {displayTerms.currency ?? 'ETH'}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Duration</dt>
                      <dd>{displayTerms.duration} {displayTerms.durationUnit}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Deposit</dt>
                      <dd>{displayTerms.deposit} {displayTerms.currency ?? 'ETH'}</dd>
                    </div>
                    {'negotiable' in displayTerms && (
                      <div>
                        <dt className="text-muted-foreground">Negotiable</dt>
                        <dd>{displayTerms.negotiable ? 'Yes' : 'No'}</dd>
                      </div>
                    )}
                  </dl>
                ) : (
                  <p className="text-sm text-muted-foreground">No terms available</p>
                )}
              </>
            )}

            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              {proc.startDate && (
                <div>
                  <dt className="text-muted-foreground">Start</dt>
                  <dd>{new Date(proc.startDate).toLocaleString()}</dd>
                </div>
              )}
              {proc.endDate && (
                <div>
                  <dt className="text-muted-foreground">End</dt>
                  <dd>{new Date(proc.endDate).toLocaleString()}</dd>
                </div>
              )}
              {proc.depositResolution && (
                <div>
                  <dt className="text-muted-foreground">Deposit Resolution</dt>
                  <dd className="capitalize">{proc.depositResolution}</dd>
                </div>
              )}
              {proc.negotiationDeadline && (
                <div>
                  <dt className="text-muted-foreground">Negotiation Deadline</dt>
                  <dd>{new Date(proc.negotiationDeadline).toLocaleString()}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Negotiation status (visible during NEGOTIATING) */}
        {proc.status === 'NEGOTIATING' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Negotiation</CardTitle>
              <CardDescription>Both parties must accept the terms before the deadline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {countdown && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground">Time remaining:</span>
                  <span className={`font-mono text-lg font-bold ${deadlineExpired ? 'text-destructive' : ''}`}>
                    {deadlineExpired ? 'Expired' : countdown}
                  </span>
                </div>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex items-center gap-2 rounded-md border border-border p-3">
                  <div className={`h-2.5 w-2.5 rounded-full ${proc.ownerAccepted ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                  <span className="text-sm">Owner: {proc.ownerAccepted ? 'Accepted' : 'Pending'}</span>
                </div>
                <div className="flex items-center gap-2 rounded-md border border-border p-3">
                  <div className={`h-2.5 w-2.5 rounded-full ${proc.renterAccepted ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                  <span className="text-sm">Renter: {proc.renterAccepted ? 'Accepted' : 'Pending'}</span>
                </div>
              </div>
              {proc.negotiationDeadline && (
                <p className="text-xs text-muted-foreground">
                  Deadline: {new Date(proc.negotiationDeadline).toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Owner: initiate */}
            {isOwner && proc.status === 'DRAFT' && (
              <Button onClick={() => fireEvent(EVENT_TYPES.RENTAL_INITIATED)} disabled={addEvent.isPending}>
                {addEvent.isPending ? 'Processing...' : 'Initiate Rental'}
              </Button>
            )}

            {/* Renter: confirm participation */}
            {isRenter && proc.status === 'PENDING_RENTER' && (
              <div className="flex gap-2">
                <Button onClick={() => fireEvent(EVENT_TYPES.PARTICIPATION_CONFIRMED)} disabled={addEvent.isPending}>
                  {addEvent.isPending ? 'Confirming...' : 'Confirm Participation'}
                </Button>
                <Button variant="destructive" onClick={() => fireEvent(EVENT_TYPES.TERMS_REJECTED)} disabled={addEvent.isPending}>
                  Reject
                </Button>
              </div>
            )}

            {/* Negotiating: counter-offer hint + accept / reject */}
            {proc.status === 'NEGOTIATING' && (isOwner || isRenter) && !deadlineExpired && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Edit the terms above to propose a counter-offer (this resets both acceptances).
                  Once both parties accept, terms are locked.
                </p>
                {(() => {
                  const alreadyAccepted =
                    (isOwner && proc.ownerAccepted) || (isRenter && proc.renterAccepted)
                  return (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => fireEvent(EVENT_TYPES.TERMS_ACCEPTED)}
                        disabled={addEvent.isPending || Boolean(alreadyAccepted)}
                      >
                        {alreadyAccepted
                          ? 'You accepted — waiting for other party'
                          : addEvent.isPending
                            ? 'Accepting...'
                            : 'Accept Terms'}
                      </Button>
                      <Button variant="destructive" onClick={() => fireEvent(EVENT_TYPES.TERMS_REJECTED)} disabled={addEvent.isPending}>
                        Reject
                      </Button>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Negotiation expired */}
            {proc.status === 'EXPIRED' && (
              <p className="text-sm text-orange-600 dark:text-orange-400">
                Negotiation expired. Both parties did not accept within the deadline.
              </p>
            )}

            {/* Step 1: Renter uploads deposit receipt + on-chain proof */}
            {isRenter && proc.status === 'TERMS_AGREED' && (
              <div className="space-y-3">
                <p className="text-sm font-medium">Upload deposit receipt</p>
                <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="max-w-sm" />
                <Button
                  onClick={() => handleUploadAndProof(EVENT_TYPES.DEPOSIT_DECLARED)}
                  disabled={!file || uploadMutation.isPending || submitProof.loading}
                >
                  {uploadMutation.isPending || submitProof.loading ? 'Submitting...' : 'Declare Deposit'}
                </Button>
              </div>
            )}

            {/* Step 2: Owner confirms deposit received on-chain */}
            {isOwner && proc.status === 'DEPOSIT_PENDING' && (
              <div className="space-y-3">
                <p className="text-sm font-medium">The renter has declared a deposit. Confirm you have received it.</p>
                <Button
                  onClick={() =>
                    submitProof.submit(
                      proc.assetId,
                      '0x' + '0'.repeat(64),
                      EVENT_TYPES.DEPOSIT_CONFIRMED,
                      proc.id,
                    )
                  }
                  disabled={submitProof.loading}
                >
                  {submitProof.loading ? 'Confirming...' : 'Confirm Deposit Received'}
                </Button>
              </div>
            )}

            {/* Owner: upload handover proof */}
            {isOwner && proc.status === 'DEPOSIT_DECLARED' && (
              <div className="space-y-3">
                <p className="text-sm font-medium">Upload handover proof</p>
                <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="max-w-sm" />
                <Button
                  onClick={() => handleUploadAndProof(EVENT_TYPES.HANDOVER_PROOF)}
                  disabled={!file || uploadMutation.isPending || submitProof.loading}
                >
                  {uploadMutation.isPending || submitProof.loading ? 'Uploading...' : 'Upload & Submit Proof'}
                </Button>
              </div>
            )}

            {/* Active: return proof + incident logging + verifier actions */}
            {proc.status === 'ACTIVE' && (
              <div className="space-y-4">
                {isRenter && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Upload return proof</p>
                    <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="max-w-sm" />
                    <Button
                      onClick={() => handleUploadAndProof(EVENT_TYPES.RETURN_PROOF)}
                      disabled={!file || uploadMutation.isPending || submitProof.loading}
                    >
                      {uploadMutation.isPending || submitProof.loading ? 'Uploading...' : 'Upload Return Proof'}
                    </Button>
                  </div>
                )}

                {isVerifier && latestProofHash && (
                  <div className="space-y-3 rounded-md border border-border p-4">
                    <p className="text-sm font-medium">Verify Proof On-Chain</p>
                    <p className="text-xs text-muted-foreground">
                      As a {userRole}, confirm the latest proof is correct by sending a verification transaction.
                    </p>
                    <Button
                      onClick={handleVerifyProof}
                      disabled={verifyAsset.loading}
                    >
                      {verifyAsset.loading ? 'Verifying...' : 'Verify Proof'}
                    </Button>
                    {verifyAsset.confirmed && (
                      <p className="text-xs text-green-600 dark:text-green-400">Verification confirmed on-chain.</p>
                    )}
                  </div>
                )}

                {(isOwner || isRenter) && (
                  <div className="space-y-3 rounded-md border border-border p-4">
                    <p className="text-sm font-medium">Log an Incident</p>
                    <Input
                      value={incidentDesc}
                      onChange={(e) => setIncidentDesc(e.target.value)}
                      placeholder="Describe the incident..."
                      className="max-w-md"
                    />
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        await fireEvent(EVENT_TYPES.INCIDENT, incidentDesc ? { description: incidentDesc } : undefined)
                        setIncidentDesc('')
                      }}
                      disabled={addEvent.isPending}
                    >
                      {addEvent.isPending ? 'Logging...' : 'Log Incident'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Verifier actions during RETURN_PENDING */}
            {proc.status === 'RETURN_PENDING' && isVerifier && latestProofHash && (
              <div className="space-y-3 rounded-md border border-border p-4">
                <p className="text-sm font-medium">Verify Return Proof On-Chain</p>
                <p className="text-xs text-muted-foreground">
                  As a {userRole}, confirm the return proof is correct.
                </p>
                <Button
                  onClick={handleVerifyProof}
                  disabled={verifyAsset.loading}
                >
                  {verifyAsset.loading ? 'Verifying...' : 'Verify Proof'}
                </Button>
                {verifyAsset.confirmed && (
                  <p className="text-xs text-green-600 dark:text-green-400">Verification confirmed on-chain.</p>
                )}
              </div>
            )}

            {/* Owner: verify return */}
            {isOwner && proc.status === 'RETURN_PENDING' && (
              <Button onClick={() => fireEvent(EVENT_TYPES.RETURN_VERIFIED)} disabled={addEvent.isPending}>
                {addEvent.isPending ? 'Verifying...' : 'Verify Return'}
              </Button>
            )}

            {/* Owner: resolve deposit */}
            {isOwner && proc.status === 'RETURN_VERIFIED' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Deposit Resolution</Label>
                  <select
                    value={depositResolution}
                    onChange={(e) => setDepositResolution(e.target.value)}
                    className="flex h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="returned">Returned</option>
                    <option value="partial">Partial</option>
                    <option value="withheld">Withheld</option>
                  </select>
                </div>
                <Button onClick={() => fireEvent(EVENT_TYPES.DEPOSIT_RESOLVED, { resolution: depositResolution })} disabled={addEvent.isPending}>
                  {addEvent.isPending ? 'Resolving...' : 'Resolve Deposit'}
                </Button>
              </div>
            )}

            {/* Renter: confirm deposit resolution */}
            {isRenter && proc.status === 'DEPOSIT_RESOLVING' && (
              <Button onClick={() => fireEvent(EVENT_TYPES.RESOLUTION_CONFIRMED)} disabled={addEvent.isPending}>
                {addEvent.isPending ? 'Confirming...' : 'Confirm Deposit Resolution'}
              </Button>
            )}

            {proc.status === 'COMPLETED' && (
              <p className="text-sm text-green-600 dark:text-green-400">This rental is completed.</p>
            )}
            {proc.status === 'REJECTED' && (
              <p className="text-sm text-destructive">This rental was rejected.</p>
            )}

            {!userRole && !['COMPLETED', 'REJECTED'].includes(proc.status) && (
              <p className="text-sm text-muted-foreground">
                You are not a participant in this process. No actions available.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Events Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Events</CardTitle>
            <CardDescription>Immutable event log for this process</CardDescription>
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
                      <th className="px-4 py-3 text-left font-medium">Source</th>
                      <th className="px-4 py-3 text-left font-medium">Sender</th>
                      <th className="px-4 py-3 text-left font-medium">Time</th>
                      <th className="px-4 py-3 text-left font-medium">Tx</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((e) => (
                      <tr key={e.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded bg-muted px-2 py-0.5 text-xs font-medium">
                            {e.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{e.source}</td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">
                          {shortAddr(e.sender)}
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
                              {e.transactionHash.slice(0, 10)}...
                            </a>
                          ) : (
                            <span className="text-muted-foreground">&mdash;</span>
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
  )
}
