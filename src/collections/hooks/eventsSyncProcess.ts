import type { CollectionAfterChangeHook } from 'payload'
import type { Template } from '@/payload-types'
import { EVENT_TYPES } from '@/lib/constants/eventTypes'

const UNIT_MS: Record<string, number> = {
  hours: 60 * 60 * 1000,
  days: 24 * 60 * 60 * 1000,
  weeks: 7 * 24 * 60 * 60 * 1000,
  months: 30 * 24 * 60 * 60 * 1000,
}

const EVENT_TO_STATUS: Record<string, string> = {
  [EVENT_TYPES.RENTAL_INITIATED]: 'PENDING_RENTER',
  [EVENT_TYPES.TERMS_REJECTED]: 'REJECTED',
  [EVENT_TYPES.NEGOTIATION_EXPIRED]: 'EXPIRED',
  [EVENT_TYPES.DEPOSIT_DECLARED]: 'DEPOSIT_PENDING',
  [EVENT_TYPES.DEPOSIT_CONFIRMED]: 'DEPOSIT_DECLARED',
  [EVENT_TYPES.HANDOVER_PROOF]: 'ACTIVE',
  [EVENT_TYPES.RETURN_PROOF]: 'RETURN_PENDING',
  [EVENT_TYPES.RETURN_VERIFIED]: 'RETURN_VERIFIED',
  [EVENT_TYPES.DEPOSIT_RESOLVED]: 'DEPOSIT_RESOLVING',
  [EVENT_TYPES.RESOLUTION_CONFIRMED]: 'COMPLETED',
}

/**
 * Resolve the sender's role from the process participants array.
 */
function senderRole(
  sender: string,
  participants: Array<{ role: string; address: string }>,
): string | null {
  const addr = sender.toLowerCase()
  return participants.find((p) => p.address.toLowerCase() === addr)?.role ?? null
}

/**
 * After an Event is created, if it has a processId, update the
 * Process document's status and related fields.
 */
export const eventsSyncProcessAfterChange: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create' || !req?.payload) return
  const { type, processId, metadata, sender } = doc
  if (!processId || !type) return

  const process = await req.payload.findByID({
    collection: 'processes',
    id: processId,
    depth: 1,
    overrideAccess: true,
  })
  if (!process) return

  const updateData: Record<string, unknown> = {}

  if (type === EVENT_TYPES.PARTICIPATION_CONFIRMED) {
    const template = typeof process.template === 'object' ? (process.template as Template) : null
    const negotiable = template?.terms?.negotiable

    if (negotiable) {
      updateData.status = 'NEGOTIATING'
      updateData.ownerAccepted = false
      updateData.renterAccepted = false

      const durationMinutes = template?.terms?.negotiationDuration ?? 30
      const deadline = new Date(Date.now() + durationMinutes * 60 * 1000)
      updateData.negotiationDeadline = deadline.toISOString()

      updateData.agreedTerms = {
        price: template?.terms?.price,
        currency: template?.terms?.currency,
        duration: template?.terms?.duration,
        durationUnit: template?.terms?.durationUnit,
        deposit: template?.terms?.deposit,
      }
    } else {
      updateData.status = 'TERMS_AGREED'
      if (template?.terms) {
        updateData.agreedTerms = {
          price: template.terms.price,
          currency: template.terms.currency,
          duration: template.terms.duration,
          durationUnit: template.terms.durationUnit,
          deposit: template.terms.deposit,
        }
      }
    }
  } else if (type === EVENT_TYPES.TERMS_ACCEPTED) {
    const participants = (process.participants ?? []) as Array<{ role: string; address: string }>
    const role = senderRole(sender ?? '', participants)

    let ownerAccepted = Boolean(process.ownerAccepted)
    let renterAccepted = Boolean(process.renterAccepted)

    if (role === 'owner') ownerAccepted = true
    if (role === 'renter') renterAccepted = true

    updateData.ownerAccepted = ownerAccepted
    updateData.renterAccepted = renterAccepted

    if (ownerAccepted && renterAccepted) {
      updateData.status = 'TERMS_AGREED'
    }
  } else if (type === EVENT_TYPES.HANDOVER_PROOF) {
    const now = new Date()
    updateData.status = 'ACTIVE'
    updateData.startDate = now.toISOString()

    const agreed = process.agreedTerms
    if (agreed?.duration && agreed?.durationUnit) {
      const ms = UNIT_MS[agreed.durationUnit] ?? UNIT_MS.days
      const end = new Date(now.getTime() + agreed.duration * ms)
      updateData.endDate = end.toISOString()
    }
  } else if (type === EVENT_TYPES.DEPOSIT_RESOLVED) {
    updateData.status = 'DEPOSIT_RESOLVING'
    if (metadata && typeof metadata === 'object') {
      const m = metadata as Record<string, unknown>
      if (m.resolution) updateData.depositResolution = m.resolution
    }
  } else {
    const newStatus = EVENT_TO_STATUS[type]
    if (!newStatus) return
    updateData.status = newStatus
  }

  if (Object.keys(updateData).length === 0) return

  await req.payload.update({
    collection: 'processes',
    id: processId,
    data: updateData,
    req,
    overrideAccess: true,
  })
}
