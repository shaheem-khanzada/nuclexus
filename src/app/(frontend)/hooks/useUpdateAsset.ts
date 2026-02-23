'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { assetKeys, updateAsset } from '@/lib/api'

type UpdatePayload = {
  assetId: number
  title?: string
  description?: string
  category?: string
  tags?: string[]
  url?: string
  creatorWallet?: string
}

export function useUpdateAsset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdatePayload) => updateAsset(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: assetKeys.all })
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(variables.assetId) })
    },
  })
}
