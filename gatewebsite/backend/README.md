# Gate402 FastAPI Backend - x402 Protocol Resource Server

## Overview
FastAPI resource server that dynamically loads API services from Supabase and creates payment-protected endpoints following the **official x402 protocol standard**.

This implementation uses the `x402` Python package to provide standardized payment verification, automatic blockchain settlement, and proper HTTP 402 responses.

## Features
- **Official x402 Protocol**: Full compliance with x402 standard using `x402.fastapi.middleware`
- **Dynamic Service Loading**: Automatically loads services and endpoints from Supabase
- **Automatic Payment Verification**: x402 middleware handles payment authorization verification
- **Blockchain Settlement**: Payments are settled on-chain (Base Sepolia by default)
- **Per-Endpoint Pricing**: Each endpoint has custom rates from database
- **Service Registry**: In-memory caching for performance
- **CORS Enabled**: Supports cross-origin requests from frontend

## Architecture

```
Client → x402 Request → Resource Server → x402 Middleware → Blockchain Settlement
                             ↓
                       Supabase (config)
                             ↓
                      Protected Resource
```

## How It Works (x402 Protocol Flow)

### 1. Service Registration
APIs are registered in Supabase with:
- Service metadata (name, description)
- Endpoints (method, path, rate in cents, rate_unit)
- Provider payment address

### 2. Dynamic Route Generation & x402 Protection
On startup, the server:
1. Loads all services from Supabase
2. Creates URL-friendly paths (e.g., "Weather API" → `/weather-api`)
3. Applies `require_payment()` middleware to each paid endpoint
4. Endpoints are accessible at: `/{service-path}/{endpoint-path}`

### 3. x402 Payment Flow (Automatic via Middleware)

**First Request (No Payment):**
```bash
GET /weather-api/current
```

**Server Response:**
```http
HTTP/1.1 402 Payment Required
Content-Type: application/json

{
  "type": "payment-required",
  "schemes": [
    {
      "type": "exact",
      "network": "base-sepolia",
      "asset": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      "amount": "1000000000000000",
      "recipient": "0x8509cdc4f8b13d3792c1a5ad60f0faaa11753ca4",
      "digest": "0x..."
    }
  ]
}
```

**Second Request (With Payment):**
```bash
GET /weather-api/current
X-Payment: {"scheme_type":"exact","network":"base-sepolia","signature":"0x..."}
```

**Server Response:**
```http
HTTP/1.1 200 OK
X-Payment-Response: {"type":"exact","network":"base-sepolia","transaction":"0x..."}

{"weather": "sunny", "temperature": 70}
```

The x402 middleware automatically:
- Generates payment requirements
- Verifies payment authorization signatures
- Settles payment on blockchain
- Returns transaction hash in response

## API Endpoints

### Free Endpoints (No Payment Required)

#### Health Check
```bash
GET /
```
Returns service status, protocol info, and payment configuration.

#### List Services
```bash
GET /services
```
Returns all available services with pricing and endpoint details.

**Example Response:**
```json
{
  "services": [
    {
      "id": "uuid",
      "name": "Weather API",
      "base_path": "/weather-api",
      "endpoints": [
        {
          "method": "GET",
          "path": "/weather-api/current",
          "price": "$0.01",
          "rate_cents": 1,
          "rate_unit": "per_request"
        }
      ]
    }
  ],
  "payment_address": "0x8509...",
  "network": "base-sepolia"
}
```

#### Get Service Details
```bash
GET /services/{service_id}
```
Returns detailed information about a specific service.

#### Reload Services (Admin)
```bash
POST /admin/reload
```
Reload services from Supabase without restarting.

### Protected Endpoints (x402 Payment Required)

#### Service Endpoints
```bash
GET|POST|PUT|DELETE|PATCH /{service-path}/{endpoint-path}
```

Dynamically created for each service. Payment is handled automatically by x402 middleware.

**Example Usage with Python Client:**
```python
from eth_account import Account
from x402.clients.httpx import x402HttpxClient

account = Account.from_key("YOUR_PRIVATE_KEY")

async with x402HttpxClient(account=account, base_url="http://localhost:8000") as client:
    response = await client.get("/weather-api/current")
    print(response.json())  # Payment handled automatically
```

**Example Usage with curl (Manual):**
```bash
# 1. First request without payment
curl -i http://localhost:8000/weather-api/current
# Returns 402 with payment requirements

# 2. Sign payment authorization (use x402 client library)
# 3. Second request with payment
curl -H "X-Payment: {signed_payload}" http://localhost:8000/weather-api/current
# Returns 200 with data and X-Payment-Response header
```

## Configuration

### Environment Variables (.env)
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# x402 Protocol Configuration
ADDRESS=0x8509cdc4f8b13d3792c1a5ad60f0faaa11753ca4
NETWORK=base-sepolia
```

**Required Variables:**
- `ADDRESS`: Ethereum address that receives payments
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key

**Optional Variables:**
- `NETWORK`: Blockchain network (default: `base-sepolia`)
  - Options: `base-sepolia`, `base`, `ethereum`, `polygon`, etc.

## Running the Server

### Development
```bash
cd backend
python main.py
```

Server starts on `http://0.0.0.0:8000` with auto-reload enabled.

### Production
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Database Schema

### services table
```sql
CREATE TABLE services (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  name TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### endpoints table
```sql
CREATE TABLE endpoints (
  id UUID PRIMARY KEY,
  service_id UUID REFERENCES services,
  method TEXT,  -- GET, POST, PUT, DELETE, PATCH
  path TEXT,
  description TEXT,
  rate INTEGER,  -- in cents
  rate_unit TEXT  -- per_request, per_1k_requests, per_10k_requests
);
```

## x402 Protocol Implementation

### Official x402 Standard
This implementation uses the official `x402` Python package which provides:

**Core Components:**
1. **Types**: Payment requirements, payloads, and settlement responses
2. **Logic**: Payment formation and verification ("exact" scheme for EVM chains)
3. **Representation**: HTTP transport with `X-Payment` and `X-Payment-Response` headers

**Payment Flow:**
```
1. Client Request (No Payment)
   ↓
2. Server: 402 Payment Required + JSON payload with schemes
   ↓
3. Client: Sign payment authorization with private key
   ↓
4. Client Request (With X-Payment header)
   ↓
5. x402 Middleware: Verify signature + Settle on blockchain
   ↓
6. Server: 200 OK + X-Payment-Response with transaction hash
```

### Automatic Features (via x402 Middleware)
✅ **Payment requirement generation** - Automatic digest creation
✅ **Signature verification** - Validates client signatures
✅ **Blockchain settlement** - Submits transactions on-chain
✅ **Transaction tracking** - Returns tx hash in response
✅ **Multiple payment schemes** - Supports "exact" EVM scheme
✅ **Network flexibility** - Works with any EVM chain

### Current Implementation
- ✅ Full x402 protocol compliance
- ✅ Dynamic service loading from Supabase
- ✅ Per-endpoint pricing configuration
- ✅ Automatic payment verification and settlement
- ✅ On-chain transaction execution
- ⏳ Actual API proxying (returns mock data)
- ⏳ Usage metering for analytics
- ⏳ Multi-chain support configuration

### Future Enhancements
- [ ] Proxy requests to actual API endpoints
- [ ] Usage tracking and analytics dashboard
- [ ] Support for additional payment schemes (ERC-20 tokens)
- [ ] Rate limiting per consumer wallet
- [ ] Payment receipt generation and history
- [ ] Automatic refunds for failed API calls
- [ ] WebSocket support for real-time APIs
- [ ] Integration with Monad for custom settlement

## Testing

### Quick Test with Python Client

1. **Publish a service** via the frontend at http://localhost:3000

2. **Set up client credentials:**
```bash
cd backend
cp .env.client.example .env.client
# Edit .env.client with your private key
```

3. **Run the example client:**
```bash
python client_example.py
```

The client will:
- List all available services
- Automatically make a paid request to the first endpoint
- Handle payment signing and verification
- Display the transaction hash

**Example Output:**
```
🔑 Initialized account: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e

📋 Fetching available services...
✅ Found 1 services:

  📦 Weather API
     Base Path: /weather-api
     - GET /weather-api/current - $0.01

💰 Making paid request to: weather-api/current
   Sending request...
✅ Success! Response:
   Status: 200
   💳 Payment Transaction: 0x1234...
   🌐 Network: base-sepolia
   📦 Data: {"weather": "sunny", "temperature": 70}
```

### Manual Testing with curl

**1. List services (free):**
```bash
curl http://localhost:8000/services
```

**2. Try accessing a paid endpoint (no payment):**
```bash
curl -i http://localhost:8000/weather-api/current
```

**Response:**
```http
HTTP/1.1 402 Payment Required
Content-Type: application/json

{
  "type": "payment-required",
  "schemes": [
    {
      "type": "exact",
      "network": "base-sepolia",
      "asset": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      "amount": "10000000000000000",
      "recipient": "0x8509cdc4f8b13d3792c1a5ad60f0faaa11753ca4",
      "digest": "0x..."
    }
  ]
}
```

**3. Make paid request (use Python client or sign manually):**
```bash
# Use the Python client - it handles signing automatically
python client_example.py
```

## Integration with Frontend

The Next.js frontend already handles:
- User authentication
- API scanning and publishing
- Endpoint rate configuration
- Dashboard revenue tracking

The FastAPI backend adds:
- Real-time payment enforcement
- x402 protocol compliance
- Dynamic routing based on published services

## Troubleshooting

### Server won't start
```bash
# Check if port 8000 is already in use
netstat -ano | grep 8000

# Kill existing process
taskkill /F /PID <PID>
```

### Services not loading
```bash
# Check Supabase connection
curl https://your-project.supabase.co/rest/v1/services \
  -H "apikey: your-anon-key"

# Reload services manually
curl -X POST http://localhost:8000/admin/reload
```

### Payment headers not returned
Check that:
1. Endpoint has `rate > 0` in database
2. Service is active in Supabase
3. Request path matches endpoint path exactly

## Next Steps

To complete the x402 implementation:

1. **Deploy Smart Contracts** (Phase 1 of roadmap)
   - See `X402_IMPLEMENTATION_ROADMAP.md`
   - Deploy APIRegistry.sol to Monad testnet
   - Deploy PaymentEscrow.sol

2. **Add On-Chain Verification**
   - Replace mock payment proof check with Web3 verification
   - Query escrow contract for consumer deposits
   - Record usage on-chain

3. **Implement Actual Proxying**
   - Use `httpx` to forward requests to real API endpoints
   - Handle response streaming
   - Add timeout and retry logic

4. **Add Usage Metering**
   - Track API calls per consumer
   - Batch-submit usage to oracle contract
   - Calculate provider revenue

## Resources

- [x402 Protocol](https://github.com/your-org/x402-spec)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Monad Documentation](https://docs.monad.xyz/)
- [Supabase Python Client](https://github.com/supabase-community/supabase-py)

## License
MIT
