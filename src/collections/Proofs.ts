import type { CollectionConfig } from 'payload'

export const Proofs: CollectionConfig = {
  slug: 'proofs',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'status', 'createdAt'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'status',
      type: 'text',
    },
  ],
}
