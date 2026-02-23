import type { CollectionConfig } from 'payload'

export const PROCESS_STATUSES = [
  'DRAFT',
  'PENDING_RENTER',
  'NEGOTIATING',
  'TERMS_AGREED',
  'DEPOSIT_PENDING',
  'DEPOSIT_DECLARED',
  'ACTIVE',
  'RETURN_PENDING',
  'RETURN_VERIFIED',
  'DEPOSIT_RESOLVING',
  'COMPLETED',
  'REJECTED',
] as const

export type ProcessStatus = (typeof PROCESS_STATUSES)[number]

export const Processes: CollectionConfig = {
  slug: 'processes',
  admin: {
    useAsTitle: 'status',
    defaultColumns: ['assetId', 'status', 'owner', 'updatedAt'],
    description: 'Active instance of a Template applied to an Asset. Tracks the full lifecycle.',
  },
  fields: [
    {
      name: 'assetId',
      type: 'number',
      required: true,
      index: true,
    },
    {
      name: 'template',
      type: 'relationship',
      relationTo: 'templates',
      required: true,
    },
    {
      name: 'owner',
      type: 'text',
      required: true,
      index: true,
      admin: { description: 'Wallet address of the asset owner who initiated the process.' },
    },
    {
      name: 'participants',
      type: 'array',
      required: true,
      admin: { description: 'Role-to-wallet mapping. Every template role must be assigned an address.' },
      fields: [
        { name: 'role', type: 'text', required: true },
        { name: 'address', type: 'text', required: true },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'DRAFT',
      options: PROCESS_STATUSES.map((s) => ({ label: s.replace(/_/g, ' '), value: s })),
      index: true,
    },
    {
      name: 'agreedTerms',
      type: 'group',
      admin: { description: 'Snapshot of the final negotiated terms.' },
      fields: [
        { name: 'price', type: 'number' },
        { name: 'currency', type: 'text' },
        { name: 'duration', type: 'number' },
        {
          name: 'durationUnit',
          type: 'select',
          options: [
            { label: 'Hours', value: 'hours' },
            { label: 'Days', value: 'days' },
            { label: 'Weeks', value: 'weeks' },
            { label: 'Months', value: 'months' },
          ],
        },
        { name: 'deposit', type: 'number' },
      ],
    },
    {
      name: 'negotiationDeadline',
      type: 'date',
      admin: { description: 'Deadline for negotiation window (if negotiable).' },
    },
    {
      name: 'startDate',
      type: 'date',
      admin: { description: 'Set when rental becomes ACTIVE.' },
    },
    {
      name: 'endDate',
      type: 'date',
      admin: { description: 'Computed from startDate + agreed duration when ACTIVE.' },
    },
    {
      name: 'depositResolution',
      type: 'select',
      options: [
        { label: 'Returned', value: 'returned' },
        { label: 'Partial', value: 'partial' },
        { label: 'Withheld', value: 'withheld' },
      ],
      admin: { description: 'Set by owner when resolving deposit at end of rental.' },
    },
  ],
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
  },
  timestamps: true,
}
