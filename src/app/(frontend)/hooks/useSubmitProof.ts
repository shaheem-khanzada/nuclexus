'use client'

import { useState } from 'react'
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'
import { fetchSubmitProofTx } from '@/lib/api'

export function useSubmitProof() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { sendTransactionAsync } = useSendTransaction()
  const [hash, setHash] = useState<`0x${string}` | undefined>()
  const { isLoading: confirming, isSuccess: confirmed } = useWaitForTransactionReceipt({ hash })

  const submit = async (assetId: number, proofHash: string, eventType?: string, processId?: string) => {
    setError(null)
    setLoading(true)
    try {
      const data = await fetchSubmitProofTx(assetId, proofHash, eventType, processId)
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

  return { submit, loading: loading || confirming, error, hash, confirmed }
}
