import type { CollectionConfig } from 'payload'

export const Templates: CollectionConfig = {
  slug: 'templates',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'type', 'creator', 'updatedAt'],
    description: 'Reusable service blueprints (rental, lease, etc.). A Process is created from a Template.',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'rental',
      options: [
        { label: 'Rental', value: 'rental' },
      ],
      admin: { description: 'Service type. Add more options as new services are introduced.' },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'roles',
      type: 'array',
      required: true,
      defaultValue: [
        { name: 'owner', label: 'Owner' },
        { name: 'renter', label: 'Renter' },
        { name: 'validator', label: 'Validator' },
        { name: 'witness', label: 'Witness' },
      ],
      admin: { description: 'Roles required for this process type. Each participant is assigned a role.' },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'label', type: 'text', required: true },
      ],
    },
    {
      name: 'creator',
      type: 'text',
      required: true,
      index: true,
      admin: { description: 'Wallet address of the template author.' },
    },
    {
      name: 'terms',
      type: 'group',
      fields: [
        {
          name: 'price',
          type: 'number',
          required: true,
          min: 0,
        },
        {
          name: 'currency',
          type: 'text',
          defaultValue: 'ETH',
        },
        {
          name: 'duration',
          type: 'number',
          required: true,
          min: 1,
        },
        {
          name: 'durationUnit',
          type: 'select',
          required: true,
          defaultValue: 'days',
          options: [
            { label: 'Hours', value: 'hours' },
            { label: 'Days', value: 'days' },
            { label: 'Weeks', value: 'weeks' },
            { label: 'Months', value: 'months' },
          ],
        },
        {
          name: 'deposit',
          type: 'number',
          required: true,
          min: 0,
        },
        {
          name: 'negotiable',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
  ],
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
  },
  timestamps: true,
}
