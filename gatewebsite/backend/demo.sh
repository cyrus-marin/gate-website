#!/bin/bash

# Gate402 x402 Protocol - Complete Demo
# This script demonstrates the full x402 payment flow with an AI agent

echo "════════════════════════════════════════════════════════════════"
echo "🚀 GATE402 x402 PROTOCOL - COMPLETE DEMO"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Check if server is running
echo "🔍 Checking if resource server is running..."
if curl -s http://localhost:8000/ > /dev/null 2>&1; then
    echo "✅ Resource server is running"
else
    echo "❌ Resource server is not running!"
    echo ""
    echo "Please start the server first:"
    echo "  cd backend"
    echo "  python main.py"
    echo ""
    exit 1
fi

# Check for published services
echo ""
echo "🔍 Checking for published services..."
SERVICE_COUNT=$(curl -s http://localhost:8000/services | python -c "import sys, json; print(json.load(sys.stdin)['count'])" 2>/dev/null || echo "0")

if [ "$SERVICE_COUNT" -eq "0" ]; then
    echo "⚠️  No services published yet!"
    echo ""
    echo "To publish services:"
    echo "  1. Go to http://localhost:3000"
    echo "  2. Sign in with email/password"
    echo "  3. Submit an API URL with OpenAPI spec"
    echo "  4. Configure pricing for endpoints"
    echo "  5. Click 'Publish'"
    echo ""
    echo "Then run this demo again!"
    exit 1
else
    echo "✅ Found $SERVICE_COUNT service(s) published"
fi

# Display services
echo ""
echo "📋 Available Services:"
curl -s http://localhost:8000/services | python -m json.tool | head -50

# Run AI agent
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "🤖 LAUNCHING AI AGENT"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "The agent will:"
echo "  1. Discover available API services"
echo "  2. Make paid requests using x402 protocol"
echo "  3. Record all blockchain transactions"
echo "  4. Generate activity report"
echo ""
read -p "Press Enter to launch the agent..."
echo ""

# Execute AI agent
python ai_agent.py

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ DEMO COMPLETED"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "🎯 What happened:"
echo "  • AI agent autonomously discovered APIs"
echo "  • Made paid requests with x402 payment protocol"
echo "  • Payments verified and settled on Base Sepolia blockchain"
echo "  • All transactions recorded with tx hashes"
echo ""
echo "🔗 View transactions on Monad Testnet Explorer:"
echo "   https://testnet-explorer.monad.xyz/address/0x8509cdc4f8b13d3792c1a5ad60f0faaa11753ca4"
echo ""
echo "════════════════════════════════════════════════════════════════"
