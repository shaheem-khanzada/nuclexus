import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { expireProcesses } from '@/tasks/expireProcesses'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return Response.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }

  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config: configPromise })
  const result = await expireProcesses(payload)
  return Response.json({ ok: true, ...result })
}
