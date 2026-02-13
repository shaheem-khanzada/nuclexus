import type { CollectionConfig } from 'payload'

export const Processes: CollectionConfig = {
  slug: 'processes',
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
