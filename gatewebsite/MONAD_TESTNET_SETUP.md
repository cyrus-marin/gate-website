# Monad Testnet Testing Environment Setup

This guide will help you set up and test Gate402 on Monad's EVM-compatible testnet.

## Prerequisites

- Node.js 18+ installed
- MetaMask or compatible Web3 wallet
- Some testnet MON tokens (from faucet)

## Step 1: Get Testnet MON Tokens

### Option A: Discord Faucet
1. Join Monad Discord: https://discord.gg/monad
2. Navigate to #testnet-faucet channel
3. Use command: `/faucet <your-wallet-address>`
4. Wait for confirmation (usually instant)

### Option B: Web Faucet (if available)
1. Visit https://faucet.monad.xyz
2. Connect your wallet
3. Request testnet MON
4. Confirm transaction

You should receive 1-10 testnet MON tokens.

## Step 2: Add Monad Testnet to MetaMask

### Manual Configuration
1. Open MetaMask
2. Click network dropdown → "Add Network" → "Add a network manually"
3. Enter these details:
   ```
   Network Name: Monad Testnet
   RPC URL: https://testnet-rpc.monad.xyz
   Chain ID: 10143
   Currency Symbol: MON
   Block Explorer: https://testnet-explorer.monad.xyz
   ```
4. Click "Save"

### Automatic (via Chainlist)
1. Visit https://chainlist.org
2. Search for "Monad Testnet"
3. Click "Connect Wallet"
4. Approve the network addition in MetaMask

## Step 3: Install Dependencies

```bash
cd gate-website/gatewebsite

# Install Web3 libraries
npm install wagmi viem @rainbow-me/rainbowkit @tanstack/react-query

# Install Hardhat for contract deployment
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @nomicfoundation/hardhat-verify

# Install IPFS client (for metadata storage)
npm install ipfs-http-client
```

## Step 4: Configure Environment Variables

Create/update `.env.local`:
```bash
# Existing Supabase config
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# Monad Testnet Config
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_MONAD_CHAIN_ID=10143

# Contract addresses (update after deployment)
NEXT_PUBLIC_REGISTRY_CONTRACT=
NEXT_PUBLIC_ESCROW_CONTRACT=

# Feature flags
NEXT_PUBLIC_ENABLE_WEB3=true
NEXT_PUBLIC_ENABLE_X402=false  # Enable after contracts deployed

# Deployment (keep private!)
PRIVATE_KEY=your_wallet_private_key_for_deployment
MONAD_SCAN_API_KEY=your_monad_scan_key_if_available
```

⚠️ **NEVER commit `.env.local` to git!**

## Step 5: Deploy Smart Contracts

### Initialize Hardhat
```bash
# In contracts directory
npx hardhat init
# Select "Create a TypeScript project"
```

### Compile Contracts
```bash
npx hardhat compile
```

### Deploy to Monad Testnet
```bash
# Deploy contracts
npx hardhat run contracts/deploy/deploy.ts --network monadTestnet

# Copy output addresses to .env.local
# Example output:
# APIRegistry deployed to: 0x1234...
# PaymentEscrow deployed to: 0x5678...
```

### Verify Contracts (Optional)
```bash
npx hardhat verify --network monadTestnet <REGISTRY_ADDRESS>
npx hardhat verify --network monadTestnet <ESCROW_ADDRESS> <REGISTRY_ADDRESS>
```

## Step 6: Test the Flow

### A. Register an API On-Chain (Future Implementation)
```typescript
// When Web3 is enabled, publishing will:
1. Upload OpenAPI spec to IPFS
2. Call registry.registerService() with IPFS hash
3. Call registry.addEndpoints() with pricing
4. Store transaction hash in Supabase
```

### B. Test Payment Flow
```typescript
// Consumer deposits MON for API usage
await escrow.deposit(serviceId, { value: parseEther("0.1") });

// Check allowance
const hasAllowance = await escrow.checkAllowance(
  consumerAddress, 
  serviceId, 
  cost
);

// Gateway processes payment (after API call)
await escrow.processPayment(
  consumerAddress,
  serviceId,
  cost,
  requestCount
);

// Provider withdraws earnings
await escrow.withdraw();
```

### C. Verify On-Chain
1. Visit https://testnet-explorer.monad.xyz
2. Search for your contract addresses
3. View transactions, events, and state changes
4. Verify service registrations and payments

## Step 7: Monitor Testnet Activity

### View Your Transactions
- Explorer: https://testnet-explorer.monad.xyz/address/<your-address>
- See all contract interactions
- Check MON balance
- View gas usage

### Check Contract State
```bash
# Use Hardhat console
npx hardhat console --network monadTestnet

# Interact with contracts
const registry = await ethers.getContractAt("APIRegistry", "0x...");
const serviceCount = await registry.getServiceCount();
console.log("Total services:", serviceCount);
```

## Troubleshooting

### "Insufficient funds for gas"
- Get more testnet MON from faucet
- Check your wallet balance on explorer

### "Transaction reverted"
- Check contract addresses are correct
- Verify you're on Monad Testnet (chain ID 10143)
- Check gas limit settings

### "Network timeout"
- Monad testnet may be under maintenance
- Try different RPC URL if available
- Check Discord for status updates

### "Contract not deployed"
- Verify deployment transaction succeeded
- Check contract address on explorer
- Re-deploy if necessary

## Testing Checklist

- [ ] MetaMask connected to Monad Testnet
- [ ] Testnet MON tokens in wallet (>0.5 MON)
- [ ] Contracts compiled successfully
- [ ] Contracts deployed to testnet
- [ ] Contract addresses added to `.env.local`
- [ ] Frontend connects to Web3 wallet
- [ ] Can register service on-chain
- [ ] Can deposit funds to escrow
- [ ] Can process payments
- [ ] Can withdraw provider revenue
- [ ] Can view transactions on explorer

## Next Steps After Testing

1. **Build x402 Gateway Proxy**
   - Intercept API requests
   - Verify on-chain payment/allowance
   - Return HTTP 402 if insufficient funds
   - Forward request if valid
   - Record usage via oracle

2. **IPFS Integration**
   - Upload OpenAPI specs to IPFS
   - Store IPFS hash in smart contract
   - Retrieve and display specs in UI

3. **Signature Verification**
   - Consumer signs request with wallet
   - Gateway verifies signature
   - Prevents unauthorized API usage

4. **Oracle Implementation**
   - Off-chain usage metering
   - Periodic batch settlement
   - Gas-optimized payment processing

## Useful Resources

- Monad Docs: https://docs.monad.xyz
- Monad Discord: https://discord.gg/monad
- Monad Explorer: https://testnet-explorer.monad.xyz
- Hardhat Docs: https://hardhat.org/docs
- Wagmi Docs: https://wagmi.sh
- Viem Docs: https://viem.sh

## Support

If you encounter issues:
1. Check the Monad Discord #support channel
2. Review contract deployment logs
3. Verify network configuration
4. Check testnet status on Discord

Happy testing on Monad! 🚀
