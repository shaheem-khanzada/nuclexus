import type { CollectionAfterChangeHook } from 'payload'
import { EVENT_TYPES } from '@/lib/constants/eventTypes'

const ZERO_BYTES32 = '0x' + '0'.repeat(64)

/**
 * After an Event is created (from webhook), sync to Assets:
 * - CREATED: create Asset doc if none exists for this assetId
 * - Any event with proofHash: update Asset's latestProofHash
 */
export const eventsSyncAssetAfterChange: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create' || !req?.payload) return

  const { assetId, type, sender, proofHash } = doc
  if (assetId == null || !sender) return

  const hasProofHash =
    proofHash && typeof proofHash === 'string' && proofHash.toLowerCase() !== ZERO_BYTES32

  const existing = await req.payload.find({
    collection: 'assets',
    where: { assetId: { equals: assetId } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (type === EVENT_TYPES.CREATED && existing.docs.length === 0) {
    await req.payload.create({
      collection: 'assets',
      data: {
        assetId,
        creator: sender,
        ...(hasProofHash && { latestProofHash: proofHash }),
      },
      req,
      overrideAccess: true,
    })
    return
  }

  if (hasProofHash && existing.docs.length > 0) {
    await req.payload.update({
      collection: 'assets',
      id: existing.docs[0].id,
      data: { latestProofHash: proofHash },
      req,
      overrideAccess: true,
    })
  }
}
