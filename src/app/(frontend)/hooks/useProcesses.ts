'use client'

import { useQuery } from '@tanstack/react-query'
import { processKeys, fetchProcesses } from '@/lib/api'

export function useProcesses(params: {
  assetId?: number
  owner?: string
  participantAddress?: string
  status?: string
  enabled?: boolean
} = {}) {
  const { enabled = true, ...rest } = params
  return useQuery({
    queryKey: processKeys.list(rest),
    queryFn: () => fetchProcesses(rest),
    enabled,
  })
}
