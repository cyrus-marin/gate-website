# Mock AI Agent - x402 Protocol Demo

## Overview
`ai_agent.py` simulates an autonomous AI agent that discovers and uses paid API services via the x402 protocol.

## What It Does

1. **Service Discovery**: Queries the resource server for available APIs
2. **Autonomous Decision Making**: Decides which services to use
3. **Payment Handling**: Uses x402 protocol to pay for API access
4. **Transaction Tracking**: Records all payments on blockchain
5. **Activity Reporting**: Generates detailed usage and spending reports

## Agent Capabilities

### ResearchBot-3000
- **Type**: Autonomous research agent
- **Wallet**: 0x8509cdc4f8b13d3792c1a5ad60f0faaa11753ca4
- **Network**: Base Sepolia
- **Payment Method**: x402 protocol with automatic signing

## Running the Demo

### 1. Start the Resource Server
```bash
cd backend
python main.py
```

### 2. Publish Some Services
Go to http://localhost:3000 and publish APIs with pricing

### 3. Run the AI Agent
```bash
python ai_agent.py
```

## Example Output

```
🚀 GATE402 AI AGENT - x402 PROTOCOL DEMO
======================================================================

📍 Resource Server: http://localhost:8000
🔑 Agent Wallet: 0x8509cdc4f8b13d3792c1a5ad60f0faaa11753ca4
🤖 Agent Name: ResearchBot-3000
📝 Agent Purpose: Autonomous research agent that discovers and uses APIs

🤖 ResearchBot-3000 AUTONOMOUS TASK EXECUTION
======================================================================

🤖 ResearchBot-3000 is discovering available API services...
   Wallet: 0x8509cdc4f8b13d3792c1a5ad60f0faaa11753ca4
   Server: http://localhost:8000

✅ Discovered 2 services:

   📦 Weather API
      Description: Real-time weather data
      Base Path: /weather-api
      Endpoints: 2
         - GET /weather-api/current → $0.01
         - GET /weather-api/forecast → $0.05

   📦 Stock Data API
      Description: Financial market data
      Base Path: /stock-data-api
      Endpoints: 1
         - GET /stock-data-api/quote → $0.02

🎯 ResearchBot-3000 will now use available API services:

💰 ResearchBot-3000 is purchasing API access:
   Endpoint: GET /weather-api/current
   Price: $0.01
   Description: Current weather conditions
   📡 Sending request with x402 payment...
   ✅ Payment successful!
   💳 Transaction: 0xabc123...
   🌐 Network: base-sepolia
   📦 Response Status: 200
   📊 Data received: {
         "success": true,
         "weather": "sunny",
         "temperature": 72
       }

💰 ResearchBot-3000 is purchasing API access:
   Endpoint: GET /stock-data-api/quote
   Price: $0.02
   Description: Stock price quote
   📡 Sending request with x402 payment...
   ✅ Payment successful!
   💳 Transaction: 0xdef456...
   🌐 Network: base-sepolia
   📦 Response Status: 200
   📊 Data received: {
         "success": true,
         "symbol": "AAPL",
         "price": 185.43
       }

======================================================================
📊 ResearchBot-3000 ACTIVITY SUMMARY
======================================================================

💰 Financial Summary:
   Total Spent: $0.0300
   Transactions: 2
   Successful: 2
   Failed: 0

📝 Transaction History:

   ✅ Transaction #1
      Service: Weather API
      Endpoint: GET /weather-api/current
      Price: $0.01
      Time: 2025-12-06T15:30:45.123456
      TX Hash: 0xabc123...
      Network: base-sepolia

   ✅ Transaction #2
      Service: Stock Data API
      Endpoint: GET /stock-data-api/quote
      Price: $0.02
      Time: 2025-12-06T15:30:46.789012
      TX Hash: 0xdef456...
      Network: base-sepolia

======================================================================
✅ DEMO COMPLETED
======================================================================

💡 What just happened:
   1. AI agent discovered available API services
   2. For each service, agent made a paid request using x402
   3. Payments were verified and settled on-chain
   4. Agent received API responses
   5. All transactions recorded with blockchain receipts

🎉 The Agentic Internet is here!
======================================================================
```

## Features Demonstrated

### ✅ Service Discovery
- Agent queries free `/services` endpoint
- Discovers available APIs with pricing
- Understands endpoint capabilities

### ✅ x402 Payment Protocol
- Automatic payment authorization signing
- On-chain settlement on Base Sepolia
- Transaction hash verification
- Payment receipts in headers

### ✅ Autonomous Operation
- No human intervention required
- Makes intelligent decisions about API usage
- Handles errors gracefully
- Tracks spending and transactions

### ✅ Transparency
- All payments recorded on blockchain
- Complete transaction history
- Spending analytics
- Audit trail for compliance

## Agent Configuration

### Environment Variables
```env
AGENT_PRIVATE_KEY=0x99fb96ba08b836c3d190a3a3c3ebb54a338d5b1e4dd85e800ae0d238d5970891
RESOURCE_SERVER_URL=http://localhost:8000
```

### Customization
You can modify the agent's behavior by editing `ai_agent.py`:

```python
# Change agent name and description
AGENT_NAME = "CustomBot-X"
AGENT_DESCRIPTION = "Your custom agent purpose"

# Customize autonomous task logic
async def autonomous_task(self):
    # Your custom logic here
    pass
```

## Use Cases

### 1. Research Automation
AI agent gathers data from multiple paid APIs to compile research reports

### 2. Trading Bots
Automated trading systems that pay for real-time market data

### 3. Content Generation
AI agents that access premium data sources to create content

### 4. Monitoring Systems
Autonomous systems that continuously poll paid APIs for alerts

### 5. Data Aggregation
Agents that collect data from multiple paid sources for analytics

## Technical Details

### Payment Flow
1. Agent requests endpoint without payment
2. Server returns 402 with payment requirements
3. Agent signs payment authorization with private key
4. Agent retries request with X-Payment header
5. x402 middleware verifies signature
6. Payment settled on blockchain
7. Agent receives data + transaction hash

### Security
- Private key stored securely
- All payments signed cryptographically
- On-chain verification
- No payment = no data access

### Scalability
- Agent can use unlimited services
- Automatic payment handling
- Batching possible for efficiency
- Works across any x402-compliant server

## Next Steps

1. **Add Intelligence**: Implement smarter decision-making logic
2. **Multi-Agent**: Run multiple agents with different strategies
3. **Budget Management**: Add spending limits and optimization
4. **Service Rating**: Track service quality and reliability
5. **Caching**: Avoid redundant paid API calls

## Troubleshooting

### Agent can't connect
```bash
# Check if resource server is running
curl http://localhost:8000/

# Verify services are published
curl http://localhost:8000/services
```

### Payment failures
```bash
# Check wallet has sufficient balance on Base Sepolia
# Verify private key is correct
# Ensure network configuration matches server
```

### No services found
```bash
# Publish services via frontend first
# Check Supabase has service data
# Reload server: curl -X POST http://localhost:8000/admin/reload
```

## Conclusion

This mock AI agent demonstrates the power of the x402 protocol for enabling autonomous systems to discover, pay for, and use API services without human intervention.

**The Agentic Internet is here!** 🚀
