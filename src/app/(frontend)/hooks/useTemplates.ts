'use client'

import { useQuery } from '@tanstack/react-query'
import { templateKeys, fetchTemplates } from '@/lib/api'

export function useTemplates(params: { creator?: string; type?: string } = {}) {
  return useQuery({
    queryKey: templateKeys.list(params),
    queryFn: () => fetchTemplates(params),
  })
}
