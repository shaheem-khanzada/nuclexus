'use client'

import { useState } from 'react'
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'
import { fetchVerifyAssetTx } from '@/lib/api'

export function useVerifyAsset() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { sendTransactionAsync } = useSendTransaction()
  const [hash, setHash] = useState<`0x${string}` | undefined>()
  const { isLoading: confirming, isSuccess: confirmed } = useWaitForTransactionReceipt({ hash })

  const verify = async (assetId: number, proofHash: string, eventType?: string, processId?: string) => {
    setError(null)
    setLoading(true)
    try {
      const data = await fetchVerifyAssetTx(assetId, proofHash, eventType, processId)
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

  return { verify, loading: loading || confirming, error, hash, confirmed }
}
