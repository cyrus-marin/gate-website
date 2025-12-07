# Web3 Wallet Authentication Migration

## Overview
This migration updates the database schema to support both Supabase email/password authentication AND Web3 wallet authentication.

## Changes Required

### 1. Database Schema Updates
The `user_id` column in `services` and `api_usage` tables must be changed from `UUID` (with FK to auth.users) to `TEXT` to support both:
- Supabase user UUIDs (e.g., `550e8400-e29b-41d4-a716-446655440000`)
- Web3 wallet addresses (e.g., `0x742d35cc6634c0532925a3b844bc9e7595f0beb2`)

### 2. Migration SQL (Run in Supabase SQL Editor)

```sql
-- If you have an EXISTING database with data:

-- Step 1: Convert user_id columns to TEXT
ALTER TABLE services 
  DROP CONSTRAINT IF EXISTS services_user_id_fkey,
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

ALTER TABLE api_usage 
  DROP CONSTRAINT IF EXISTS api_usage_user_id_fkey,
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Step 2: Update RLS policies to work with TEXT user_id
DROP POLICY IF EXISTS "Users can insert own services" ON services;
DROP POLICY IF EXISTS "Users can update own services" ON services;
DROP POLICY IF EXISTS "Users can delete own services" ON services;
DROP POLICY IF EXISTS "Users can view own services" ON services;

-- Recreate policies with TEXT comparison
CREATE POLICY "Users can insert own services" ON services
    FOR INSERT WITH CHECK (
        user_id = auth.uid()::TEXT OR 
        user_id LIKE '0x%'  -- Allow Web3 wallet addresses
    );

CREATE POLICY "Users can update own services" ON services
    FOR UPDATE USING (
        user_id = auth.uid()::TEXT OR 
        user_id LIKE '0x%'
    );

CREATE POLICY "Users can delete own services" ON services
    FOR DELETE USING (
        user_id = auth.uid()::TEXT OR 
        user_id LIKE '0x%'
    );

CREATE POLICY "Users can view own services" ON services
    FOR SELECT USING (
        user_id = auth.uid()::TEXT OR 
        user_id LIKE '0x%'
    );
```

### 3. Fresh Install
If you're setting up a new database, simply run the updated `supabase-schema.sql` file which already has these changes.

## How It Works

### Web3 Authentication Flow
1. User clicks "Connect Web3 Wallet" in AuthModal
2. MetaMask prompts user to connect wallet
3. User signs a message to prove ownership
4. Frontend stores wallet address in localStorage
5. AuthContext exposes wallet address as `user.id`
6. Publish API accepts wallet address as Bearer token
7. Services are stored with wallet address as `user_id`
8. Dashboard queries by wallet address

### Dual Authentication Support
- **Email/Password Users**: Use Supabase session token, `user_id` is UUID from auth.users
- **Web3 Wallet Users**: Use wallet address as token, `user_id` is 0x... address

### Frontend Detection
```typescript
// In AuthContext
const effectiveUser = walletAddress 
  ? { id: walletAddress, email: `${walletAddress}@web3.local` } 
  : user;
```

### Backend Detection
```typescript
// In /api/publish
if (token.startsWith('0x') && token.length === 42) {
  userId = token.toLowerCase(); // Web3 wallet
} else {
  // Validate Supabase token
  const { user } = await supabase.auth.getUser();
  userId = user.id;
}
```

## Testing

### Test Web3 Flow
1. Start dev server: `npm run dev`
2. Click "Sign In" → "Connect Web3 Wallet"
3. Approve MetaMask connection and sign message
4. Scan an API (e.g., http://localhost:8081)
5. Set prices and publish
6. Check dashboard for your services
7. Verify in Supabase: `SELECT * FROM services WHERE user_id LIKE '0x%'`

### Test Email Flow
1. Click "Sign In" → Enter email/password → Sign In
2. Scan, publish, check dashboard (existing flow)

## Security Notes

### Current Implementation (MVP)
- ✅ Wallet address stored in localStorage
- ✅ Signature generated but NOT verified on backend
- ✅ Basic access control via user_id matching
- ⚠️ No cryptographic signature verification
- ⚠️ No nonce/timestamp replay protection

### Production Requirements
1. **Signature Verification**: Verify `personal_sign` signature on backend
   ```typescript
   import { verifyMessage } from 'viem';
   const isValid = await verifyMessage({
     address: walletAddress,
     message: originalMessage,
     signature: providedSignature
   });
   ```

2. **Nonce System**: Prevent replay attacks
   - Generate random nonce per sign-in attempt
   - Store nonce in Redis/database with expiration
   - Verify nonce hasn't been used before

3. **Timestamp Validation**: Expire old signatures
   ```typescript
   const signedAt = extractTimestampFromMessage(message);
   if (Date.now() - signedAt > 5 * 60 * 1000) {
     throw new Error('Signature expired');
   }
   ```

4. **Smart Contract Wallet Support**: Handle EIP-1271 signatures for contract wallets like Gnosis Safe

## Rollback Plan
If you need to revert to Supabase-only auth:

```sql
-- Restore FK constraints
ALTER TABLE services 
  ALTER COLUMN user_id TYPE UUID USING user_id::UUID,
  ADD CONSTRAINT services_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE api_usage 
  ALTER COLUMN user_id TYPE UUID USING user_id::UUID,
  ADD CONSTRAINT api_usage_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

Note: This will DELETE all services created by Web3 wallets since they won't have matching auth.users entries.

## Environment Variables
No new environment variables required. Web3 authentication uses browser's `window.ethereum` (MetaMask).

Optional feature flag (already set in `lib/monad-config.ts`):
```bash
NEXT_PUBLIC_ENABLE_WEB3=true  # Enable Web3 wallet button
```

## Next Steps
After migration is complete:
1. [ ] Test both auth flows thoroughly
2. [ ] Deploy contracts to Monad testnet (see MONAD_TESTNET_SETUP.md)
3. [ ] Implement signature verification (see X402_IMPLEMENTATION_ROADMAP.md Phase 2)
4. [ ] Add nonce/timestamp validation
5. [ ] Connect to smart contract registry instead of Supabase
