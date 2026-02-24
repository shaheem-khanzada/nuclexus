import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import { keccak256 } from 'viem'

const computeFileHash: CollectionBeforeChangeHook = async ({ data, req }) => {
  if (req.file?.data) {
    const bytes = new Uint8Array(req.file.data)
    data.hash = keccak256(bytes)
  }
  return data
}

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
    create: () => true,
  },
  hooks: {
    beforeChange: [computeFileHash],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'hash',
      type: 'text',
      admin: { readOnly: true },
    },
    {
      name: 'process',
      type: 'relationship',
      relationTo: 'processes',
      admin: { readOnly: true },
    },
  ],
  upload: true,
}
