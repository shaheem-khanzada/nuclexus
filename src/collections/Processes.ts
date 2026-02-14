import type { CollectionConfig } from 'payload'

export const Processes: CollectionConfig = {
  slug: 'processes',
  admin: {
    useAsTitle: 'type',
    defaultColumns: ['type', 'softStatus', 'template', 'createdAt'],
  },
  fields: [
    {
      name: 'type',
      type: 'text',
      required: true,
      label: 'Process Type',
      admin: {
        description: 'e.g., "rental"',
      },
    },
    {
      name: 'template',
      type: 'relationship',
      relationTo: 'process-templates',
      required: false,
      label: 'Template',
    },
    {
      name: 'assets',
      type: 'relationship',
      relationTo: 'assets',
      hasMany: true,
      label: 'Related Assets',
    },
    {
      name: 'participants',
      type: 'group',
      label: 'Participants',
      fields: [
        {
          name: 'owner',
          type: 'text',
          label: 'Owner (Wallet)',
        },
        {
          name: 'counterparty',
          type: 'text',
          label: 'Counterparty (Wallet)',
        },
        {
          name: 'validator',
          type: 'text',
          label: 'Validator (Wallet)',
        },
        {
          name: 'witness',
          type: 'text',
          label: 'Witness (Wallet)',
        },
      ],
    },
    // Append-only action log
    {
      name: 'events',
      type: 'array',
      label: 'Events',
      admin: {
        description: 'Append-only action log',
      },
      fields: [
        {
          name: 'stepId',
          type: 'text',
          required: true,
        },
        {
          name: 'actor',
          type: 'text',
          required: true,
          label: 'Actor (Wallet)',
        },
        {
          name: 'role',
          type: 'text',
          required: true,
        },
        {
          name: 'actionType',
          type: 'text',
          required: true,
          label: 'Action Type',
          admin: {
            description: 'claim, attestation, etc.',
          },
        },
        {
          name: 'proofId',
          type: 'relationship',
          relationTo: 'proofs',
          required: false,
          label: 'Proof',
        },
        {
          name: 'timestamp',
          type: 'date',
          required: true,
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
      ],
    },
    {
      name: 'softStatus',
      type: 'text',
      required: true,
      label: 'Status',
      admin: {
        description: 'active, completed, disputed, expired',
      },
    },
    {
      name: 'timeWindow',
      type: 'group',
      label: 'Time Window',
      fields: [
        {
          name: 'start',
          type: 'date',
          required: true,
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
        {
          name: 'end',
          type: 'date',
          required: true,
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
      ],
    },
  ],
  timestamps: true,
}
