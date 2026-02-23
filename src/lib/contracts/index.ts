/**
 * Contract ABIs and config for frontend use.
 * Address comes from NEXT_PUBLIC_CONTRACT_ADDRESS.
 */

export { AssetRegistryABI } from './abis/AssetRegistry'

export const ASSET_REGISTRY_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? ''
