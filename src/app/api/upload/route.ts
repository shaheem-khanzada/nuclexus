import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { keccak256 } from 'viem'

export const dynamic = 'force-dynamic'

// TODO: Replace filesystem storage with S3. If S3 provides encryption (e.g. SSE-S3), use it
// so we don't need to encrypt ourselves. For now files are stored in ./uploads.

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200) || 'file'
}

/**
 * POST /api/upload
 * Accepts multipart form with field "file". Saves to filesystem (TODO: S3).
 * Computes keccak256 hash of file contents for on-chain proof anchoring.
 * Returns { path, url, hash, size, name }.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return Response.json({ error: 'Missing or invalid file field' }, { status: 400 })
    }

    await mkdir(UPLOAD_DIR, { recursive: true })

    const base = sanitizeFileName(file.name)
    const ext = path.extname(base) || path.extname(file.name)
    const name = path.basename(base, ext)
    const unique = `${name}_${Date.now()}${ext}`
    const filePath = path.join(UPLOAD_DIR, unique)

    const bytes = new Uint8Array(await file.arrayBuffer())
    const hash = keccak256(bytes)
    await writeFile(filePath, bytes)

    const relativePath = path.relative(process.cwd(), filePath)
    return Response.json({
      path: relativePath,
      url: `/api/upload/${unique}`,
      hash,
      size: file.size,
      name: file.name,
    })
  } catch (err) {
    console.error('[api/upload]', err)
    return Response.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 },
    )
  }
}
