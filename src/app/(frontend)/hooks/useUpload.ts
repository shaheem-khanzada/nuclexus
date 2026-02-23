'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { assetKeys, uploadFile } from '@/lib/api'

export function useUpload() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => uploadFile(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.all })
    },
  })
}
