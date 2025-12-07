// Monad Testnet Configuration for Gate402
// Network details for connecting to Monad's EVM-compatible testnet

export const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.monad.xyz'] },
    public: { http: ['https://testnet-rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: { 
      name: 'MonadScan', 
      url: 'https://testnet-explorer.monad.xyz' 
    },
  },
  testnet: true,
};

// Contract addresses (update after deployment)
export const CONTRACTS = {
  API_REGISTRY: process.env.NEXT_PUBLIC_REGISTRY_CONTRACT || '',
  PAYMENT_ESCROW: process.env.NEXT_PUBLIC_ESCROW_CONTRACT || '',
  USAGE_ORACLE: process.env.NEXT_PUBLIC_ORACLE_CONTRACT || '',
};

// Feature flags
export const ENABLE_WEB3 = process.env.NEXT_PUBLIC_ENABLE_WEB3 === 'true';
export const ENABLE_X402 = process.env.NEXT_PUBLIC_ENABLE_X402 === 'true';

// Network utilities
export function isMonadTestnet(chainId?: number): boolean {
  return chainId === monadTestnet.id;
}

export function getExplorerUrl(txHash: string): string {
  return `${monadTestnet.blockExplorers.default.url}/tx/${txHash}`;
}

export function getAddressUrl(address: string): string {
  return `${monadTestnet.blockExplorers.default.url}/address/${address}`;
}
