import type { CollectionConfig } from 'payload'

export const ProcessTemplates: CollectionConfig = {
  slug: 'process-templates',
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
