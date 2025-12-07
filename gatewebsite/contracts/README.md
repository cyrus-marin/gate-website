# Gate402 Smart Contracts

This directory contains Solidity smart contracts for the Gate402 x402 protocol implementation on Monad testnet.

## Contracts

### APIRegistry.sol
Core registry contract that manages:
- API service registration with metadata (IPFS URIs)
- Endpoint definitions with per-endpoint pricing
- Provider revenue tracking
- Service activation/deactivation

**Key Functions:**
- `registerService()` - Register new API with on-chain metadata
- `addEndpoints()` - Add endpoint pricing details
- `updateService()` - Update metadata and rates
- `recordRevenue()` - Track usage and payments

### PaymentEscrow.sol
Payment handling contract that manages:
- Consumer deposits for API usage
- Payment processing via x402 gateway
- Provider revenue distribution
- Refund mechanisms

**Key Functions:**
- `deposit()` - Consumer deposits MON tokens
- `processPayment()` - Gateway deducts payment for API calls
- `withdraw()` - Provider withdraws earned revenue
- `refund()` - Consumer reclaims unused deposits

## Deployment

### Prerequisites
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

### Hardhat Configuration
Create `hardhat.config.ts`:
```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    monadTestnet: {
      url: process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz",
      accounts: [process.env.PRIVATE_KEY!],
      chainId: 10143,
    },
  },
  etherscan: {
    apiKey: {
      monadTestnet: process.env.MONAD_SCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "monadTestnet",
        chainId: 10143,
        urls: {
          apiURL: "https://testnet-api.monad.xyz/api",
          browserURL: "https://testnet-explorer.monad.xyz"
        }
      }
    ]
  }
};

export default config;
```

### Deploy Script
Create `contracts/deploy/deploy.ts`:
```typescript
import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Gate402 contracts to Monad Testnet...");

  // Deploy APIRegistry
  const APIRegistry = await ethers.getContractFactory("APIRegistry");
  const registry = await APIRegistry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log(`APIRegistry deployed to: ${registryAddress}`);

  // Deploy PaymentEscrow
  const PaymentEscrow = await ethers.getContractFactory("PaymentEscrow");
  const escrow = await PaymentEscrow.deploy(registryAddress);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log(`PaymentEscrow deployed to: ${escrowAddress}`);

  console.log("\nDeployment complete! Update .env.local with:");
  console.log(`NEXT_PUBLIC_REGISTRY_CONTRACT=${registryAddress}`);
  console.log(`NEXT_PUBLIC_ESCROW_CONTRACT=${escrowAddress}`);
  console.log(`NEXT_PUBLIC_MONAD_CHAIN_ID=10143`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

### Deploy Commands
```bash
# Compile contracts
npx hardhat compile

# Deploy to Monad Testnet
npx hardhat run contracts/deploy/deploy.ts --network monadTestnet

# Verify contracts (after deployment)
npx hardhat verify --network monadTestnet <REGISTRY_ADDRESS>
npx hardhat verify --network monadTestnet <ESCROW_ADDRESS> <REGISTRY_ADDRESS>
```

## Testing

### Local Testing
```bash
# Run Hardhat tests
npx hardhat test

# Run with gas reporting
REPORT_GAS=true npx hardhat test

# Test coverage
npx hardhat coverage
```

### Testnet Testing
1. Get testnet MON from faucet: https://faucet.monad.xyz
2. Deploy contracts using script above
3. Update frontend `.env.local` with contract addresses
4. Enable Web3 features: `NEXT_PUBLIC_ENABLE_WEB3=true`

## Integration with Frontend

After deployment, the frontend needs:
1. Contract addresses in `.env.local`
2. ABI files copied to `lib/abis/`
3. Web3 provider configured (wagmi/viem)
4. Wallet connection via RainbowKit

See `/lib/monad-config.ts` for network configuration.

## Security Considerations

⚠️ **These contracts are for testnet/demo purposes only**

Before mainnet deployment:
- Complete security audit
- Add access control for sensitive functions
- Implement oracle integration for usage metering
- Add pause/emergency stop mechanisms
- Test extensively on testnet
- Consider upgradeable proxy pattern

## Next Steps

1. Implement UsageOracle.sol for off-chain usage tracking
2. Build x402 gateway proxy server
3. Add IPFS integration for OpenAPI spec storage
4. Implement signature verification for API calls
5. Add batch payment processing for gas optimization
