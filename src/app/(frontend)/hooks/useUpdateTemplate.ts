'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { templateKeys, updateTemplate } from '@/lib/api'

type UpdatePayload = {
  id: string
  name?: string
  description?: string
  roles?: { name: string; label: string }[]
  terms?: {
    price?: number
    currency?: string
    duration?: number
    durationUnit?: string
    deposit?: number
    negotiable?: boolean
  }
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: UpdatePayload) => updateTemplate(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all })
      queryClient.invalidateQueries({ queryKey: templateKeys.detail(variables.id) })
    },
  })
}
