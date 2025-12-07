"""
Gate402 FastAPI Backend - x402 Protocol Resource Server
Dynamically loads services from Supabase and creates payment-protected proxy endpoints
following the official x402 protocol standard
"""

from fastapi import FastAPI, Request, HTTPException, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
from dotenv import load_dotenv
from typing import Dict, List, Optional, Any
from supabase import create_client, Client
import logging
from contextlib import asynccontextmanager
import json

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
PAYMENT_ADDRESS = os.getenv("ADDRESS", "0x8509cdc4f8b13d3792c1a5ad60f0faaa11753ca4")
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
DEFAULT_NETWORK = os.getenv("NETWORK", "monad-testnet")

if not PAYMENT_ADDRESS:
    raise ValueError("ADDRESS environment variable is required")
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase credentials are required")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


class ServiceRegistry:
    """Manages loading and caching of services from Supabase"""
    
    def __init__(self):
        self.services: Dict = {}
        self.endpoints: Dict = {}
        self.service_paths: Dict[str, str] = {}  # Maps path to service_id
        
    async def load_services(self):
        """Load all active services and their endpoints from Supabase"""
        try:
            # Fetch all services
            services_response = supabase.table("services").select("*").execute()
            
            if not services_response.data:
                logger.warning("No services found in database")
                return
            
            # Fetch all endpoints
            endpoints_response = supabase.table("endpoints").select("*").execute()
            
            # Organize data
            for service in services_response.data:
                service_id = service["id"]
                service_name = service["name"]
                self.services[service_id] = service
                
                # Create URL-friendly path from service name
                service_path = service_name.lower().replace(" ", "-")
                self.service_paths[service_path] = service_id
                
                # Get endpoints for this service
                service_endpoints = [
                    ep for ep in endpoints_response.data 
                    if ep["service_id"] == service_id
                ]
                self.endpoints[service_id] = service_endpoints
                
            logger.info(f"Loaded {len(self.services)} services with endpoints")
            
        except Exception as e:
            logger.error(f"Error loading services: {e}")
            raise
    
    def get_service_by_id(self, service_id: str) -> Optional[Dict]:
        """Get service by ID"""
        return self.services.get(service_id)
    
    def get_service_by_path(self, path: str) -> Optional[Dict]:
        """Get service by URL path"""
        service_id = self.service_paths.get(path)
        if service_id:
            return self.services.get(service_id)
        return None
    
    def get_endpoints_for_service(self, service_id: str) -> List[Dict]:
        """Get all endpoints for a service"""
        return self.endpoints.get(service_id, [])
    
    def get_all_services(self) -> List[Dict]:
        """Get all services"""
        return list(self.services.values())


# Global registry instance
registry = ServiceRegistry()


# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager - load services on startup"""
    logger.info("Starting Gate402 x402 Resource Server...")
    await registry.load_services()
    logger.info(f"Service registry loaded: {len(registry.services)} services")
    logger.info("x402 payment protection will be applied via middleware to paid endpoints")
    
    yield  # Application runs here
    
    # Cleanup on shutdown
    logger.info("Shutting down Gate402 Resource Server")


# Initialize FastAPI app with lifespan
app = FastAPI(
    title="Gate402 x402 Resource Server",
    description="Resource server with x402 payment protection for registered API services",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import x402 middleware components
from x402.fastapi.middleware import require_payment
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest
from starlette.responses import Response as StarletteResponse


class DynamicX402Middleware(BaseHTTPMiddleware):
    """
    Dynamic x402 middleware that checks if a path requires payment
    and applies x402 protection accordingly
    """
    
    async def dispatch(self, request: StarletteRequest, call_next):
        # Check if this path requires payment
        path = request.url.path
        method = request.method
        
        # Skip free endpoints
        if path in ["/", "/services", "/admin/reload"] or path.startswith("/services/"):
            return await call_next(request)
        
        # Check if path matches a paid endpoint
        for service_id, service in registry.services.items():
            service_name = service["name"]
            service_path = service_name.lower().replace(" ", "-")
            endpoints = registry.get_endpoints_for_service(service_id)
            
            for endpoint in endpoints:
                token_amount = endpoint.get("token_amount", 0)
                token = endpoint.get("token", "MON")
                endpoint_path = f"/{service_path}{endpoint['path']}"
                
                if path == endpoint_path and method == endpoint["method"].upper() and token_amount > 0:
                    # This endpoint requires payment - apply x402 protection
                    # Format price with token symbol
                    price_str = f"{token_amount} {token}"
                    
                    # Use x402's require_payment middleware
                    x402_middleware = require_payment(
                        path=endpoint_path,
                        price=price_str,
                        pay_to_address=PAYMENT_ADDRESS,
                        network=DEFAULT_NETWORK,
                    )
                    
                    # Apply the x402 middleware to this request
                    return await x402_middleware(request, call_next)
        
        # No payment required - continue
        return await call_next(request)


# Apply the dynamic x402 middleware
app.add_middleware(DynamicX402Middleware)


@app.get("/")
async def root():
    """Health check endpoint - free, no payment required"""
    return {
        "message": "Gate402 x402 Resource Server",
        "status": "online",
        "protocol": "x402",
        "services": len(registry.services),
        "payment_address": PAYMENT_ADDRESS,
        "network": DEFAULT_NETWORK
    }


@app.get("/services")
async def list_services():
    """List all available services with pricing - free endpoint"""
    services_data = []
    
    for service in registry.get_all_services():
        service_name = service["name"]
        service_path = service_name.lower().replace(" ", "-")
        endpoints = registry.get_endpoints_for_service(service["id"])
        
        endpoints_info = []
        for ep in endpoints:
            token_amount = ep.get("token_amount", 0)
            token = ep.get("token", "MON")
            endpoints_info.append({
                "method": ep["method"],
                "path": f"/{service_path}{ep['path']}",
                "price": f"{token_amount} {token}" if token_amount > 0 else "FREE",
                "token_amount": token_amount,
                "token": token,
                "rate_unit": ep.get("rate_unit", "per_request"),
                "description": ep.get("description", "")
            })
        
        services_data.append({
            "id": service["id"],
            "name": service["name"],
            "description": service.get("description", ""),
            "base_path": f"/{service_path}",
            "endpoints": endpoints_info
        })
    
    return {
        "services": services_data,
        "count": len(registry.services),
        "payment_address": PAYMENT_ADDRESS,
        "network": DEFAULT_NETWORK
    }


@app.get("/services/{service_id}")
async def get_service_details(service_id: str):
    """Get details for a specific service - free endpoint"""
    service = registry.get_service_by_id(service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    service_name = service["name"]
    service_path = service_name.lower().replace(" ", "-")
    endpoints = registry.get_endpoints_for_service(service_id)
    
    endpoints_info = []
    for ep in endpoints:
        token_amount = ep.get("token_amount", 0)
        token = ep.get("token", "MON")
        endpoints_info.append({
            "method": ep["method"],
            "path": f"/{service_path}{ep['path']}",
            "price": f"{token_amount} {token}" if token_amount > 0 else "FREE",
            "token_amount": token_amount,
            "token": token,
            "rate_unit": ep.get("rate_unit", "per_request"),
            "description": ep.get("description", "")
        })
    
    return {
        "service": {
            "id": service["id"],
            "name": service["name"],
            "description": service.get("description", ""),
            "base_path": f"/{service_path}",
        },
        "endpoints": endpoints_info,
        "payment_address": PAYMENT_ADDRESS,
        "network": DEFAULT_NETWORK
    }


# Dynamic service endpoints are created via x402 middleware in lifespan
# The middleware automatically handles:
# 1. Returning 402 Payment Required with x402 JSON payload
# 2. Verifying payment authorization in X-Payment header
# 3. Settling payment on blockchain
# 4. Returning X-Payment-Response header with transaction details

# Example: For a service "Weather API" with endpoint GET /current
# Accessible at: GET /weather-api/current
# If rate > 0, x402 middleware will protect it automatically


@app.api_route("/{service_path}/{endpoint_path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def service_endpoint(service_path: str, endpoint_path: str, request: Request) -> Dict[str, Any]:
    """
    Dynamic endpoint for all services - x402 protection applied via decorator per endpoint
    The x402 middleware handles payment verification automatically for paid endpoints
    """
    method = request.method
    return await handle_service_request(service_path, endpoint_path, method, request)


async def handle_service_request(
    service_path: str, 
    endpoint_path: str, 
    method: str,
    request: Request
) -> Dict[str, Any]:
    """
    Handle service requests after x402 payment verification
    This function is only called AFTER the x402 middleware has verified payment
    """
    # Get service from registry
    service = registry.get_service_by_path(service_path)
    if not service:
        raise HTTPException(status_code=404, detail=f"Service '{service_path}' not found")
    
    # Get endpoints for this service
    endpoints = registry.get_endpoints_for_service(service["id"])
    
    # Normalize paths for comparison
    normalized_endpoint_path = "/" + endpoint_path.strip("/")
    
    # Find matching endpoint
    matching_endpoint = None
    for ep in endpoints:
        ep_path = ep["path"].strip("/")
        if ep["method"].upper() == method.upper() and ep_path == endpoint_path.strip("/"):
            matching_endpoint = ep
            break
    
    if not matching_endpoint:
        raise HTTPException(
            status_code=404, 
            detail=f"Endpoint {method} {normalized_endpoint_path} not found for service {service['name']}"
        )
    
    # At this point, payment has been verified by x402 middleware
    # TODO: Proxy to actual API endpoint in production
    
    token_amount = matching_endpoint.get("token_amount", 0)
    token = matching_endpoint.get("token", "MON")
    
    return {
        "success": True,
        "message": f"Successfully accessed {service['name']}",
        "endpoint": f"{method} {normalized_endpoint_path}",
        "service": service["name"],
        "price_paid": f"{token_amount} {token}" if token_amount > 0 else "FREE",
        "token_amount": token_amount,
        "token": token,
        "note": "Payment verified via x402 protocol. In production, this would proxy to the actual API.",
        "mock_data": {
            "status": "operational",
            "timestamp": "2025-12-06T00:00:00Z",
            "service_info": service.get("description", "")
        }
    }


@app.post("/admin/reload")
async def reload_services():
    """Reload services from Supabase (admin endpoint) - free"""
    try:
        await registry.load_services()
        return {
            "message": "Services reloaded successfully",
            "count": len(registry.services)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
