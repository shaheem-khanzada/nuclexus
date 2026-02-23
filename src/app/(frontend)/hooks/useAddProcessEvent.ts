'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { processKeys, addProcessEvent } from '@/lib/api'

type AddEventPayload = {
  type: string
  assetId: number
  processId: string
  sender: string
  metadata?: Record<string, unknown>
}

export function useAddProcessEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AddEventPayload) => addProcessEvent(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: processKeys.detail(variables.processId) })
      queryClient.invalidateQueries({ queryKey: processKeys.lists() })
    },
  })
}
