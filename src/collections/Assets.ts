import type { CollectionConfig } from 'payload'

export const Assets: CollectionConfig = {
  slug: 'assets',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['assetId', 'title', 'creatorWallet', 'category', 'createdAt'],
  },
  fields: [
    // On-chain reference
    {
      name: 'assetId',
      type: 'number',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'creator',
      type: 'text',
      required: true,
      index: true,
    },
    // Optional display metadata
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'category',
      type: 'text',
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
    },
  ],
}
