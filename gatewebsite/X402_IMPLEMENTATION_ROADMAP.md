# Gate402 x402 Protocol Implementation Roadmap

## Current State: Centralized Off-Chain (✅ Complete)

### What Works Today
- ✅ User authentication via Supabase (email/password)
- ✅ API scanning and OpenAPI spec parsing
- ✅ Per-endpoint rate specification UI
- ✅ Service publishing to PostgreSQL database
- ✅ User dashboard with revenue tracking (mock data)
- ✅ Registry page showing all published APIs
- ✅ Row Level Security (RLS) for data isolation

### Architecture
```
User Browser → Next.js Frontend → Supabase PostgreSQL
                                 ↓
                          Auth + Database
```

## Phase 1: Smart Contract Infrastructure (🔨 Ready to Deploy)

### What's Included
- ✅ Solidity contracts written (APIRegistry.sol, PaymentEscrow.sol)
- ✅ Hardhat configuration for Monad testnet
- ✅ Deployment scripts created
- ✅ Network configuration (lib/monad-config.ts)
- ⚠️ Not yet deployed (requires testnet MON tokens)

### Deploy Checklist
```bash
# 1. Install Hardhat dependencies
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

# 2. Get testnet MON from faucet
# Visit: https://discord.gg/monad → #testnet-faucet

# 3. Add private key to .env.local
PRIVATE_KEY=your_deployment_wallet_private_key

# 4. Compile contracts
npm run contracts:compile

# 5. Deploy to Monad testnet
npm run contracts:deploy

# 6. Copy output addresses to .env.local
NEXT_PUBLIC_REGISTRY_CONTRACT=0x...
NEXT_PUBLIC_ESCROW_CONTRACT=0x...
NEXT_PUBLIC_ENABLE_WEB3=true
```

### Expected Architecture After Phase 1
```
User Browser → Next.js Frontend → Supabase (for UI state)
                ↓
           Wallet (MetaMask)
                ↓
         Monad Testnet → Smart Contracts (APIRegistry, PaymentEscrow)
```

## Phase 2: Frontend Web3 Integration (⏳ Not Started)

### Required Dependencies
```bash
npm install wagmi viem @rainbow-me/rainbowkit @tanstack/react-query
```

### Components to Build
1. **WalletConnectButton** (`components/WalletConnectButton.tsx`)
   - Replace/augment Supabase auth with Web3 wallet connection
   - Use RainbowKit for UI
   - Support MetaMask, WalletConnect, Coinbase Wallet

2. **Web3Provider** (`lib/web3-provider.tsx`)
   - Wrap app with Wagmi config
   - Configure Monad testnet chain
   - Handle wallet connection state

3. **useContractWrite hooks** (`hooks/usePublishAPI.ts`)
   - Call `registry.registerService()` on-chain
   - Upload OpenAPI spec to IPFS first
   - Store IPFS hash in contract
   - Wait for transaction confirmation

4. **useContractRead hooks** (`hooks/useAPIRegistry.ts`)
   - Read services from blockchain
   - Display on-chain data in registry
   - Show transaction hashes

### Code Example: Publishing On-Chain
```typescript
// hooks/usePublishAPI.ts
import { useContractWrite } from 'wagmi';
import { parseEther } from 'viem';

export function usePublishAPI() {
  const { write } = useContractWrite({
    address: CONTRACTS.API_REGISTRY,
    abi: APIRegistryABI,
    functionName: 'registerService',
  });

  const publish = async (name: string, metadataURI: string, rate: string) => {
    // 1. Upload OpenAPI spec to IPFS
    const ipfsHash = await uploadToIPFS(openapiSpec);
    
    // 2. Register on-chain
    write({
      args: [name, ipfsHash, parseEther(rate), 'per_request'],
    });
  };

  return { publish };
}
```

### Architecture After Phase 2
```
User Browser → Next.js Frontend → Web3 Wallet → Monad Testnet
                ↓                                     ↓
           Supabase (cache)              Smart Contracts + IPFS
```

## Phase 3: x402 Gateway Proxy (⏳ Not Started)

### What's Needed
A reverse proxy server that:
1. Intercepts HTTP requests to registered APIs
2. Checks consumer's on-chain deposit/allowance
3. Returns HTTP 402 if insufficient payment
4. Forwards request if valid
5. Records usage and deducts payment

### Implementation Options

#### Option A: Node.js Proxy (Recommended)
```typescript
// x402-gateway/src/proxy.ts
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

app.use('/api/:serviceId/*', async (req, res, next) => {
  const { serviceId } = req.params;
  const consumer = req.headers['x-consumer-address'];
  
  // 1. Lookup service on-chain
  const service = await registry.getService(serviceId);
  
  // 2. Check payment allowance
  const hasPayment = await escrow.checkAllowance(
    consumer,
    serviceId,
    service.ratePerRequest
  );
  
  if (!hasPayment) {
    // Return HTTP 402 with payment details
    return res.status(402).json({
      error: 'Payment Required',
      headers: {
        'X-402-Rate': service.ratePerRequest,
        'X-402-Unit': service.rateUnit,
        'X-402-Currency': 'MON',
        'X-402-Service-ID': serviceId,
      }
    });
  }
  
  // 3. Forward request to actual API
  next();
});

// Proxy to actual API endpoints
app.use('/api/:serviceId/*', createProxyMiddleware({
  router: async (req) => {
    // Lookup actual API URL from registry
    const serviceId = req.params.serviceId;
    return await getAPIUrl(serviceId);
  },
  onProxyRes: async (proxyRes, req, res) => {
    // 4. Record successful usage
    await escrow.processPayment(
      req.headers['x-consumer-address'],
      req.params.serviceId,
      cost,
      1 // request count
    );
  }
}));
```

#### Option B: Cloudflare Worker
```typescript
// For distributed, edge-based proxy
export default {
  async fetch(request: Request): Promise<Response> {
    // Similar logic but runs at the edge
  }
}
```

### x402 Headers Specification
```http
# Payment Required Response
HTTP/1.1 402 Payment Required
X-402-Rate: 0.001
X-402-Unit: per_request
X-402-Currency: MON
X-402-Payment-Address: 0x1234...
X-402-Service-ID: abc123
X-402-Provider: 0x5678...

# Consumer Request Headers
GET /api/service-id/endpoint
X-Consumer-Address: 0xabcd...
X-Consumer-Signature: 0x... (signed message proving identity)
```

### Architecture After Phase 3
```
AI Agent/Consumer → x402 Gateway Proxy → Actual API
                         ↓
                  Check Payment
                         ↓
                  Monad Testnet (Escrow)
                         ↓
                  Process Payment
                         ↓
                  Forward Request (if paid)
```

## Phase 4: Usage Oracle & Batch Settlement (⏳ Not Started)

### Problem
Recording every API call on-chain is expensive (gas costs).

### Solution
Off-chain usage tracking + periodic batch settlement:

```solidity
// UsageOracle.sol
contract UsageOracle {
    mapping(bytes32 => UsageReport) public reports;
    
    struct UsageReport {
        bytes32 serviceId;
        address consumer;
        uint256 requests;
        uint256 totalCost;
        uint256 reportedAt;
        bytes signature; // Signed by trusted oracle
    }
    
    function submitReport(UsageReport memory report) external onlyOracle {
        // Batch-process usage from gateway
        escrow.processPayment(
            report.consumer,
            report.serviceId,
            report.totalCost,
            report.requests
        );
    }
}
```

### Gateway Changes
```typescript
// Store usage in memory/Redis
let usageBuffer = new Map();

// Every 100 requests or 5 minutes
async function flushUsageToChain() {
  for (let [key, usage] of usageBuffer) {
    await oracle.submitReport({
      serviceId: usage.serviceId,
      consumer: usage.consumer,
      requests: usage.count,
      totalCost: usage.cost,
      signature: await signReport(usage),
    });
  }
  usageBuffer.clear();
}
```

## Phase 5: IPFS Metadata Storage (⏳ Not Started)

### Why IPFS?
- Decentralized storage for OpenAPI specs
- Immutable references (content-addressed)
- No single point of failure
- Smart contracts store IPFS hash (32 bytes vs full spec)

### Implementation
```typescript
// lib/ipfs.ts
import { create } from 'ipfs-http-client';

const ipfs = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: `Basic ${Buffer.from(
      `${process.env.IPFS_PROJECT_ID}:${process.env.IPFS_PROJECT_SECRET}`
    ).toString('base64')}`,
  },
});

export async function uploadOpenAPISpec(spec: object): Promise<string> {
  const { cid } = await ipfs.add(JSON.stringify(spec));
  return cid.toString(); // Return IPFS hash
}

export async function fetchOpenAPISpec(hash: string): Promise<object> {
  const chunks = [];
  for await (const chunk of ipfs.cat(hash)) {
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString());
}
```

### Registry Integration
```typescript
// Before publishing
const ipfsHash = await uploadOpenAPISpec(openapiSpec);

// Store in contract
await registry.registerService(
  serviceName,
  ipfsHash, // Store hash, not full spec
  rate,
  rateUnit
);

// Later, retrieve spec
const service = await registry.getService(serviceId);
const spec = await fetchOpenAPISpec(service.metadataURI);
```

## Success Metrics

### Phase 1 Success
- [ ] Contracts deployed to Monad testnet
- [ ] Can call `registerService()` from Hardhat console
- [ ] Can deposit MON to escrow
- [ ] Can withdraw provider revenue
- [ ] Transactions visible on MonadScan

### Phase 2 Success
- [ ] MetaMask connects to Monad testnet
- [ ] Can publish API via wallet transaction
- [ ] Registry shows on-chain services
- [ ] Dashboard displays blockchain data
- [ ] Transaction hashes stored in Supabase

### Phase 3 Success
- [ ] Gateway intercepts API requests
- [ ] Returns HTTP 402 for unpaid requests
- [ ] Forwards paid requests to APIs
- [ ] Records usage on-chain
- [ ] Providers see revenue increase

### Phase 4 Success
- [ ] Oracle submits batch reports
- [ ] Gas costs reduced by 90%+
- [ ] Usage tracked accurately
- [ ] Settlement happens every 5 minutes

### Phase 5 Success
- [ ] OpenAPI specs stored on IPFS
- [ ] Contract stores IPFS hashes only
- [ ] Specs retrievable from decentralized network
- [ ] No reliance on centralized database

## Estimated Timeline

- **Phase 1**: 1-2 hours (deploy contracts)
- **Phase 2**: 1-2 days (Web3 frontend integration)
- **Phase 3**: 3-5 days (x402 gateway proxy)
- **Phase 4**: 2-3 days (oracle + batch settlement)
- **Phase 5**: 1 day (IPFS integration)

**Total**: ~2 weeks for full x402 protocol implementation

## Resources

- [Monad Docs](https://docs.monad.xyz)
- [Wagmi Documentation](https://wagmi.sh)
- [HTTP 402 Payment Required Spec](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/402)
- [IPFS Documentation](https://docs.ipfs.tech)
- [Chainlink Oracles](https://docs.chain.link)

## Getting Help

- Monad Discord: https://discord.gg/monad
- Gate402 Issues: [GitHub Issues]
- x402 Protocol Discussion: [Community Forum]

---

**Current Status**: Phase 0 Complete, Phase 1 Ready to Deploy ✅
