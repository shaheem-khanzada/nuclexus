'use client'

import { useQuery } from '@tanstack/react-query'
import { assetKeys, fetchAsset } from '@/lib/api'

export function useAsset(assetId: number | string | null | undefined) {
  const id = assetId == null ? null : typeof assetId === 'string' ? parseInt(assetId, 10) : assetId
  const valid = id !== null && !Number.isNaN(id)
  return useQuery({
    queryKey: assetKeys.detail(id!),
    queryFn: () => fetchAsset(id!),
    enabled: valid,
  })
}
