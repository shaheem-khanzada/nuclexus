import * as crypto from 'node:crypto'
import { Interface, type InterfaceAbi } from 'ethers'

import { AssetRegistryABI } from '@/lib/contracts/abis/AssetRegistry'

const SIGNATURE_HEADER = 'x-alchemy-signature'
const REGISTRY_EVENT_NAME = 'RegistryEvent'

/**
 * Verify that the request body was signed by Alchemy using your webhook signing key.
 * Use the signing key from Dashboard → Webhooks → Signing key.
 */
export function verifyAlchemySignature(
  rawBody: string,
  signatureHeader: string | null,
  signingKey: string,
): boolean {
  if (!signatureHeader || !signingKey) return false
  const expectedBuf = crypto
    .createHmac('sha256', signingKey)
    .update(rawBody, 'utf8')
    .digest()
  const sig = signatureHeader.trim()
  try {
    const sigBuf = Buffer.from(sig, 'hex')
    if (sigBuf.length === expectedBuf.length) {
      return crypto.timingSafeEqual(sigBuf, expectedBuf)
    }
    const sigBase64 = Buffer.from(sig, 'base64')
    if (sigBase64.length === expectedBuf.length) {
      return crypto.timingSafeEqual(sigBase64, expectedBuf)
    }
  } catch {
    // invalid encoding
  }
  return false
}

export function getAlchemySignature(request: Request): string | null {
  return request.headers.get(SIGNATURE_HEADER)
}

/**
 * Alchemy Notify webhook payload (top-level).
 * See https://docs.alchemy.com/reference/notify-api-quickstart
 */
export type AlchemyWebhookPayload = {
  webhookId?: string
  id?: string
  createdAt?: string
  type?: string
  event?: {
    network?: string
    activity?: Array<{
      blockNum?: string
      hash?: string
      fromAddress?: string
      toAddress?: string
      rawContract?: { address?: string }
      log?: {
        address?: string
        topics?: string[]
        data?: string
        blockNum?: string
        transactionHash?: string
      }
    }>
    /** Custom webhooks (GraphQL) */
    data?: {
      block?: {
        logs?: Array<{
          account?: { address?: string }
          topics?: string[]
          data?: string
          transaction?: { hash?: string }
          block?: { number?: string }
        }>
      }
    }
  }
}

/**
 * Normalized log entry for our contract events.
 */
export type ContractLog = {
  address: string
  topics: string[]
  data: string
  transactionHash: string | undefined
  blockNumber: string | undefined
}

/**
 * Collect contract logs from Alchemy webhook event.
 * Handles both ADDRESS_ACTIVITY (event.activity[].log) and custom GraphQL (event.data.block.logs).
 */
export function getContractLogsFromPayload(
  payload: AlchemyWebhookPayload,
  contractAddress: string,
): ContractLog[] {
  const addr = contractAddress.toLowerCase()
  const logs: ContractLog[] = []

  const push = (log: { address?: string; topics?: string[]; data?: string; transactionHash?: string; transaction?: { hash?: string }; blockNum?: string; block?: { number?: string } }) => {
    const address = (log.address ?? (log as { account?: { address?: string } }).account?.address) ?? ''
    if (address.toLowerCase() !== addr) return
    logs.push({
      address: address,
      topics: Array.isArray(log.topics) ? log.topics : [],
      data: typeof log.data === 'string' ? log.data : '',
      transactionHash: log.transactionHash ?? log.transaction?.hash,
      blockNumber: log.blockNum ?? log.block?.number?.toString(),
    })
  }

  const activity = payload.event?.activity
  if (Array.isArray(activity)) {
    for (const a of activity) {
      if (a.log) push({
        address: a.log.address,
        topics: a.log.topics ?? [],
        data: a.log.data ?? '',
        transactionHash: a.hash,
        blockNum: a.blockNum,
      })
    }
  }

  const blockLogs = payload.event?.data?.block?.logs
  const parentBlock = payload.event?.data?.block as { number?: number } | undefined
  if (Array.isArray(blockLogs)) {
    for (const log of blockLogs) {
      push({
        address: log.account?.address,
        topics: log.topics ?? [],
        data: log.data ?? '',
        transaction: log.transaction,
        block:
          log.block ??
          (parentBlock?.number != null ? { number: String(parentBlock.number) } : undefined),
      })
    }
  }

  return logs
}

// ---------------------------------------------------------------------------
// AssetRegistry RegistryEvent decoding via ethers.Interface (ABI-correct)
// ---------------------------------------------------------------------------

const assetRegistryIface = new Interface(AssetRegistryABI as InterfaceAbi)

/** Decoded RegistryEvent from your AssetRegistry contract */
export type DecodedRegistryEvent = {
  assetId: bigint
  type: string
  sender: string
  proofHash: string
  timestamp: bigint
  validator: string
  processId: string | undefined
  transactionHash: string | undefined
  blockNumber: string | undefined
}

/**
 * Decode a contract log using ethers.Interface.
 * Returns null if the log does not match RegistryEvent.
 * eventType is now a free-form string from the contract.
 * processId is converted from uint256 back to a MongoDB ObjectId hex string.
 */
export function decodeRegistryEventLog(log: ContractLog): DecodedRegistryEvent | null {
  const topics = log.topics ?? []
  const data = log.data ?? ''
  if (!data || topics.length === 0) return null

  const parsed = assetRegistryIface.parseLog({
    data: data as `0x${string}`,
    topics: topics as `0x${string}`[],
  })
  if (!parsed || parsed.name !== REGISTRY_EVENT_NAME) return null

  const args = parsed.args
  const eventType = args.eventType as string
  if (!eventType) return null

  const rawProcessId = args.processId as bigint | undefined
  const processId =
    rawProcessId && rawProcessId !== 0n
      ? rawProcessId.toString(16).padStart(24, '0')
      : undefined

  return {
    assetId: args.assetId,
    type: eventType,
    sender: args.sender,
    proofHash: args.proofHash,
    timestamp: args.timestamp,
    validator: args.validator,
    processId,
    transactionHash: log.transactionHash,
    blockNumber: log.blockNumber,
  }
}
