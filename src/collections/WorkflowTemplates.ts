import type { CollectionConfig } from 'payload'

export const WorkflowTemplates: CollectionConfig = {
  slug: 'workflow-templates',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'type', 'creator', 'updatedAt'],
    description: 'Experimental workflow-driven service blueprints. Each template defines stages composed of reusable action blocks.',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'type',
      type: 'text',
      required: true,
      defaultValue: 'rental',
      admin: { description: 'Service type identifier (e.g. rental, lending, escrow).' },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'creator',
      type: 'text',
      required: true,
      index: true,
      admin: { description: 'Wallet address of the template author.' },
    },
    {
      name: 'roles',
      type: 'array',
      required: true,
      admin: { description: 'Roles required for this workflow. Each participant is assigned a role.' },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'label', type: 'text', required: true },
      ],
    },
    {
      name: 'terms',
      type: 'group',
      admin: { description: 'Default terms for this service. Can be overridden during negotiation.' },
      fields: [
        { name: 'price', type: 'number', min: 0 },
        { name: 'currency', type: 'text', defaultValue: 'ETH' },
        { name: 'duration', type: 'number', min: 1 },
        {
          name: 'durationUnit',
          type: 'select',
          defaultValue: 'days',
          options: [
            { label: 'Hours', value: 'hours' },
            { label: 'Days', value: 'days' },
            { label: 'Weeks', value: 'weeks' },
            { label: 'Months', value: 'months' },
          ],
        },
        { name: 'deposit', type: 'number', min: 0 },
        { name: 'negotiable', type: 'checkbox', defaultValue: false },
        {
          name: 'negotiationDuration',
          type: 'number',
          defaultValue: 30,
          min: 1,
          admin: {
            description: 'Negotiation window in minutes.',
            condition: (data) => data?.terms?.negotiable === true,
          },
        },
      ],
    },
    {
      name: 'stages',
      type: 'array',
      required: true,
      admin: { description: 'Ordered workflow stages. Each stage defines available actions, roles, and transitions.' },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          admin: { description: 'Stage identifier used as process status (e.g. DRAFT, ACTIVE, COMPLETED).' },
        },
        {
          name: 'label',
          type: 'text',
          required: true,
          admin: { description: 'Human-readable stage name shown in the UI.' },
        },
        {
          name: 'actions',
          type: 'array',
          admin: { description: 'Action blocks available at this stage.' },
          fields: [
            {
              name: 'block',
              type: 'select',
              required: true,
              options: [
                { label: 'Confirm', value: 'confirm' },
                { label: 'Reject', value: 'reject' },
                { label: 'Upload Proof', value: 'upload_proof' },
                { label: 'Verify Proof', value: 'verify_proof' },
                { label: 'Negotiate Terms', value: 'negotiate_terms' },
                { label: 'Accept Terms', value: 'accept_terms' },
                { label: 'Declare Deposit', value: 'declare_deposit' },
                { label: 'Confirm Deposit', value: 'confirm_deposit' },
                { label: 'Resolve Deposit', value: 'resolve_deposit' },
                { label: 'Log Incident', value: 'log_incident' },
              ],
              admin: { description: 'The action block type.' },
            },
            {
              name: 'label',
              type: 'text',
              admin: { description: 'Custom button label (optional, falls back to block default).' },
            },
            {
              name: 'roles',
              type: 'json',
              required: true,
              admin: { description: 'Array of role names that can execute this action, e.g. ["owner", "renter"].' },
            },
            {
              name: 'eventType',
              type: 'text',
              admin: { description: 'Event type emitted when this action is executed (e.g. DEPOSIT_DECLARED).' },
            },
            {
              name: 'transitionsTo',
              type: 'text',
              admin: { description: 'Stage name to transition to on success. Leave blank for non-transitioning actions.' },
            },
            {
              name: 'requiresOnChain',
              type: 'checkbox',
              defaultValue: false,
              admin: { description: 'Whether this action triggers an on-chain transaction.' },
            },
          ],
        },
        {
          name: 'timeout',
          type: 'group',
          admin: { description: 'Optional auto-transition when time expires at this stage.' },
          fields: [
            {
              name: 'duration',
              type: 'number',
              min: 1,
              admin: { description: 'Timeout duration.' },
            },
            {
              name: 'unit',
              type: 'select',
              options: [
                { label: 'Minutes', value: 'minutes' },
                { label: 'Hours', value: 'hours' },
                { label: 'Days', value: 'days' },
              ],
            },
            {
              name: 'transitionsTo',
              type: 'text',
              admin: { description: 'Stage to transition to on timeout (e.g. EXPIRED).' },
            },
          ],
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
