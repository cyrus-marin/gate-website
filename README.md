# Gate402 - API Registry for the Agentic Internet

**Gate402** is an open API registry that enables AI agents to autonomously discover and pay for API access using the [x402 payment protocol](https://github.com/x402-protocol/spec). Built with Next.js 16, Supabase, and Monad Testnet blockchain integration.

## 🎯 What is Gate402?

Gate402 is a marketplace where:
- **API Providers** publish their OpenAPI specs with per-endpoint pricing in MON tokens
- **AI Agents** autonomously discover services, pay for access via x402, and consume APIs
- **Payments** are settled on-chain on Monad Testnet with cryptographic verification
- **No API keys** required - just wallet signatures and blockchain payments

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   Gate402 Frontend (Next.js)                     │
│  • Scan OpenAPI specs from URLs                                  │
│  • Configure per-endpoint pricing (MON, ETH, USDC, USDT)        │
│  • Publish to Supabase registry                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │   Supabase   │
                  │  PostgreSQL  │
                  └──────┬───────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│         Gate402 x402 Resource Server (FastAPI Backend)          │
│  • Loads services from Supabase dynamically                      │
│  • Applies x402 payment middleware to paid endpoints             │
│  • Returns 402 Payment Required with payment specs              │
│  • Verifies signatures & settles payments on Monad              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │Monad Testnet │
                  │  Blockchain  │
                  └──────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Supabase account
- Monad Testnet wallet with test MON tokens

### 1. Frontend Setup

```bash
# Install dependencies
npm install

# Configure environment (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the UI.

### 2. Database Setup

Run the schema in your Supabase SQL Editor:

```bash
# See supabase-schema.sql for full schema
# Creates tables: services, endpoints, api_usage
```

Key tables:
- `services` - Published API services
- `endpoints` - Individual API endpoints with token pricing (MON, ETH, etc.)
- `api_usage` - Revenue tracking per endpoint

### 3. Backend x402 Server Setup

```bash
cd backend

# Install Python dependencies
pip install x402 fastapi uvicorn supabase python-dotenv eth_account httpx

# Configure environment (.env)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
ADDRESS=your_payment_wallet_address
NETWORK=monad-testnet

# Start the resource server
python main.py
```

The x402 server runs on `http://localhost:8000` and dynamically loads services from Supabase.

### 4. Run the AI Agent Demo

```bash
cd backend

# Configure agent credentials (.env)
AGENT_PRIVATE_KEY=your_private_key
RESOURCE_SERVER_URL=http://localhost:8000

# Run the demo script
./demo.sh
```

The AI agent will:
1. Discover available APIs
2. Make paid requests with automatic x402 payment signing
3. Record blockchain transaction receipts
4. Generate spending analytics

## 📦 Project Structure

```
gatewebsite/
├── app/                    # Next.js 16 App Router
│   ├── api/               # API routes (scan, publish, registry)
│   ├── dashboard/         # User dashboard
│   ├── registry/          # Public service registry
│   └── success/           # Post-publish success page
├── components/            # React components
│   ├── EndpointRateEditor.tsx  # MON token pricing UI
│   └── EndpointTable.tsx       # Display endpoint pricing
├── lib/                   # Utilities
│   ├── monad-config.ts    # Monad Testnet configuration
│   └── supabase.ts        # Supabase client
├── backend/               # FastAPI x402 server
│   ├── main.py           # x402 resource server
│   ├── ai_agent.py       # Mock AI agent demo
│   └── demo.sh           # Complete demo script
├── contracts/            # Solidity contracts (future)
└── public/              # Static assets
```

## 🔑 Key Features

### Frontend
- **OpenAPI Scanner**: Submit any website URL - auto-discovers `/openapi.json`
- **Token Pricing**: Set prices in MON, ETH, USDC, or USDT per endpoint
- **Rate Units**: Per request, per 1K requests, or per 10K requests
- **Supabase Auth**: Email/password authentication with RLS policies
- **Monokai Theme**: Custom dark theme with neon accents

### Backend x402 Server
- **Official x402 Protocol**: Uses `x402` Python package
- **Dynamic Service Loading**: Reads from Supabase, no code changes needed
- **Automatic Payment Verification**: Middleware checks signatures & settles on-chain
- **Monad Testnet Integration**: All payments settled on Monad blockchain
- **Free Endpoints**: `/`, `/services`, `/services/{id}` don't require payment

### AI Agent
- **Autonomous Discovery**: Queries `/services` to find available APIs
- **x402HttpxClient**: Automatic payment signing and submission
- **Transaction Tracking**: Records all blockchain tx hashes
- **Spending Analytics**: Generates financial reports

## 💰 Token Pricing

Gate402 supports multiple payment tokens:

| Token | Symbol | Example Price |
|-------|--------|---------------|
| Monad | MON    | 0.001 MON     |
| Ethereum | ETH | 0.0001 ETH    |
| USD Coin | USDC | 0.01 USDC    |
| Tether | USDT | 0.01 USDT     |

Prices are set per endpoint and stored in the `endpoints` table with `token` and `token_amount` fields.

## 🧪 Testing

### Test the Full Flow

1. **Start the backend**: `cd backend && python main.py`
2. **Start the frontend**: `npm run dev`
3. **Publish a service**:
   - Go to http://localhost:3000
   - Submit a URL with OpenAPI spec
   - Set MON token prices
   - Click "Publish"
4. **Run the AI agent**: `cd backend && ./demo.sh`

### Example OpenAPI Test

```bash
# Serve demo API
npm run demo-api

# Test URLs:
# http://localhost:8081 (auto-discovers /openapi.json)
# http://localhost:8081/openapi.json (direct spec)
```

## 🌐 x402 Payment Flow

1. **Client Request**: AI agent calls `GET /weather-api/current`
2. **402 Response**: Server returns payment requirements JSON:
```json
{
  "type": "payment-required",
  "schemes": [{
    "type": "exact",
    "network": "monad-testnet",
    "asset": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    "amount": "10000000000000000",
    "recipient": "0x8509cdc4f8b13d3792c1a5ad60f0faaa11753ca4"
  }]
}
```
3. **Sign Payment**: Client signs authorization with private key
4. **Retry with Payment**: Client includes `X-Payment` header
5. **Settlement**: Server verifies signature, settles on Monad, returns data + tx hash

## 📚 Documentation

- [QUICKSTART.md](./QUICKSTART.md) - Get started in 5 minutes
- [KNOWLEDGE_BOMB.md](./KNOWLEDGE_BOMB.md) - x402 protocol deep dive
- [MONAD_TESTNET_SETUP.md](./MONAD_TESTNET_SETUP.md) - Monad configuration
- [backend/README.md](./backend/README.md) - x402 server documentation
- [backend/AI_AGENT_README.md](./backend/AI_AGENT_README.md) - AI agent guide

## 🚢 Deployment

### Vercel (Frontend)

1. Import repository to Vercel
2. Set **Root Directory** to `gatewebsite`
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### Railway/Fly.io (Backend)

```bash
# Deploy the FastAPI server
cd backend
# Add Procfile: web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

## 🔗 Links

- [x402 Protocol Spec](https://github.com/x402-protocol/spec)
- [x402 Python Package](https://github.com/x402-protocol/x402-python)
- [Monad Testnet Explorer](https://testnet-explorer.monad.xyz)
- [Supabase Documentation](https://supabase.com/docs)

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! This is the foundation for the "Agentic Internet" where AI systems autonomously discover and pay for resources.

---

**Welcome to Gate402 - The API Registry for Autonomous Agents! 🚀**
