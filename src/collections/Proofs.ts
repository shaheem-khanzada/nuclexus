import type { CollectionConfig } from 'payload'

export const Proofs: CollectionConfig = {
  slug: 'proofs',
  admin: {
    useAsTitle: 'type',
    defaultColumns: ['type', 'submittedBy', 'role', 'process', 'createdAt'],
  },
  fields: [
    // Who submitted
    {
      name: 'submittedBy',
      type: 'text',
      required: true,
      label: 'Submitted By (Wallet)',
      index: true,
    },
    {
      name: 'role',
      type: 'text',
      required: true,
      label: 'Role',
      admin: {
        description: 'owner, counterparty, validator, etc.',
      },
    },
    // Process context
    {
      name: 'process',
      type: 'relationship',
      relationTo: 'processes',
      required: false,
    },
    // Proof structure
    {
      name: 'type',
      type: 'text',
      required: true,
      label: 'Proof Type',
      admin: {
        description: 'photo, video, document, bundle',
      },
    },
    {
      name: 'tags',
      type: 'array',
      label: 'Tags',
      admin: {
        description: 'multi-angle, context-shot, etc.',
      },
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
    },
    // Storage
    {
      name: 'url',
      type: 'text',
      required: true,
      label: 'Encrypted File URL',
    },
    // Integrity
    {
      name: 'hash',
      type: 'text',
      required: true,
      label: 'Original Hash',
      admin: {
        description: 'keccak256(original file)',
      },
      index: true,
    },
    {
      name: 'txHash',
      type: 'text',
      required: true,
      label: 'Transaction Hash',
      index: true,
    },
  ],
}
