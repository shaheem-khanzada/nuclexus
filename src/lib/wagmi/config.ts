import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { sepolia } from 'wagmi/chains'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? ''

export const config = getDefaultConfig({
  appName: 'Nuclexus',
  projectId: projectId || 'YOUR_PROJECT_ID',
  chains: [sepolia],
  ssr: true,
})
