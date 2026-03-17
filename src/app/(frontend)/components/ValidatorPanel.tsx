'use client'

import { useState, useMemo } from 'react'
import { useUpload, useSubmitProof, useAddProcessEvent } from '@/app/(frontend)/hooks'
import { EVENT_TYPES } from '@/lib/constants/eventTypes'
import type { EventItem } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const VALIDATION_TYPES = [
  { value: 'asset', label: 'Asset Condition' },
  { value: 'handover', label: 'Handover Condition' },
  { value: 'return', label: 'Return Condition' },
] as const

type ValidationType = (typeof VALIDATION_TYPES)[number]['value']

interface ValidatorPanelProps {
  processId: string
  assetId: number
  userRole: string
  walletAddress: string
  events: EventItem[]
}

export function ValidatorPanel({
  processId,
  assetId,
  userRole,
  walletAddress,
  events,
}: ValidatorPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const [validationType, setValidationType] = useState<ValidationType>('asset')
  const [file, setFile] = useState<File | null>(null)
  const [notes, setNotes] = useState('')

  const uploadMutation = useUpload()
  const submitProof = useSubmitProof()
  const addEvent = useAddProcessEvent()

  const isSubmitting = uploadMutation.isPending || submitProof.loading || addEvent.isPending

  const pastAttestations = useMemo(
    () => events.filter((e) => e.type === EVENT_TYPES.ATTESTATION),
    [events],
  )

  const handleSubmit = async () => {
    if (!file) return

    try {
      const uploaded = await uploadMutation.mutateAsync({ file, processId })

      await addEvent.mutateAsync({
        type: EVENT_TYPES.ATTESTATION,
        assetId,
        processId,
        sender: walletAddress,
        proofHash: uploaded.hash,
        metadata: {
          validationType,
          notes: notes.trim() || undefined,
          mediaIds: [uploaded.id],
        },
      })

      await submitProof.submit(assetId, uploaded.hash, EVENT_TYPES.ATTESTATION, processId)

      setFile(null)
      setNotes('')
    } catch {
      // errors surfaced via mutation states
    }
  }

  const errorMessages: string[] = []
  if (uploadMutation.error)
    errorMessages.push(uploadMutation.error instanceof Error ? uploadMutation.error.message : 'Upload failed')
  if (submitProof.error) errorMessages.push(submitProof.error)
  if (addEvent.error)
    errorMessages.push(addEvent.error instanceof Error ? addEvent.error.message : 'Event creation failed')

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            Validator Panel
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({userRole})
            </span>
          </CardTitle>
          <span className="text-muted-foreground">{expanded ? '−' : '+'}</span>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-5">
          {errorMessages.length > 0 && (
            <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessages.join('; ')}
            </p>
          )}

          <div className="space-y-4 rounded-md border border-border p-4">
            <p className="text-sm font-medium">Submit Attestation</p>
            <p className="text-xs text-muted-foreground">
              Inspect the asset or rental conditions, upload evidence, and anchor the proof on-chain.
              This does not affect the rental flow.
            </p>

            <div className="space-y-2">
              <Label>Validation Type</Label>
              <select
                value={validationType}
                onChange={(e) => setValidationType(e.target.value as ValidationType)}
                className="flex h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                {VALIDATION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Evidence (photo / document)</Label>
              <Input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="max-w-sm"
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe the condition observed..."
                rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <Button onClick={handleSubmit} disabled={!file || isSubmitting}>
              {isSubmitting ? 'Submitting Attestation...' : 'Submit Attestation'}
            </Button>

            {submitProof.confirmed && (
              <p className="text-xs text-green-600 dark:text-green-400">
                Attestation anchored on-chain.
              </p>
            )}
          </div>

          {pastAttestations.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Past Attestations ({pastAttestations.length})</p>
              <div className="space-y-2">
                {pastAttestations.map((att) => {
                  const meta = att.metadata as
                    | { validationType?: string; notes?: string; mediaIds?: string[] }
                    | undefined
                  return (
                    <div
                      key={att.id}
                      className="rounded-md border border-border p-3 text-sm"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        {meta?.validationType && (
                          <span className="inline-flex rounded bg-purple-500/20 px-2 py-0.5 text-xs font-medium text-purple-600 dark:text-purple-400">
                            {meta.validationType}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {att.sender.slice(0, 6)}...{att.sender.slice(-4)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(att.createdAt).toLocaleString()}
                        </span>
                        {att.source === 'on-chain' && att.transactionHash && (
                          <a
                            href={`https://sepolia.etherscan.io/tx/${att.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary underline-offset-4 hover:underline"
                          >
                            tx
                          </a>
                        )}
                      </div>
                      {meta?.notes && (
                        <p className="mt-1 text-xs text-muted-foreground">{meta.notes}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
