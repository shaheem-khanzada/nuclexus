import type { Payload } from 'payload'
import { EVENT_TYPES } from '@/lib/constants/eventTypes'

export async function expireProcesses(payload: Payload): Promise<{ expired: number }> {
  const now = new Date().toISOString()
  let expired = 0

  const staleNegotiations = await payload.find({
    collection: 'processes',
    where: {
      and: [
        { status: { equals: 'NEGOTIATING' } },
        { negotiationDeadline: { less_than: now } },
      ],
    },
    limit: 100,
    overrideAccess: true,
  })

  for (const proc of staleNegotiations.docs) {
    await payload.create({
      collection: 'events',
      data: {
        type: EVENT_TYPES.NEGOTIATION_EXPIRED,
        source: 'off-chain',
        assetId: proc.assetId,
        processId: proc.id as string,
        sender: 'system',
        timestamp: Math.floor(Date.now() / 1000),
        metadata: { reason: 'Negotiation deadline passed' },
      },
    })
    expired++
  }

  const overdueRentals = await payload.find({
    collection: 'processes',
    where: {
      and: [
        { status: { equals: 'ACTIVE' } },
        { endDate: { less_than: now } },
      ],
    },
    limit: 100,
    overrideAccess: true,
  })

  for (const proc of overdueRentals.docs) {
    await payload.create({
      collection: 'events',
      data: {
        type: EVENT_TYPES.RENTAL_ENDED,
        source: 'off-chain',
        assetId: proc.assetId,
        processId: proc.id as string,
        sender: 'system',
        timestamp: Math.floor(Date.now() / 1000),
        metadata: { reason: 'Rental duration ended' },
      },
    })
    expired++
  }

  return { expired }
}
