'use client'

import { useQuery } from '@tanstack/react-query'
import { templateKeys, fetchTemplate } from '@/lib/api'

export function useTemplate(id: string | null | undefined) {
  return useQuery({
    queryKey: templateKeys.detail(id!),
    queryFn: () => fetchTemplate(id!),
    enabled: !!id,
  })
}
