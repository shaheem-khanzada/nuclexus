import { Interface, type InterfaceAbi } from 'ethers'

import { AssetRegistryABI } from './abis/AssetRegistry'
import { EVENT_TYPES } from '@/lib/constants/eventTypes'

const iface = new Interface(AssetRegistryABI as InterfaceAbi)

export type TxPayload = {
  to: string
  data: string
  value: string
}

export function encodeCreateAsset(
  contractAddress: string,
  eventType: string = EVENT_TYPES.CREATED,
): TxPayload {
  const data = iface.encodeFunctionData('createAsset', [eventType])
  return { to: contractAddress, data, value: '0' }
}

/**
 * Convert a MongoDB ObjectId hex string to uint256 for on-chain use.
 * Returns 0n when no processId is provided.
 */
export function mongoIdToUint256(id?: string): bigint {
  if (!id) return 0n
  return BigInt('0x' + id)
}

/** Convert a uint256 back to a 24-char hex MongoDB ObjectId string. Returns undefined for 0. */
export function uint256ToMongoId(value: bigint): string | undefined {
  if (value === 0n) return undefined
  return value.toString(16).padStart(24, '0')
}

export function encodeSubmitProof(
  contractAddress: string,
  assetId: number | bigint,
  proofHash: string,
  eventType: string = EVENT_TYPES.PROOF_SUBMITTED,
  processId?: string,
): TxPayload {
  const hash = proofHash.startsWith('0x') ? proofHash : '0x' + proofHash
  if (hash.length !== 66) {
    throw new Error('proofHash must be 32 bytes (0x + 64 hex chars)')
  }
  const pid = mongoIdToUint256(processId)
  const data = iface.encodeFunctionData('submitProof', [BigInt(assetId), hash, eventType, pid])
  return { to: contractAddress, data, value: '0' }
}

export function encodeVerifyAsset(
  contractAddress: string,
  assetId: number | bigint,
  proofHash: string,
  eventType: string = EVENT_TYPES.ATTESTATION,
  processId?: string,
): TxPayload {
  const hash = proofHash.startsWith('0x') ? proofHash : '0x' + proofHash
  if (hash.length !== 66) {
    throw new Error('proofHash must be 32 bytes (0x + 64 hex chars)')
  }
  const pid = mongoIdToUint256(processId)
  const data = iface.encodeFunctionData('verifyAsset', [BigInt(assetId), hash, eventType, pid])
  return { to: contractAddress, data, value: '0' }
}
