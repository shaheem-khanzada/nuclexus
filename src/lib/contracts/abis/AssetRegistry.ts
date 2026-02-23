/**
 * AssetRegistry contract ABI (slim, emit-only).
 * No on-chain storage of events/assets. Just emits RegistryEvent for transparency.
 * submitProof includes processId (uint256) for linking events to off-chain processes.
 */
export const AssetRegistryABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'assetId', type: 'uint256' },
      { indexed: false, internalType: 'string', name: 'eventType', type: 'string' },
      { indexed: true, internalType: 'address', name: 'sender', type: 'address' },
      { indexed: false, internalType: 'bytes32', name: 'proofHash', type: 'bytes32' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
      { indexed: false, internalType: 'address', name: 'validator', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'processId', type: 'uint256' },
    ],
    name: 'RegistryEvent',
    type: 'event',
  },
  {
    inputs: [{ internalType: 'string', name: 'eventType', type: 'string' }],
    name: 'createAsset',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'nextAssetId',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'assetId', type: 'uint256' },
      { internalType: 'bytes32', name: 'proofHash', type: 'bytes32' },
      { internalType: 'string', name: 'eventType', type: 'string' },
      { internalType: 'uint256', name: 'processId', type: 'uint256' },
    ],
    name: 'submitProof',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'assetId', type: 'uint256' },
      { internalType: 'bytes32', name: 'proofHash', type: 'bytes32' },
      { internalType: 'string', name: 'eventType', type: 'string' },
    ],
    name: 'verifyAsset',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const
