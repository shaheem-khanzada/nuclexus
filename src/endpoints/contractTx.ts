import type { Endpoint } from 'payload'
import { encodeCreateAsset, encodeSubmitProof, encodeVerifyAsset } from '@/lib/contracts/encode'

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? ''

function requireContract(): Response | null {
  if (!CONTRACT_ADDRESS) {
    return Response.json({ error: 'NEXT_PUBLIC_CONTRACT_ADDRESS not set' }, { status: 500 })
  }
  return null
}

async function parseProofBody(
  req: Request,
): Promise<{ assetId: number; hash: string; eventType?: string; processId?: string } | Response> {
  let body: { assetId?: number; proofHash?: string; eventType?: string; processId?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { assetId, proofHash, eventType } = body
  if (assetId == null || proofHash == null || typeof proofHash !== 'string') {
    return Response.json(
      { error: 'Body must include assetId (number) and proofHash (string, 32-byte hex)' },
      { status: 400 },
    )
  }
  const hash = proofHash.startsWith('0x') ? proofHash : '0x' + proofHash
  if (hash.length !== 66) {
    return Response.json(
      { error: 'proofHash must be 32 bytes (0x + 64 hex characters)' },
      { status: 400 },
    )
  }
  return { assetId: Number(assetId), hash, eventType, processId: body.processId }
}

const getCreateAssetTx: Endpoint = {
  path: '/tx/create-asset',
  method: 'get',
  handler: async (req) => {
    const err = requireContract()
    if (err) return err
    const url = new URL(req.url ?? '', 'http://localhost')
    const eventType = url.searchParams.get('eventType') ?? 'CREATED'
    try {
      const tx = encodeCreateAsset(CONTRACT_ADDRESS, eventType)
      return Response.json({
        tx,
        contractAddress: CONTRACT_ADDRESS,
        description: `Sign and send this transaction to create an on-chain asset (eventType: ${eventType}).`,
      })
    } catch (e) {
      console.error('[tx/create-asset]', e)
      return Response.json(
        { error: e instanceof Error ? e.message : 'Failed to build tx' },
        { status: 500 },
      )
    }
  },
}

const postSubmitProofTx: Endpoint = {
  path: '/tx/submit-proof',
  method: 'post',
  handler: async (req) => {
    const err = requireContract()
    if (err) return err
    const parsed = await parseProofBody(req as Request)
    if (parsed instanceof Response) return parsed
    const eventType = parsed.eventType ?? 'PROOF_SUBMITTED'
    try {
      const tx = encodeSubmitProof(CONTRACT_ADDRESS, parsed.assetId, parsed.hash, eventType, parsed.processId)
      return Response.json({
        tx,
        contractAddress: CONTRACT_ADDRESS,
        assetId: parsed.assetId,
        description: `Sign and send to submit proof (eventType: ${eventType}).`,
      })
    } catch (e) {
      console.error('[tx/submit-proof]', e)
      return Response.json(
        { error: e instanceof Error ? e.message : 'Failed to build tx' },
        { status: 500 },
      )
    }
  },
}

const postVerifyTx: Endpoint = {
  path: '/tx/verify',
  method: 'post',
  handler: async (req) => {
    const err = requireContract()
    if (err) return err
    const parsed = await parseProofBody(req as Request)
    if (parsed instanceof Response) return parsed
    const eventType = parsed.eventType ?? 'ATTESTATION'
    try {
      const tx = encodeVerifyAsset(CONTRACT_ADDRESS, parsed.assetId, parsed.hash, eventType)
      return Response.json({
        tx,
        contractAddress: CONTRACT_ADDRESS,
        assetId: parsed.assetId,
        description: `Sign and send to verify asset (eventType: ${eventType}).`,
      })
    } catch (e) {
      console.error('[tx/verify]', e)
      return Response.json(
        { error: e instanceof Error ? e.message : 'Failed to build tx' },
        { status: 500 },
      )
    }
  },
}

export const contractTxEndpoints: Endpoint[] = [
  getCreateAssetTx,
  postSubmitProofTx,
  postVerifyTx,
]
