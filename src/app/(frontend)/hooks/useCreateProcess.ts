'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { processKeys, createProcess } from '@/lib/api'
import type { Participant } from '@/lib/api'

type CreateProcessPayload = {
  assetId: number
  template: string
  owner: string
  participants: Participant[]
}

export function useCreateProcess() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateProcessPayload) => createProcess(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: processKeys.all })
    },
  })
}
