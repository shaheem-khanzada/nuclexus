import type { CollectionConfig } from 'payload'

export const ProcessTemplates: CollectionConfig = {
  slug: 'process-templates',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'processType', 'createdAt'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Name',
      admin: {
        description: 'e.g., "Rental"',
      },
    },
    {
      name: 'processType',
      type: 'text',
      required: true,
      label: 'Process Type',
      admin: {
        description: 'e.g., "rental"',
      },
    },
    {
      name: 'roles',
      type: 'array',
      label: 'Roles',
      required: true,
      fields: [
        {
          name: 'role',
          type: 'text',
        },
      ],
      admin: {
        description: 'owner, counterparty, validator, etc.',
      },
    },
    {
      name: 'steps',
      type: 'array',
      label: 'Steps',
      required: true,
      fields: [
        {
          name: 'stepId',
          type: 'text',
          required: true,
        },
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'actorRole',
          type: 'text',
          required: true,
          label: 'Actor Role',
        },
        {
          name: 'actionType',
          type: 'text',
          required: true,
          label: 'Action Type',
          admin: {
            description: 'claim, attestation, proof',
          },
        },
        {
          name: 'requiredProofTypes',
          type: 'array',
          label: 'Required Proof Types',
          fields: [
            {
              name: 'proofType',
              type: 'text',
            },
          ],
        },
        {
          name: 'optional',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'timeWindow',
      type: 'group',
      label: 'Time Window',
      fields: [
        {
          name: 'type',
          type: 'text',
          required: true,
          label: 'Type',
          admin: {
            description: 'fixed, flexible',
          },
        },
        {
          name: 'durationHours',
          type: 'number',
          required: true,
          label: 'Duration (Hours)',
        },
      ],
    },
  ],
}
