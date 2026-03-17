import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Assets } from './collections/Assets'
import { Events } from './collections/Events'
import { Media } from './collections/Media'
import { Processes } from './collections/Processes'
import { Templates } from './collections/Templates'
import { Users } from './collections/Users'
import { WorkflowTemplates } from './collections/WorkflowTemplates'
import { contractTxEndpoints } from './endpoints'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Assets, Events, Templates, Processes, WorkflowTemplates],
  endpoints: contractTxEndpoints,
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.MONGODB_URI || '',
  }),
  sharp,
  jobs: {
    tasks: [
      {
        slug: 'expireProcesses',
        handler: async ({ req }) => {
          const { expireProcesses } = await import('./tasks/expireProcesses')
          const result = await expireProcesses(req.payload)
          return { output: result }
        },
        outputSchema: [
          { name: 'expired', type: 'number' },
        ],
      },
    ],
  },
  plugins: [
    vercelBlobStorage({
      collections: { media: true },
      token: process.env.BLOB_READ_WRITE_TOKEN || '',
    }),
  ],
})
