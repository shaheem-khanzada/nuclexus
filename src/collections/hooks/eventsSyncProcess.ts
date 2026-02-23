import type { CollectionAfterChangeHook } from 'payload'
import type { Template } from '@/payload-types'

const UNIT_MS: Record<string, number> = {
  hours: 60 * 60 * 1000,
  days: 24 * 60 * 60 * 1000,
  weeks: 7 * 24 * 60 * 60 * 1000,
  months: 30 * 24 * 60 * 60 * 1000,
}

const EVENT_TO_STATUS: Record<string, string> = {
  RENTAL_INITIATED: 'PENDING_RENTER',
  PARTICIPATION_CONFIRMED: 'PENDING_RENTER',
  TERMS_ACCEPTED: 'TERMS_AGREED',
  TERMS_REJECTED: 'REJECTED',
  DEPOSIT_DECLARED: 'DEPOSIT_PENDING',
  DEPOSIT_CONFIRMED: 'DEPOSIT_DECLARED',
  HANDOVER_PROOF: 'ACTIVE',
  RETURN_PROOF: 'RETURN_PENDING',
  RETURN_VERIFIED: 'RETURN_VERIFIED',
  DEPOSIT_RESOLVED: 'DEPOSIT_RESOLVING',
  RESOLUTION_CONFIRMED: 'COMPLETED',
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
  const { type, processId, metadata } = doc
  if (!processId || !type) return

  const process = await req.payload.findByID({
    collection: 'processes',
    id: processId,
    depth: 1,
    overrideAccess: true,
  })
  if (!process) return

  const updateData: Record<string, unknown> = {}

  if (type === 'PARTICIPATION_CONFIRMED') {
    const template = typeof process.template === 'object' ? (process.template as Template) : null
    const negotiable = template?.terms?.negotiable
    updateData.status = negotiable ? 'NEGOTIATING' : 'TERMS_AGREED'

    if (!negotiable && template?.terms) {
      updateData.agreedTerms = {
        price: template.terms.price,
        currency: template.terms.currency,
        duration: template.terms.duration,
        durationUnit: template.terms.durationUnit,
        deposit: template.terms.deposit,
      }
    }
  } else if (type === 'TERMS_ACCEPTED') {
    updateData.status = 'TERMS_AGREED'
    if (metadata && typeof metadata === 'object') {
      const m = metadata as Record<string, unknown>
      if (m.price != null || m.duration != null || m.deposit != null) {
        updateData.agreedTerms = {
          price: m.price,
          currency: m.currency,
          duration: m.duration,
          durationUnit: m.durationUnit,
          deposit: m.deposit,
        }
      }
    }
  } else if (type === 'HANDOVER_PROOF') {
    const now = new Date()
    updateData.status = 'ACTIVE'
    updateData.startDate = now.toISOString()

    const agreed = process.agreedTerms
    if (agreed?.duration && agreed?.durationUnit) {
      const ms = UNIT_MS[agreed.durationUnit] ?? UNIT_MS.days
      const end = new Date(now.getTime() + agreed.duration * ms)
      updateData.endDate = end.toISOString()
    }
  } else if (type === 'DEPOSIT_RESOLVED') {
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
