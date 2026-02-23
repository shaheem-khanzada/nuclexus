import type { CollectionConfig } from 'payload'

export const Assets: CollectionConfig = {
  slug: 'assets',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['assetId', 'title', 'creator', 'latestProofHash', 'updatedAt'],
  },
  fields: [
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
    {
      name: 'latestProofHash',
      type: 'text',
      admin: { description: 'Updated from on-chain events (e.g. PROOF_SUBMITTED).' },
    },
    {
      name: 'url',
      type: 'text',
      admin: { description: 'URL of uploaded proof/file (from upload API).' },
    },
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
      fields: [{ name: 'tag', type: 'text' }],
    },
  ],
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
  },
  timestamps: true,
}
