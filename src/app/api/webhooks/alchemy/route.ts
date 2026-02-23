import configPromise from '@payload-config'
import { getPayload } from 'payload'

import {
  decodeRegistryEventLog,
  getAlchemySignature,
  getContractLogsFromPayload,
  type AlchemyWebhookPayload,
  type DecodedRegistryEvent,
  verifyAlchemySignature,
} from '@/lib/webhooks/alchemy'

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? ''
const SIGNING_KEY = process.env.ALCHEMY_WEBHOOK_SIGNING_KEY ?? ''

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const ZERO_BYTES32 = '0x' + '0'.repeat(64)

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET() {
  return Response.json(
    { ok: true, message: 'Alchemy webhook endpoint; send POST with signed payload.' },
    { status: 200 },
  )
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = getAlchemySignature(request)

  if (!SIGNING_KEY) {
    return new Response(JSON.stringify({ error: 'Webhook not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!verifyAlchemySignature(rawBody, signature, SIGNING_KEY)) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let payload: AlchemyWebhookPayload
  try {
    payload = JSON.parse(rawBody) as AlchemyWebhookPayload
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!CONTRACT_ADDRESS) {
    return new Response(
      JSON.stringify({ error: 'NEXT_PUBLIC_CONTRACT_ADDRESS not set' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const logs = getContractLogsFromPayload(payload, CONTRACT_ADDRESS)
  const decoded = logs
    .map((log) => decodeRegistryEventLog(log))
    .filter((e): e is DecodedRegistryEvent => e != null)

  if (decoded.length > 0) {
    const payloadInstance = await getPayload({ config: configPromise })

    for (const e of decoded) {
      const txHash = e.transactionHash ?? ''
      const assetIdNum = Number(e.assetId)
      const timestampNum = Number(e.timestamp)
      if (!txHash || !e.sender || !e.type || !Number.isFinite(assetIdNum) || !Number.isFinite(timestampNum)) {
        continue
      }

      const proofHash =
        e.proofHash && e.proofHash.toLowerCase() !== ZERO_BYTES32 ? e.proofHash : undefined
      const validator =
        e.validator && e.validator.toLowerCase() !== ZERO_ADDRESS ? e.validator : undefined

      try {
        const eventData = {
          assetId: assetIdNum,
          type: e.type,
          source: 'on-chain' as const,
          sender: e.sender,
          timestamp: timestampNum,
          transactionHash: txHash,
          ...(proofHash != null && { proofHash }),
          ...(validator != null && { validator }),
          ...(e.blockNumber != null && { blockNumber: e.blockNumber }),
          ...(e.processId != null && { processId: e.processId }),
        }
        await payloadInstance.create({
          collection: 'events',
          data: eventData,
        })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        if (!msg.includes('duplicate') && !msg.includes('E11000')) {
          console.error('[webhooks/alchemy] Failed to save event', err)
        }
      }
    }
  }

  return new Response(
    JSON.stringify({ received: true, events: decoded.length }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}
