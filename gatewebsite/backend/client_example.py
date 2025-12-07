"""
Gate402 x402 Client Example
Demonstrates how to make paid requests to the Gate402 resource server
"""

import os
import asyncio
from dotenv import load_dotenv
from eth_account import Account
from x402.clients.httpx import x402HttpxClient
from x402.clients.base import decode_x_payment_response

# Load environment variables
load_dotenv()

# Configuration
PRIVATE_KEY = os.getenv("PRIVATE_KEY")  # Your Ethereum private key
RESOURCE_SERVER_URL = os.getenv("RESOURCE_SERVER_URL", "http://localhost:8000")

if not PRIVATE_KEY:
    print("Error: PRIVATE_KEY environment variable is required")
    print("Create a .env file with: PRIVATE_KEY=your_private_key_here")
    exit(1)

# Create account from private key
account = Account.from_key(PRIVATE_KEY)
print(f"🔑 Initialized account: {account.address}\n")


async def list_available_services():
    """List all available services (free endpoint)"""
    print("📋 Fetching available services...")
    
    # Use regular httpx for free endpoints
    import httpx
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{RESOURCE_SERVER_URL}/services")
        data = response.json()
        
        print(f"✅ Found {data['count']} services:\n")
        
        for service in data["services"]:
            print(f"  📦 {service['name']}")
            print(f"     Base Path: {service['base_path']}")
            for endpoint in service["endpoints"]:
                print(f"     - {endpoint['method']} {endpoint['path']} - {endpoint['price']}")
            print()
        
        return data


async def call_paid_endpoint(service_path: str, endpoint_path: str):
    """Make a paid request to a protected endpoint"""
    full_path = f"{service_path}/{endpoint_path}"
    print(f"💰 Making paid request to: {full_path}")
    
    # Use x402HttpxClient for automatic payment handling
    async with x402HttpxClient(account=account, base_url=RESOURCE_SERVER_URL) as client:
        try:
            print(f"   Sending request...")
            response = await client.get(full_path)
            
            # Read response content
            content = await response.aread()
            data = response.json() if response.headers.get("content-type") == "application/json" else content.decode()
            
            print(f"✅ Success! Response:")
            print(f"   Status: {response.status_code}")
            
            # Check for payment response header
            if "X-Payment-Response" in response.headers:
                payment_response = decode_x_payment_response(
                    response.headers["X-Payment-Response"]
                )
                print(f"   💳 Payment Transaction: {payment_response['transaction']}")
                print(f"   🌐 Network: {payment_response['network']}")
            
            print(f"   📦 Data: {data}\n")
            
            return data
            
        except Exception as e:
            print(f"❌ Error: {str(e)}\n")
            raise


async def main():
    """Main example workflow"""
    print("=" * 60)
    print("Gate402 x402 Client Example")
    print("=" * 60)
    print()
    
    # Step 1: List available services
    services_data = await list_available_services()
    
    if not services_data["services"]:
        print("⚠️  No services available. Please publish a service first.")
        return
    
    # Step 2: Call a paid endpoint
    # Use the first service's first endpoint as an example
    first_service = services_data["services"][0]
    first_endpoint = first_service["endpoints"][0]
    
    service_path = first_service["base_path"].strip("/")
    endpoint_path = first_endpoint["path"].replace(f"/{service_path}/", "")
    
    print(f"🎯 Testing paid endpoint: {first_endpoint['method']} {first_endpoint['path']}")
    print(f"   Price: {first_endpoint['price']}\n")
    
    # Make the paid request
    await call_paid_endpoint(service_path, endpoint_path)
    
    print("=" * 60)
    print("✅ Example completed successfully!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
