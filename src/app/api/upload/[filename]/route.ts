import { readFile } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

/**
 * GET /api/upload/[filename]
 * Serves a file from filesystem uploads (TODO: S3).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params
  if (!filename || filename.includes('..')) {
    return new Response(null, { status: 400 })
  }
  try {
    const filePath = path.join(UPLOAD_DIR, path.basename(filename))
    const buf = await readFile(filePath)
    return new Response(buf, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    })
  } catch {
    return new Response(null, { status: 404 })
  }
}
