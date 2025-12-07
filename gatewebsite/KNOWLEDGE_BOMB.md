# KNOWLEDGE_BOMB: Understanding and Implementing x402 in Python

This document provides a comprehensive overview of the x402 protocol and a practical guide to implementing it in Python for both server and client-side applications.

## What is x402?

x402 is an open payment standard that enables clients to pay for external resources. It provides a standardized mechanism for payments across different payment schemes, networks, and transport layers. The protocol is designed to be extensible and transport-agnostic, allowing it to be used in a variety of applications, including web APIs, AI agents, and more.

The protocol is built on three core components:

*   **Types**: Standardized data structures for payment requirements, payloads, and settlement responses.
*   **Logic**: Payment formation and verification logic that is specific to the payment scheme (e.g., "exact" scheme for EVM-based chains).
*   **Representation**: How payment data is transmitted and signaled, which is dependent on the transport mechanism (e.g., HTTP, MCP).

## How it Works: The Core Payment Flow

The x402 protocol follows a simple request-response cycle with integrated payment handling:

1.  **Client Request**: A client makes a request to a resource server.
2.  **Payment Required Response**: If the request does not include a valid payment, the server responds with a `402 Payment Required` status and a JSON payload containing the payment requirements. This payload details the acceptable payment methods, including the network, asset, amount, and recipient address.
3.  **Payment Authorization**: The client uses the payment requirements to construct and sign a payment authorization. This authorization is then included in a subsequent request to the server in the `X-Payment` header.
4.  **Settlement and Response**: The server receives the request, verifies the payment authorization using a facilitator service, and if valid, settles the payment on the blockchain. The server then returns the requested resource and includes the transaction details in the `X-Payment-Response` header.

## Python Server Setup (FastAPI)

Setting up a FastAPI server to require x402 payments is straightforward using the `x402` Python package.

### 1. Installation

First, install the necessary packages:

```bash
pip install x402 fastapi uvicorn python-dotenv
```

### 2. Configuration

Create a `.env` file to store your payment address:

```
ADDRESS="YOUR_ETHEREUM_ADDRESS"
```

### 3. Server Implementation

Create a `main.py` file and use the `require_payment` middleware to protect your API endpoints.

```python
import os
from typing import Any, Dict

from dotenv import load_dotenv
from fastapi import FastAPI
from x402.fastapi.middleware import require_payment

# Load environment variables
load_dotenv()

# Get configuration from environment
ADDRESS = os.getenv("ADDRESS")

if not ADDRESS:
    raise ValueError("Missing required environment variables")

app = FastAPI()

# Apply payment middleware to a specific route
app.middleware("http")(
    require_payment(
        path="/weather",
        price="$0.001",
        pay_to_address=ADDRESS,
        network="base-sepolia",
    )
)

@app.get("/weather")
async def get_weather() -> Dict[str, Any]:
    return {
        "report": {
            "weather": "sunny",
            "temperature": 70,
        }
    }

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=4021)
```

### 4. Running the Server

Run the server using `uvicorn`:

```bash
uvicorn main:app --reload
```

Your server will be running on `http://localhost:4021`, and the `/weather` endpoint will now require an x402 payment.

## Python Client Setup (httpx)

The `x402` package provides a convenient `x402HttpxClient` for making requests to x402-protected APIs.

### 1. Installation

Install the necessary packages:

```bash
pip install x402 httpx python-dotenv eth_account
```

### 2. Configuration

Create a `.env` file to store your private key and the server URL:

```
PRIVATE_KEY="YOUR_PRIVATE_KEY"
RESOURCE_SERVER_URL="http://localhost:4021"
ENDPOINT_PATH="/weather"
```

### 3. Client Implementation

Create a `client.py` file to make a request to the protected endpoint.

```python
import os
import asyncio
from dotenv import load_dotenv
from eth_account import Account
from x402.clients.httpx import x402HttpxClient
from x402.clients.base import decode_x_payment_response

# Load environment variables
load_dotenv()

# Get environment variables
private_key = os.getenv("PRIVATE_KEY")
base_url = os.getenv("RESOURCE_SERVER_URL")
endpoint_path = os.getenv("ENDPOINT_PATH")

if not all([private_key, base_url, endpoint_path]):
    print("Error: Missing required environment variables")
    exit(1)

# Create eth_account from private key
account = Account.from_key(private_key)
print(f"Initialized account: {account.address}")

async def main():
    # Create x402HttpxClient with built-in payment handling
    async with x402HttpxClient(account=account, base_url=base_url) as client:
        try:
            assert endpoint_path is not None
            print(f"Making request to {endpoint_path}")
            response = await client.get(endpoint_path)

            content = await response.aread()
            print(f"Response: {content.decode()}")

            if "X-Payment-Response" in response.headers:
                payment_response = decode_x_payment_response(
                    response.headers["X-Payment-Response"]
                )
                print(
                    f"Payment response transaction hash: {payment_response['transaction']}"
                )

        except Exception as e:
            print(f"Error occurred: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())
```

### 4. Running the Client

Run the client:

```bash
python client.py
```

The client will automatically handle the x402 payment flow, and you will see the response from the server, including the payment transaction hash.
