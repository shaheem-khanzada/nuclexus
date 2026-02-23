'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { templateKeys, createTemplate } from '@/lib/api'

type CreateTemplatePayload = {
  name: string
  type?: string
  description?: string
  creator: string
  roles?: { name: string; label: string }[]
  terms: {
    price: number
    currency?: string
    duration: number
    durationUnit: string
    deposit: number
    negotiable?: boolean
  }
}

export function useCreateTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTemplatePayload) => createTemplate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all })
    },
  })
}
