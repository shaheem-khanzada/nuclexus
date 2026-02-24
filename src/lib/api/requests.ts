import { payloadQueryString } from '@/lib/payload-query'
import type {
  AssetDetail,
  AssetItem,
  AssetsResponse,
  EventItem,
  Participant,
  ProcessDetail,
  ProcessItem,
  TemplateItem,
  TxPayload,
  UploadResponse,
} from './types'

/** Payload REST GET /api/assets with optional where[creator][equals] */
export async function fetchAssets(params: {
  creator?: string
  sort?: string
  limit?: number
}): Promise<AssetItem[]> {
  const query = payloadQueryString({
    ...(params.creator ? { where: { creator: { equals: params.creator } } } : {}),
    sort: params.sort ?? '-createdAt',
    limit: params.limit ?? 100,
  })
  const res = await fetch(`/api/assets?${query}`)
  const data: AssetsResponse = await res.json()
  if (data.error) throw new Error(data.error)
  const list = data.docs ?? []
  return list as AssetItem[]
}

/** Payload REST: GET /api/assets by assetId + GET /api/events by assetId, then combine */
export async function fetchAsset(assetId: number): Promise<AssetDetail> {
  const assetsQuery = payloadQueryString({
    where: { assetId: { equals: assetId } },
    limit: 1,
  })
  const assetsRes = await fetch(`/api/assets?${assetsQuery}`)
  const assetsData = await assetsRes.json()
  if (!assetsRes.ok) throw new Error(assetsData.error ?? 'Failed to fetch')
  const docs = assetsData.docs ?? []
  const assetDoc = docs[0]
  if (!assetDoc) throw new Error('Asset not found')

  const eventsQuery = payloadQueryString({
    where: { assetId: { equals: assetId } },
    sort: '-createdAt',
    limit: 100,
  })
  const eventsRes = await fetch(`/api/events?${eventsQuery}`)
  const eventsData = await eventsRes.json()
  const eventDocs = eventsData.docs ?? []

  const asset = {
    id: assetDoc.id,
    assetId: assetDoc.assetId,
    creator: assetDoc.creator,
    title: assetDoc.title ?? undefined,
    description: assetDoc.description ?? undefined,
    category: assetDoc.category ?? undefined,
    tags: Array.isArray(assetDoc.tags)
      ? assetDoc.tags.map((t: { tag?: string | null }) => (t?.tag != null ? t.tag : ''))
      : [],
    url: assetDoc.url ?? undefined,
    latestProofHash: assetDoc.latestProofHash ?? undefined,
    createdAt: assetDoc.createdAt,
    updatedAt: assetDoc.updatedAt,
  }
  const events = eventDocs.map(normalizeEvent)
  return { asset, events }
}

/** Payload custom GET /api/tx/create-asset */
export async function fetchCreateAssetTx(eventType?: string): Promise<TxPayload> {
  const params = eventType ? `?eventType=${encodeURIComponent(eventType)}` : ''
  const res = await fetch(`/api/tx/create-asset${params}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Failed to get tx')
  return data as TxPayload
}

/** Payload custom POST /api/tx/submit-proof */
export async function fetchSubmitProofTx(
  assetId: number,
  proofHash: string,
  eventType?: string,
  processId?: string,
): Promise<TxPayload> {
  const res = await fetch('/api/tx/submit-proof', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assetId, proofHash, eventType, processId }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Failed to get tx')
  return data as TxPayload
}

/** Payload custom POST /api/tx/verify */
export async function fetchVerifyAssetTx(
  assetId: number,
  proofHash: string,
  eventType?: string,
  processId?: string,
): Promise<TxPayload> {
  const res = await fetch('/api/tx/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assetId, proofHash, eventType, processId }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Failed to get tx')
  return data as TxPayload
}

/** Payload REST: find asset by assetId, then PATCH /api/assets/:id or POST /api/assets if not found */
export async function updateAsset(payload: {
  assetId: number
  title?: string
  description?: string
  category?: string
  tags?: string[]
  url?: string
  creatorWallet?: string
}): Promise<{ ok: boolean; updated?: boolean; created?: boolean; id?: string }> {
  const { assetId, creatorWallet, url, title, description, category, tags } = payload
  const query = payloadQueryString({
    where: { assetId: { equals: assetId } },
    limit: 1,
  })
  const findRes = await fetch(`/api/assets?${query}`)
  const findData = await findRes.json()
  const docs = findData.docs ?? []
  const existing = docs[0]

  const data: Record<string, unknown> = {}
  if (url !== undefined) data.url = url
  if (title !== undefined) data.title = title
  if (description !== undefined) data.description = description
  if (category !== undefined) data.category = category
  if (Array.isArray(tags)) data.tags = tags.map((tag) => ({ tag }))

  if (existing) {
    const patchRes = await fetch(`/api/assets/${existing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await patchRes.json()
    if (!patchRes.ok) throw new Error(json.errors?.[0]?.message ?? json.message ?? 'Update failed')
    return { ok: true, updated: true, id: existing.id }
  }

  if (!creatorWallet?.trim()) {
    throw new Error('Asset not found. creatorWallet required to create.')
  }
  const createRes = await fetch('/api/assets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      assetId,
      creator: creatorWallet.trim(),
      ...data,
    }),
  })
  const createJson = await createRes.json()
  if (!createRes.ok) throw new Error(createJson.errors?.[0]?.message ?? createJson.message ?? 'Update failed')
  return { ok: true, created: true, id: createJson.doc?.id ?? createJson.id }
}

export async function uploadFile(file: File, processId?: string): Promise<UploadResponse> {
  const form = new FormData()
  form.append('file', file)
  const payload: Record<string, unknown> = { alt: file.name }
  if (processId) payload.process = processId
  form.append('_payload', JSON.stringify(payload))
  const res = await fetch('/api/media', { method: 'POST', body: form })
  const data = await res.json()
  if (!res.ok) throw new Error(data.errors?.[0]?.message ?? 'Upload failed')
  const doc = data.doc ?? data
  return {
    id: doc.id,
    url: doc.url,
    hash: doc.hash,
    size: doc.filesize,
    name: doc.filename,
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeEvent(e: Record<string, unknown>): EventItem {
  return {
    id: e.id as string,
    type: e.type as string,
    source: (e.source as 'on-chain' | 'off-chain') ?? 'on-chain',
    assetId: e.assetId as number,
    processId: (e.processId as string) ?? undefined,
    sender: e.sender as string,
    proofHash: (e.proofHash as string) ?? undefined,
    timestamp: e.timestamp as number,
    transactionHash: (e.transactionHash as string) ?? undefined,
    blockNumber: (e.blockNumber as string) ?? undefined,
    metadata: (e.metadata as Record<string, unknown>) ?? undefined,
    createdAt: e.createdAt as string,
  }
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export async function fetchTemplates(params: {
  creator?: string
  type?: string
  limit?: number
} = {}): Promise<TemplateItem[]> {
  const where: Record<string, unknown> = {}
  if (params.creator) where.creator = { equals: params.creator }
  if (params.type) where.type = { equals: params.type }
  const query = payloadQueryString({
    ...(Object.keys(where).length ? { where } : {}),
    sort: '-createdAt',
    limit: params.limit ?? 100,
  })
  const res = await fetch(`/api/templates?${query}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Failed to fetch templates')
  return (data.docs ?? []) as TemplateItem[]
}

export async function fetchTemplate(id: string): Promise<TemplateItem> {
  const res = await fetch(`/api/templates/${id}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Template not found')
  return data as TemplateItem
}

export async function createTemplate(payload: {
  name: string
  type?: string
  description?: string
  creator: string
  roles?: { name: string; label: string }[]
  terms: {
    price: number
    currency?: string
    duration: number
    durationUnit: string
    deposit: number
    negotiable?: boolean
  }
}): Promise<TemplateItem> {
  const res = await fetch('/api/templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.errors?.[0]?.message ?? data.message ?? 'Create failed')
  return (data.doc ?? data) as TemplateItem
}

export async function updateTemplate(
  id: string,
  payload: {
    name?: string
    description?: string
    roles?: { name: string; label: string }[]
    terms?: {
      price?: number
      currency?: string
      duration?: number
      durationUnit?: string
      deposit?: number
      negotiable?: boolean
    }
  },
): Promise<TemplateItem> {
  const res = await fetch(`/api/templates/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.errors?.[0]?.message ?? data.message ?? 'Update failed')
  return (data.doc ?? data) as TemplateItem
}

// ---------------------------------------------------------------------------
// Processes
// ---------------------------------------------------------------------------

export async function fetchProcesses(params: {
  assetId?: number
  owner?: string
  participantAddress?: string
  status?: string
  limit?: number
} = {}): Promise<ProcessItem[]> {
  const where: Record<string, unknown> = {}
  if (params.assetId != null) where.assetId = { equals: params.assetId }
  if (params.owner) where.owner = { equals: params.owner }
  if (params.participantAddress) where['participants.address'] = { equals: params.participantAddress }
  if (params.status) where.status = { equals: params.status }
  const query = payloadQueryString({
    ...(Object.keys(where).length ? { where } : {}),
    sort: '-createdAt',
    limit: params.limit ?? 100,
    depth: 1,
  })
  const res = await fetch(`/api/processes?${query}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Failed to fetch processes')
  return (data.docs ?? []) as ProcessItem[]
}

export async function fetchProcess(id: string): Promise<ProcessDetail> {
  const processRes = await fetch(`/api/processes/${id}?depth=1`)
  const processData = await processRes.json()
  if (!processRes.ok) throw new Error(processData.error ?? 'Process not found')

  const eventsQuery = payloadQueryString({
    where: { processId: { equals: id } },
    sort: '-createdAt',
    limit: 200,
  })
  const eventsRes = await fetch(`/api/events?${eventsQuery}`)
  const eventsData = await eventsRes.json()
  const eventDocs = eventsData.docs ?? []

  return {
    process: processData as ProcessItem,
    events: eventDocs.map(normalizeEvent),
  }
}

export async function createProcess(payload: {
  assetId: number
  template: string
  owner: string
  participants: Participant[]
}): Promise<ProcessItem> {
  const res = await fetch('/api/processes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, status: 'DRAFT' }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.errors?.[0]?.message ?? data.message ?? 'Create failed')
  return (data.doc ?? data) as ProcessItem
}

export async function updateProcess(
  id: string,
  payload: {
    participants?: Participant[]
    agreedTerms?: {
      price?: number
      currency?: string
      duration?: number
      durationUnit?: string
      deposit?: number
    }
    negotiationDeadline?: string
  },
): Promise<ProcessItem> {
  const res = await fetch(`/api/processes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.errors?.[0]?.message ?? data.message ?? 'Update failed')
  return (data.doc ?? data) as ProcessItem
}

/** Create an off-chain event tied to a process. The afterChange hook updates the process status. */
export async function addProcessEvent(payload: {
  type: string
  assetId: number
  processId: string
  sender: string
  metadata?: Record<string, unknown>
}): Promise<EventItem> {
  const res = await fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      source: 'off-chain',
      timestamp: Math.floor(Date.now() / 1000),
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.errors?.[0]?.message ?? data.message ?? 'Event creation failed')
  return normalizeEvent(data.doc ?? data)
}
