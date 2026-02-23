'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { processKeys, updateProcess } from '@/lib/api'
import type { Participant } from '@/lib/api'

type UpdatePayload = {
  id: string
  participants?: Participant[]
  agreedTerms?: {
    price?: number
    currency?: string
    duration?: number
    durationUnit?: string
    deposit?: number
  }
  negotiationDeadline?: string
}

export function useUpdateProcess() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: UpdatePayload) => updateProcess(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: processKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: processKeys.lists() })
    },
  })
}
