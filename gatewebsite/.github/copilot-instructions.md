# Gate402 - Copilot Instructions

## Project Overview
Gate402 is an API registry for the "Agentic Internet" - a Next.js 16 frontend with Supabase authentication that allows users to scan APIs (OpenAPI specs) and publish them with x402 pricing for AI agent discovery.

**Core Flow:** User signs in → Submits website URL → `/api/scan` finds `/openapi.json` & extracts endpoints → Modal review with per-endpoint rate specification → `/api/publish` saves to Supabase with x402 rates → Dashboard shows revenue

## Architecture

### Frontend (Next.js 16 + React 19)
- **App Router** with TypeScript, client components dominate (`'use client'`)
- **Styling**: Tailwind CSS v4 with custom Monokai theme (see `app/globals.css`)
- **State**: React `useState` for UI state, no global state manager
- **Authentication**: Supabase Auth with custom AuthContext (`lib/auth-context.tsx`)
- **Data Fetching**: Native `fetch` API, no React Query usage despite installation

### Backend Services
- **API Routes** (`app/api/*`): Next.js route handlers
  - `scan/route.ts`: Parses OpenAPI JSON or scrapes HTML anchors
  - `publish/route.ts`: Inserts services + endpoints to Supabase (requires auth)
  - `registry/route.ts`: Lists all published services
- **Python Backend** (`backend/`): FastAPI server with x402 integration (currently unused by frontend)

### Database (Supabase)
Schema with Row Level Security (RLS) enabled:
- `services` table: `id`, `user_id` (FK to auth.users), `name`, `description`, `created_at`
- `endpoints` table: `id`, `service_id` (FK), `method`, `path`, `description`, `rate` (cents), `rate_unit` (per_request/per_1k_requests/per_10k_requests)
- `api_usage` table: `id`, `endpoint_id`, `service_id`, `user_id`, `request_count`, `revenue_cents`, `created_at`

### Authentication
- **Supabase Auth**: Email/password authentication
- **AuthContext**: Global auth state (`lib/auth-context.tsx`)
- **Protected Routes**: Dashboard requires authentication
- **RLS Policies**: Users can only insert/update/delete their own services

## Key Conventions

### Styling Patterns
- **Monokai Color System**: Use semantic color vars (`text-monokai-pink`, `bg-monokai-bg`)
  - Pink (#F92672): CTAs, accents
  - Green (#A6E22E): Success, POST
  - Blue (#66D9EF): Links, GET
  - Orange (#FD971F): Warnings, PUT
  - Purple (#AE81FF): Info, PATCH
- **Custom Utilities**: `text-glow` class for neon effect on headings
- **Tailwind Merge**: Use `cn()` utility from `lib/utils.ts` for conditional classes

### Component Patterns
```tsx
// All components use this structure:
'use client';
import { cn } from '@/lib/utils';

interface ComponentProps {
  // Props here
}

export default function Component({ ...props }: ComponentProps) {
  // Implementation
}
```

### Data Flow
1. **URL Processing**: User submits website URL → scan tries direct URL, then appends `/openapi.json` if not JSON
2. **Scanning**: Parse `json.paths` object (OpenAPI spec)
3. **Endpoints Shape**: `{ method: string; path: string; description?: string; rate?: number; rateUnit?: string }`
4. **Rate Specification**: User sets per-endpoint rates in modal using `EndpointRateEditor` component
5. **Publishing**: Atomic operation - insert service first, then batch insert endpoints with x402 rate data

## Development Workflows

### Local Development
```bash
npm run dev  # Starts Next.js on :3000
```

### Testing Scan Feature
```bash
# Terminal 1: Next.js dev server
npm run dev

# Terminal 2: Serve demo API
npx http-server tmp/demo-api -p 8081 --cors

# Test URLs:
# http://localhost:8081 (Auto-discovers /openapi.json)
# http://localhost:8081/openapi.json (Direct OpenAPI spec)
```

### Environment Setup
Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=<your-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-key>
```

## Critical Implementation Details

### OpenAPI Discovery & Parsing Logic (`app/api/scan/route.ts`)
- Accepts website URLs (e.g., `https://mycompany.com`) - automatically tries appending `/openapi.json`
- Falls back to direct URL if no OpenAPI spec found at standard location
- Only extracts from `json.paths` - does not support OpenAPI 3.1 `webhooks` or components
- Uses `details.summary || details.description` for endpoint descriptions

### x402 Protocol Integration (CURRENT STATE)
- Rates stored in cents per `rate_unit` (per_request, per_1k_requests, per_10k_requests)
- `EndpointRateEditor` component provides UI for setting per-endpoint rates
- Published to Supabase `endpoints` table with `rate` and `rate_unit` columns
- **⚠️ CRITICAL GAPS - NOT PRODUCTION READY:**
  - No actual payment enforcement (x402 headers not implemented)
  - No blockchain integration (payments happen off-chain in centralized DB)
  - No smart contract deployment for escrow/settlement
  - No Web3 wallet connection (using email/password only)
  - Revenue tracking is mock data - no real payment flow
  
### x402 Protocol - What's Missing for Production

#### 1. **Web3 Wallet Integration**
```typescript
// NEEDED: Replace Supabase Auth with Web3 wallet authentication
// Libraries: wagmi, viem, RainbowKit
import { useAccount, useConnect } from 'wagmi';

// Connect wallet instead of email/password
const { address, isConnected } = useAccount();
```

#### 2. **Smart Contract Layer (Monad Testnet)**
```solidity
// NEEDED: Solidity contracts for:
// - API Service Registry (on-chain service metadata)
// - Payment Escrow (lock funds before API calls)
// - Usage Metering (record API calls on-chain or via oracle)
// - Revenue Settlement (distribute payments to API providers)

contract APIRegistry {
    struct Service {
        address provider;
        string metadataURI; // IPFS hash pointing to OpenAPI spec
        uint256 ratePerRequest; // in wei
        bool active;
    }
    
    mapping(bytes32 => Service) public services;
    
    function registerService(string memory name, string memory metadataURI, uint256 rate) external;
    function payForAPICall(bytes32 serviceId) external payable;
    function withdrawRevenue() external;
}
```

#### 3. **x402 Proxy/Gateway Layer**
```typescript
// NEEDED: Reverse proxy that:
// 1. Intercepts API requests
// 2. Checks on-chain payment/allowance
// 3. Returns HTTP 402 if insufficient funds
// 4. Forwards request if payment valid
// 5. Records usage on-chain or via Chainlink oracle

// Example response when payment required:
HTTP/1.1 402 Payment Required
X-402-Rate: 0.001
X-402-Unit: per_request
X-402-Currency: MON (Monad native token)
X-402-Payment-Address: 0x1234...
X-402-Service-ID: abc123
```

#### 4. **Monad Testnet Integration**
```bash
# NEEDED: Environment variables
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_MONAD_CHAIN_ID=10143 # Monad testnet
NEXT_PUBLIC_REGISTRY_CONTRACT=0x... # Deployed contract address
NEXT_PUBLIC_PAYMENT_TOKEN=0x... # MON or stablecoin
```

#### 5. **Payment Flow (How It Should Work)**
1. **API Consumer**: Deposits MON tokens to escrow contract
2. **API Call**: Consumer makes request with signed message proving deposit
3. **Gateway**: Validates payment signature, checks balance
4. **Execution**: If valid, forwards request to provider's API
5. **Settlement**: Periodically batch-settle payments from escrow to providers
6. **Dashboard**: Read revenue from smart contract events, not Supabase

#### 6. **Frontend Web3 Integration**
```typescript
// NEEDED: Replace existing auth/publish flow
import { useWalletClient, usePublicClient } from 'wagmi';
import { parseEther } from 'viem';

// Publish API with on-chain transaction
const publishAPI = async (serviceName, endpoints, rateInMON) => {
    const tx = await registryContract.write.registerService([
        serviceName,
        ipfsHash, // Upload OpenAPI spec to IPFS first
        parseEther(rateInMON.toString())
    ]);
    
    await publicClient.waitForTransactionReceipt({ hash: tx });
    // Update Supabase with tx hash for UI display
};
```

#### 7. **IPFS for OpenAPI Specs**
```typescript
// NEEDED: Upload OpenAPI spec to IPFS instead of storing in Supabase
import { create } from 'ipfs-http-client';

const uploadToIPFS = async (openapiSpec) => {
    const ipfs = create({ url: 'https://ipfs.infura.io:5001' });
    const { cid } = await ipfs.add(JSON.stringify(openapiSpec));
    return cid.toString(); // Return IPFS hash
};
```

### Error Handling Pattern
```tsx
try {
  const res = await fetch('/api/...');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Default message');
  // Handle success
} catch (error: any) {
  console.error(error);
  alert(error.message || 'Fallback message');
}
```
**Always** parse `data.error` from response before throwing.

### Modal Component Quirks
- Uses `createPortal` to `document.body` - requires `mounted` state check for SSR safety
- Auto-locks body scroll when open (`document.body.style.overflow`)
- Animation classes: `animate-in fade-in zoom-in-95 duration-200` (Tailwind v4 syntax)

## Common Tasks

### Adding New API Routes
1. Create `app/api/<name>/route.ts`
2. Export async `POST` function (GET not used in this project)
3. Use `NextResponse.json()` for responses
4. Import Supabase from `@/lib/supabase` (already initialized)

### Adding New Pages
- Use `app/<route>/page.tsx` convention
- Dynamic routes: `[param]` folders, access via `use(params)` in React 19
- See `app/registry/[serviceId]/page.tsx` for reference

### Styling New Components
- Always import `cn` from `@/lib/utils` for className merging
- Use `monokai-*` colors, never hardcode hex values
- Button pattern: `rounded-lg px-6 py-3 transition-transform hover:scale-105`
- Loading states: `<Loader2 className="h-5 w-5 animate-spin" />` from `lucide-react`

### Supabase Queries
```typescript
// Single insert with return
const { data, error } = await supabase
  .from('table')
  .insert({ ... })
  .select()
  .single();

// Batch insert (no return needed)
const { error } = await supabase
  .from('table')
  .insert([{ ... }, { ... }]);

// Query with filter
const { data } = await supabase
  .from('table')
  .select('*')
  .eq('id', value);
```

## Monad Testnet Setup

### Quick Start
```bash
# 1. Install dependencies
npm install wagmi viem @rainbow-me/rainbowkit ethers

# 2. Get testnet MON tokens
# Visit: https://faucet.monad.xyz (when available)
# Or use Discord faucet in #testnet-faucet

# 3. Add to .env.local
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_MONAD_CHAIN_ID=10143
NEXT_PUBLIC_ENABLE_WEB3=true # Feature flag

# 4. Deploy contracts (see contracts/ folder when created)
cd contracts
npx hardhat deploy --network monadTestnet
```

### Monad Network Config
```typescript
// lib/monad-config.ts
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
    default: { name: 'MonadScan', url: 'https://testnet.monad.xyz' },
  },
  testnet: true,
};
```

### Testing x402 Flow on Monad
1. **Connect Wallet**: MetaMask with Monad Testnet added
2. **Get Test MON**: From faucet (0.1 MON minimum for testing)
3. **Register API**: Transaction calls `APIRegistry.registerService()`
4. **Verify On-Chain**: Check MonadScan for tx confirmation
5. **Test Payment**: Consumer deposits MON, calls API, provider withdraws

### Contract Deployment Checklist
- [ ] APIRegistry.sol - Service registration
- [ ] PaymentEscrow.sol - Hold funds before API calls
- [ ] UsageOracle.sol - Record API call metrics
- [ ] Deploy script in `contracts/deploy/`
- [ ] Verify contracts on MonadScan
- [ ] Update NEXT_PUBLIC_REGISTRY_CONTRACT in .env.local

## Project-Specific Gotchas
- **React Query Installed But Unused**: Direct fetch calls are preferred pattern
- **Backend Folder Ignored**: Python FastAPI server exists but isn't integrated with frontend
- **Supabase Auth Active**: Email/password auth enabled with RLS policies
- **Naive HTML Parsing**: Production use requires proper HTML parser (jsdom/cheerio)
- **HTTP-Server CORS**: Demo API server needs `--cors` flag or requests fail from :3000
- **No Web3 Yet**: All payments/auth are off-chain - see x402 gaps section for what's needed
