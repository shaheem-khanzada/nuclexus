import qs from 'qs'

/**
 * Build Payload REST API query string (where, sort, limit, page, depth, etc.).
 * Use with: fetch(`/api/assets?${payloadQueryString(params)}`)
 */
export function payloadQueryString(params: {
  where?: Record<string, unknown>
  sort?: string
  limit?: number
  page?: number
  depth?: number
  [key: string]: unknown
}): string {
  return qs.stringify(params, {
    encode: true,
    allowDots: false,
    arrayFormat: 'brackets',
  })
}
