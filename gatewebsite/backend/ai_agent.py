"""
Mock AI Agent - Gate402 x402 Protocol Client
Simulates an autonomous AI agent that discovers and uses paid APIs via x402 protocol
"""

import os
import asyncio
import json
from datetime import datetime
from typing import Dict, List, Any
from dotenv import load_dotenv
from eth_account import Account
from x402.clients.httpx import x402HttpxClient
from x402.clients.base import decode_x_payment_response
import httpx

# Load environment variables
load_dotenv()

# Agent Configuration
AGENT_NAME = "ResearchBot-3000"
AGENT_DESCRIPTION = "Autonomous research agent that discovers and uses APIs"
PRIVATE_KEY = "0x99fb96ba08b836c3d190a3a3c3ebb54a338d5b1e4dd85e800ae0d238d5970891"
RESOURCE_SERVER_URL = os.getenv("RESOURCE_SERVER_URL", "http://localhost:8000")

# Create account from private key
account = Account.from_key(PRIVATE_KEY)


class AIAgent:
    """Mock AI Agent that uses x402 protocol to access paid APIs"""
    
    def __init__(self, name: str, wallet_address: str):
        self.name = name
        self.wallet_address = wallet_address
        self.discovered_services: List[Dict] = []
        self.transaction_history: List[Dict] = []
        self.total_spent: float = 0.0
        
    async def discover_services(self) -> List[Dict]:
        """Discover available API services (free endpoint)"""
        print(f"\n🤖 {self.name} is discovering available API services...")
        print(f"   Wallet: {self.wallet_address}")
        print(f"   Server: {RESOURCE_SERVER_URL}\n")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{RESOURCE_SERVER_URL}/services")
            data = response.json()
            
            self.discovered_services = data.get("services", [])
            
            print(f"✅ Discovered {len(self.discovered_services)} services:")
            for service in self.discovered_services:
                print(f"\n   📦 {service['name']}")
                print(f"      Description: {service.get('description', 'N/A')}")
                print(f"      Base Path: {service['base_path']}")
                print(f"      Endpoints: {len(service['endpoints'])}")
                for endpoint in service['endpoints']:
                    print(f"         - {endpoint['method']} {endpoint['path']} → {endpoint['price']}")
            
            return self.discovered_services
    
    async def use_service(self, service: Dict, endpoint: Dict) -> Dict[str, Any]:
        """Use a paid service endpoint via x402 protocol"""
        endpoint_path = endpoint['path']
        method = endpoint['method'].lower()
        price = endpoint['price']
        
        print(f"\n💰 {self.name} is purchasing API access:")
        print(f"   Endpoint: {method.upper()} {endpoint_path}")
        print(f"   Price: {price}")
        print(f"   Description: {endpoint.get('description', 'N/A')}")
        
        # Use x402 client for automatic payment handling
        async with x402HttpxClient(account=account, base_url=RESOURCE_SERVER_URL) as client:
            try:
                print(f"   📡 Sending request with x402 payment...")
                
                # Make request based on method
                if method == "get":
                    response = await client.get(endpoint_path)
                elif method == "post":
                    response = await client.post(endpoint_path, json={})
                elif method == "put":
                    response = await client.put(endpoint_path, json={})
                elif method == "delete":
                    response = await client.delete(endpoint_path)
                elif method == "patch":
                    response = await client.patch(endpoint_path, json={})
                else:
                    raise ValueError(f"Unsupported method: {method}")
                
                # Parse response
                content = await response.aread()
                
                if response.headers.get("content-type") == "application/json":
                    data = json.loads(content.decode())
                else:
                    data = {"raw": content.decode()}
                
                # Extract payment info
                payment_tx = None
                payment_network = None
                if "X-Payment-Response" in response.headers:
                    payment_response = decode_x_payment_response(
                        response.headers["X-Payment-Response"]
                    )
                    payment_tx = payment_response.get('transaction')
                    payment_network = payment_response.get('network')
                
                print(f"   ✅ Payment successful!")
                print(f"   💳 Transaction: {payment_tx}")
                print(f"   🌐 Network: {payment_network}")
                print(f"   📦 Response Status: {response.status_code}")
                
                # Record transaction
                transaction = {
                    "timestamp": datetime.now().isoformat(),
                    "service": service['name'],
                    "endpoint": endpoint_path,
                    "method": method.upper(),
                    "price": price,
                    "transaction_hash": payment_tx,
                    "network": payment_network,
                    "status": "success"
                }
                self.transaction_history.append(transaction)
                
                # Update total spent
                price_value = float(price.replace("$", ""))
                self.total_spent += price_value
                
                return {
                    "success": True,
                    "data": data,
                    "transaction": transaction
                }
                
            except Exception as e:
                print(f"   ❌ Error: {str(e)}")
                
                # Record failed transaction
                transaction = {
                    "timestamp": datetime.now().isoformat(),
                    "service": service['name'],
                    "endpoint": endpoint_path,
                    "method": method.upper(),
                    "price": price,
                    "error": str(e),
                    "status": "failed"
                }
                self.transaction_history.append(transaction)
                
                return {
                    "success": False,
                    "error": str(e),
                    "transaction": transaction
                }
    
    async def autonomous_task(self):
        """Simulate an autonomous task that uses multiple API services"""
        print("\n" + "=" * 70)
        print(f"🤖 {self.name} AUTONOMOUS TASK EXECUTION")
        print("=" * 70)
        
        # Step 1: Discover services
        services = await self.discover_services()
        
        if not services:
            print("\n⚠️  No services available. Exiting.")
            return
        
        # Step 2: Use each service's first endpoint
        print(f"\n🎯 {self.name} will now use available API services:")
        
        for service in services:
            if not service['endpoints']:
                print(f"\n   ⏭️  Skipping {service['name']} - no endpoints")
                continue
            
            # Use the first endpoint of each service
            endpoint = service['endpoints'][0]
            
            try:
                result = await self.use_service(service, endpoint)
                
                if result['success']:
                    print(f"   📊 Data received: {json.dumps(result['data'], indent=6)}")
                
                # Wait a bit between requests (polite agent)
                await asyncio.sleep(1)
                
            except Exception as e:
                print(f"   ⚠️  Failed to use {service['name']}: {e}")
    
    def print_summary(self):
        """Print agent's activity summary"""
        print("\n" + "=" * 70)
        print(f"📊 {self.name} ACTIVITY SUMMARY")
        print("=" * 70)
        
        print(f"\n💰 Financial Summary:")
        print(f"   Total Spent: ${self.total_spent:.4f}")
        print(f"   Transactions: {len(self.transaction_history)}")
        print(f"   Successful: {sum(1 for t in self.transaction_history if t['status'] == 'success')}")
        print(f"   Failed: {sum(1 for t in self.transaction_history if t['status'] == 'failed')}")
        
        print(f"\n📝 Transaction History:")
        for i, tx in enumerate(self.transaction_history, 1):
            status_emoji = "✅" if tx['status'] == 'success' else "❌"
            print(f"\n   {status_emoji} Transaction #{i}")
            print(f"      Service: {tx['service']}")
            print(f"      Endpoint: {tx['method']} {tx['endpoint']}")
            print(f"      Price: {tx['price']}")
            print(f"      Time: {tx['timestamp']}")
            if tx['status'] == 'success':
                print(f"      TX Hash: {tx['transaction_hash']}")
                print(f"      Network: {tx['network']}")
            else:
                print(f"      Error: {tx.get('error', 'Unknown')}")
        
        print("\n" + "=" * 70)


async def main():
    """Main execution"""
    print("\n" + "=" * 70)
    print("🚀 GATE402 AI AGENT - x402 PROTOCOL DEMO")
    print("=" * 70)
    print(f"\n📍 Resource Server: {RESOURCE_SERVER_URL}")
    print(f"🔑 Agent Wallet: {account.address}")
    print(f"🤖 Agent Name: {AGENT_NAME}")
    print(f"📝 Agent Purpose: {AGENT_DESCRIPTION}")
    
    # Create AI agent
    agent = AIAgent(
        name=AGENT_NAME,
        wallet_address=account.address
    )
    
    # Run autonomous task
    await agent.autonomous_task()
    
    # Print summary
    agent.print_summary()
    
    print("\n" + "=" * 70)
    print("✅ DEMO COMPLETED")
    print("=" * 70)
    print(f"\n💡 What just happened:")
    print(f"   1. AI agent discovered available API services")
    print(f"   2. For each service, agent made a paid request using x402")
    print(f"   3. Payments were verified and settled on-chain")
    print(f"   4. Agent received API responses")
    print(f"   5. All transactions recorded with blockchain receipts")
    print("\n🎉 The Agentic Internet is here!")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
