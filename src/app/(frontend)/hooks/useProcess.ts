'use client'

import { useQuery } from '@tanstack/react-query'
import { processKeys, fetchProcess } from '@/lib/api'

export function useProcess(id: string | null | undefined) {
  return useQuery({
    queryKey: processKeys.detail(id!),
    queryFn: () => fetchProcess(id!),
    enabled: !!id,
  })
}
