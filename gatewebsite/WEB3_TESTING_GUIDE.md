# Web3 Wallet Authentication - Testing Guide

## Prerequisites

### 1. Update Database Schema
Run the updated SQL in your Supabase SQL Editor:
```bash
# Copy contents of supabase-schema.sql and run in Supabase dashboard
```

**OR** if you have existing data, run the migration:
```bash
# See WEB3_MIGRATION.md for migration SQL commands
```

### 2. Install MetaMask
- Chrome/Brave: https://metamask.io/download/
- Firefox/Edge: Install from respective stores

### 3. Start Dev Server
```bash
npm run dev
```

### 4. (Optional) Start Demo API Server
```bash
npx http-server tmp/demo-api -p 8081 --cors
```

## Test Cases

### ✅ Test 1: Web3 Wallet Sign In

**Steps:**
1. Go to http://localhost:3000
2. Click "Sign In" button
3. Click "Connect Web3 Wallet" (purple button with wallet icon)
4. MetaMask popup appears - click "Connect"
5. MetaMask asks to sign message - click "Sign"
6. Modal closes automatically

**Expected Results:**
- ✅ "Sign In" button changes to wallet address (e.g., `0x742d...0beb2`)
- ✅ No errors in browser console
- ✅ `localStorage` contains `web3_wallet` and `web3_signature`

**Verify in Console:**
```javascript
localStorage.getItem('web3_wallet')
// Should return: "0x742d35cc6634c0532925a3b844bc9e7595f0beb2"
```

---

### ✅ Test 2: Scan API with Wallet Authentication

**Steps:**
1. Complete Test 1 (sign in with wallet)
2. Enter demo API URL: `http://localhost:8081`
3. Click "Scan Website"

**Expected Results:**
- ✅ Modal opens showing endpoints
- ✅ "Showing 1-10 of X endpoints" appears (if >10 endpoints)
- ✅ Pagination works (Previous/Next buttons)

**Troubleshooting:**
- If modal doesn't open, check Network tab for `/api/scan` errors
- If "Unauthorized", wallet auth may not be recognized - check `user` in auth context

---

### ✅ Test 3: Set Prices and Publish with Wallet

**Steps:**
1. After scanning, modal shows endpoints
2. Set rates for a few endpoints:
   - Endpoint 1: 10 cents, per_request
   - Endpoint 2: 50 cents, per_1k_requests
3. Fill in:
   - Service Name: "My Test API"
   - Description: "Testing Web3 wallet publishing"
4. Click "Publish to Registry"

**Expected Results:**
- ✅ Success page redirects to `/success?id=<uuid>`
- ✅ "View Dashboard" button visible

**Debug:**
```javascript
// Check published API in Supabase
// Go to Supabase Dashboard → Table Editor → services
// Should see new row with user_id = your wallet address (0x...)
```

---

### ✅ Test 4: View Dashboard with Wallet

**Steps:**
1. Complete Test 3
2. Click "View Dashboard" or navigate to `/dashboard`

**Expected Results:**
- ✅ Dashboard loads (no redirect to home)
- ✅ Stats cards show:
  - Total Revenue: $0.00 (mock data)
  - Total Requests: 0
  - Active APIs: 1
- ✅ "My Test API" appears in services list
- ✅ Endpoints visible under service

**Verify in Supabase:**
```sql
-- Run in Supabase SQL Editor
SELECT * FROM services WHERE user_id LIKE '0x%';
SELECT e.* FROM endpoints e 
  JOIN services s ON e.service_id = s.id 
  WHERE s.user_id LIKE '0x%';
```

---

### ✅ Test 5: Sign Out and Session Persistence

**Steps:**
1. After signing in with wallet, refresh page (F5)
2. Check if still signed in
3. Click wallet address → "Sign Out"
4. Refresh page again

**Expected Results:**
- ✅ After refresh, still signed in (wallet address visible)
- ✅ After sign out, "Sign In" button reappears
- ✅ After refresh post-signout, not signed in

**Debug:**
```javascript
// Check localStorage
localStorage.getItem('web3_wallet')  // Should be null after sign out
```

---

### ✅ Test 6: Email/Password Still Works

**Steps:**
1. If signed in with wallet, sign out first
2. Click "Sign In"
3. Enter email/password (or create new account)
4. Click "Sign In"

**Expected Results:**
- ✅ Modal closes, user signed in with email
- ✅ Can scan, publish, view dashboard normally
- ✅ Services created with Supabase UUID as user_id

**Verify Dual Auth:**
```sql
-- Should see both wallet addresses (0x...) and UUIDs
SELECT user_id, name FROM services;
```

---

### ✅ Test 7: Multiple Wallets (User Isolation)

**Steps:**
1. Sign in with Wallet A (0xAAA...)
2. Publish "API Service A"
3. Sign out
4. Sign in with Wallet B (0xBBB...) - use MetaMask account switcher
5. View dashboard

**Expected Results:**
- ✅ Wallet B's dashboard is empty (doesn't see Wallet A's services)
- ✅ Wallet B can publish own services
- ✅ Each wallet has isolated data

---

### ✅ Test 8: Registry Page (Public View)

**Steps:**
1. Navigate to http://localhost:3000/registry
2. View all published APIs

**Expected Results:**
- ✅ All services visible (from both wallet and email users)
- ✅ Can click "View Details" on any service
- ✅ Service detail page shows endpoints with prices

---

## Common Issues & Fixes

### Issue: "Please sign in to publish"
**Cause:** AuthContext not recognizing wallet user  
**Fix:**
1. Check browser console for errors
2. Verify `localStorage.getItem('web3_wallet')` has value
3. Check `/api/auth/wallet` returns success

### Issue: "Failed to create service" (500 error)
**Cause:** Database schema not updated  
**Fix:**
1. Run updated `supabase-schema.sql` in Supabase SQL Editor
2. Verify `user_id` is TEXT, not UUID with FK constraint:
   ```sql
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'services' AND column_name = 'user_id';
   -- Should show: user_id | text | NO
   ```

### Issue: MetaMask doesn't popup
**Cause:** MetaMask not installed or `window.ethereum` unavailable  
**Fix:**
1. Install MetaMask extension
2. Refresh page
3. Check console: `console.log(window.ethereum)`

### Issue: Wallet connected but can't scan/publish
**Cause:** Frontend not recognizing wallet as authenticated user  
**Fix:**
1. Check `lib/auth-context.tsx` has `effectiveUser` logic:
   ```typescript
   const effectiveUser = walletAddress 
     ? { id: walletAddress, email: `${walletAddress}@web3.local` } as User
     : user;
   ```
2. Verify `useAuth()` returns `user` with wallet address as `id`

### Issue: Dashboard shows no services after wallet publish
**Cause:** Dashboard querying by wrong user_id  
**Fix:**
1. Verify query uses `user!.id` (not `user!.email`)
2. Check Supabase: `SELECT * FROM services WHERE user_id = '0x...'`
3. Ensure RLS policies allow wallet users:
   ```sql
   user_id LIKE '0x%'
   ```

## Network Tab Debugging

### Successful Wallet Auth Flow
1. **Connect Wallet** → No API calls (localStorage only)
2. **Scan API** → `POST /api/scan` with no auth (public endpoint)
3. **Publish** → `POST /api/publish` with `Authorization: Bearer 0x742d...`
   - Response: `{ success: true, serviceId: "uuid" }`
4. **View Dashboard** → `GET /dashboard` → Supabase query by wallet address

### Failed Auth Example
```
POST /api/publish
Authorization: Bearer 0x742d35cc6634c0532925a3b844bc9e7595f0beb2
Response: 401 Unauthorized
Body: { error: "Unauthorized. Please sign in." }
```
**Diagnosis:** Publish route not recognizing wallet token. Check `app/api/publish/route.ts` has wallet detection:
```typescript
if (token.startsWith('0x') && token.length === 42) {
  userId = token.toLowerCase();
}
```

## Production Checklist

Before deploying to production:
- [ ] Implement signature verification (see WEB3_MIGRATION.md)
- [ ] Add nonce system to prevent replay attacks
- [ ] Add timestamp validation (expire old signatures)
- [ ] Rate limit wallet sign-in attempts
- [ ] Deploy smart contracts to Monad testnet
- [ ] Switch from localStorage to smart contract registry
- [ ] Add EIP-1271 support for contract wallets
- [ ] Set up monitoring for failed auth attempts
- [ ] Add CAPTCHA for sign-in to prevent bot attacks

## Next Steps

After successful testing:
1. ✅ Web3 wallet authentication working
2. 🔄 Deploy contracts to Monad testnet (see MONAD_TESTNET_SETUP.md)
3. 🔄 Implement signature verification
4. 🔄 Connect smart contract registry
5. 🔄 Implement x402 payment gateway

See `X402_IMPLEMENTATION_ROADMAP.md` for full production roadmap.
