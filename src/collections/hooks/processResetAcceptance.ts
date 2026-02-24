import type { CollectionBeforeChangeHook } from 'payload'

/**
 * When agreedTerms change during NEGOTIATING, reset both acceptance flags.
 * A counter-offer invalidates any prior acceptance.
 */
export const processResetAcceptanceBeforeChange: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
}) => {
  if (!originalDoc || originalDoc.status !== 'NEGOTIATING') return data

  const prev = originalDoc.agreedTerms
  const next = data.agreedTerms
  if (!prev || !next) return data

  const changed =
    Number(prev.price) !== Number(next.price) ||
    Number(prev.duration) !== Number(next.duration) ||
    Number(prev.deposit) !== Number(next.deposit) ||
    prev.currency !== next.currency ||
    prev.durationUnit !== next.durationUnit

  if (changed) {
    data.ownerAccepted = false
    data.renterAccepted = false
  }

  return data
}
