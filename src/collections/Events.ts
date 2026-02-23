import type { CollectionConfig } from 'payload'
import { eventsSyncAssetAfterChange, eventsSyncProcessAfterChange } from './hooks'

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'type',
    defaultColumns: ['type', 'source', 'assetId', 'processId', 'sender', 'transactionHash', 'createdAt'],
    description: 'Immutable event log. On-chain events arrive via Alchemy webhook; off-chain events are created directly.',
  },
  hooks: {
    afterChange: [eventsSyncAssetAfterChange, eventsSyncProcessAfterChange],
  },
  access: {
    read: () => true,
    create: () => true,
  },
  fields: [
    {
      name: 'type',
      type: 'text',
      required: true,
      index: true,
      admin: { description: 'Free-form event type string (e.g. CREATED, PROOF_SUBMITTED, HANDOVER_PROOF, INCIDENT).' },
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'on-chain',
      options: [
        { label: 'On-chain', value: 'on-chain' },
        { label: 'Off-chain', value: 'off-chain' },
      ],
      index: true,
    },
    {
      name: 'assetId',
      type: 'number',
      required: true,
      index: true,
    },
    {
      name: 'processId',
      type: 'text',
      index: true,
      admin: { description: 'Payload document ID of the Process this event belongs to (optional).' },
    },
    {
      name: 'sender',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'proofHash',
      type: 'text',
    },
    {
      name: 'timestamp',
      type: 'number',
      required: true,
    },
    {
      name: 'validator',
      type: 'text',
    },
    {
      name: 'transactionHash',
      type: 'text',
      index: true,
    },
    {
      name: 'blockNumber',
      type: 'text',
      index: true,
    },
    {
      name: 'metadata',
      type: 'json',
      admin: { description: 'Arbitrary data for this event (negotiation terms, incident details, deposit resolution, etc.).' },
    },
  ],
  timestamps: true,
}
