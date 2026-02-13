import type { CollectionConfig } from 'payload'

export const Assets: CollectionConfig = {
  slug: 'assets',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'type', 'status', 'createdAt'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'type',
      type: 'text',
    },
    {
      name: 'status',
      type: 'text',
    },
  ],
}
