'use client'

import { useQuery } from '@tanstack/react-query'
import { assetKeys, fetchAssets } from '@/lib/api'

type UseAssetsParams = {
  creator?: string
  enabled?: boolean
}

export function useAssets(params: UseAssetsParams = {}) {
  const { creator, enabled = true } = params
  return useQuery({
    queryKey: assetKeys.list({ creator, sort: '-createdAt', limit: 100 }),
    queryFn: () => fetchAssets({ creator, sort: '-createdAt', limit: 100 }),
    enabled,
  })
}
