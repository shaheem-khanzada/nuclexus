/** Asset list item (from GET /api/assets or Payload docs) */
export type AssetItem = {
  id: string
  assetId: number
  creator: string
  title?: string
  description?: string
  category?: string
  tags?: string[] | Array<{ tag: string }>
  url?: string
  latestProofHash?: string
  createdAt: string
  updatedAt?: string
}

/** Event (universal — supports both on-chain and off-chain) */
export type EventItem = {
  id: string
  type: string
  source: 'on-chain' | 'off-chain'
  assetId: number
  processId?: string
  sender: string
  proofHash?: string
  timestamp: number
  validator?: string
  transactionHash?: string
  blockNumber?: string
  metadata?: Record<string, unknown>
  createdAt: string
}

/** @deprecated Use EventItem instead */
export type AssetEvent = EventItem

/** Single asset with events */
export type AssetDetail = {
  asset: Omit<AssetItem, 'tags'> & { tags?: string[] }
  events: EventItem[]
}

/** Terms group (shared between Template and Process) */
export type TermsData = {
  price: number
  currency?: string
  duration: number
  durationUnit: 'hours' | 'days' | 'weeks' | 'months'
  deposit: number
  negotiable?: boolean
}

/** Role definition within a template */
export type RoleDefinition = {
  name: string
  label: string
}

/** Template list item */
export type TemplateItem = {
  id: string
  name: string
  type: string
  description?: string
  creator: string
  roles: RoleDefinition[]
  terms: TermsData
  createdAt: string
  updatedAt?: string
}

/** Participant in a process (role + wallet address) */
export type Participant = {
  role: string
  address: string
}

/** Process list item */
export type ProcessItem = {
  id: string
  assetId: number
  template: string | TemplateItem
  owner: string
  participants: Participant[]
  status: string
  agreedTerms?: Omit<TermsData, 'negotiable'>
  negotiationDeadline?: string
  startDate?: string
  endDate?: string
  depositResolution?: 'returned' | 'partial' | 'withheld'
  createdAt: string
  updatedAt?: string
}

/** Process detail with events */
export type ProcessDetail = {
  process: ProcessItem
  events: EventItem[]
}

/** Payload REST list response shape */
export type AssetsResponse = {
  docs?: AssetItem[]
  error?: string
}

/** Tx payload returned by create / submit-proof / verify APIs */
export type TxPayload = {
  tx: { to: string; data: string; value?: string }
  contractAddress?: string
  assetId?: number
  description?: string
}

/** Upload API response */
export type UploadResponse = {
  path: string
  url: string
  hash: string
  size: number
  name: string
}
