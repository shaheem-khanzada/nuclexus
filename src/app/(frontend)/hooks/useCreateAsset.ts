'use client'

import { useEffect, useState } from 'react'
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'
import { parseEventLogs } from 'viem'
import { AssetRegistryABI } from '@/lib/contracts'
import { fetchCreateAssetTx } from '@/lib/api'

export function useCreateAsset() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdAssetId, setCreatedAssetId] = useState<string | null>(null)
  const { sendTransactionAsync } = useSendTransaction()
  const [hash, setHash] = useState<`0x${string}` | undefined>()
  const { data: receipt, isLoading: confirming, isSuccess: confirmed } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (!confirmed || !receipt?.logs?.length) return
    try {
      const parsed = parseEventLogs({
        abi: AssetRegistryABI,
        logs: receipt.logs,
        eventName: 'RegistryEvent',
      })
      const created = parsed.find((e) => e.args.eventType === 'CREATED')
      if (created?.args?.assetId != null) {
        setCreatedAssetId(String(created.args.assetId))
      }
    } catch {
      // ignore
    }
  }, [confirmed, receipt])

  const create = async (eventType?: string) => {
    setError(null)
    setCreatedAssetId(null)
    setLoading(true)
    try {
      const data = await fetchCreateAssetTx(eventType)
      const txHash = await sendTransactionAsync({
        to: data.tx.to as `0x${string}`,
        data: data.tx.data as `0x${string}`,
        value: BigInt(data.tx.value ?? 0),
      })
      setHash(txHash)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transaction failed')
    } finally {
      setLoading(false)
    }
  }

  return { create, loading: loading || confirming, error, hash, confirmed, createdAssetId }
}
