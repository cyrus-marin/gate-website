# Gate402 - Copilot Instructions

## Project Overview
Gate402 is an API registry for the "Agentic Internet" - a Next.js 16 frontend with Supabase authentication that allows users to scan APIs (OpenAPI specs) and publish them with x402 pricing for AI agent discovery.

**Core Flow:** User signs in → Submits website URL → `/api/scan` finds `/openapi.json` & extracts endpoints → Modal review with per-endpoint rate specification → `/api/publish` saves to Supabase with x402 rates → Dashboard shows revenue

## Architecture

### Frontend (Next.js 16 + React 19)
- **App Router** with TypeScript, client components dominate (`'use client'`)
- **Styling**: Tailwind CSS v4 with custom Monokai theme (see `app/globals.css`)
- **State**: React `useState` for UI state, no global state manager
- **Authentication**: Supabase Auth with custom AuthContext (`lib/auth-context.tsx`)
- **Data Fetching**: Native `fetch` API, no React Query usage despite installation

### Backend Services
- **API Routes** (`app/api/*`): Next.js route handlers
  - `scan/route.ts`: Parses OpenAPI JSON or scrapes HTML anchors
  - `publish/route.ts`: Inserts services + endpoints to Supabase (requires auth)
  - `registry/route.ts`: Lists all published services
- **Python Backend** (`backend/`): FastAPI server with x402 integration (currently unused by frontend)

### Database (Supabase)
Schema with Row Level Security (RLS) enabled:
- `services` table: `id`, `user_id` (FK to auth.users), `name`, `description`, `created_at`
- `endpoints` table: `id`, `service_id` (FK), `method`, `path`, `description`, `rate` (cents), `rate_unit` (per_request/per_1k_requests/per_10k_requests)
- `api_usage` table: `id`, `endpoint_id`, `service_id`, `user_id`, `request_count`, `revenue_cents`, `created_at`

### Authentication
- **Supabase Auth**: Email/password authentication
- **AuthContext**: Global auth state (`lib/auth-context.tsx`)
- **Protected Routes**: Dashboard requires authentication
- **RLS Policies**: Users can only insert/update/delete their own services

## Key Conventions

### Styling Patterns
- **Monokai Color System**: Use semantic color vars (`text-monokai-pink`, `bg-monokai-bg`)
  - Pink (#F92672): CTAs, accents
  - Green (#A6E22E): Success, POST
  - Blue (#66D9EF): Links, GET
  - Orange (#FD971F): Warnings, PUT
  - Purple (#AE81FF): Info, PATCH
- **Custom Utilities**: `text-glow` class for neon effect on headings
- **Tailwind Merge**: Use `cn()` utility from `lib/utils.ts` for conditional classes

### Component Patterns
```tsx
// All components use this structure:
'use client';
import { cn } from '@/lib/utils';

interface ComponentProps {
  // Props here
}

export default function Component({ ...props }: ComponentProps) {
  // Implementation
}
```

### Data Flow
1. **URL Processing**: User submits website URL → scan tries direct URL, then appends `/openapi.json` if not JSON
2. **Scanning**: Parse `json.paths` object (OpenAPI spec)
3. **Endpoints Shape**: `{ method: string; path: string; description?: string; rate?: number; rateUnit?: string }`
4. **Rate Specification**: User sets per-endpoint rates in modal using `EndpointRateEditor` component
5. **Publishing**: Atomic operation - insert service first, then batch insert endpoints with x402 rate data

## Development Workflows

### Local Development
```bash
npm run dev  # Starts Next.js on :3000
```

### Testing Scan Feature
```bash
# Terminal 1: Next.js dev server
npm run dev

# Terminal 2: Serve demo API
npx http-server tmp/demo-api -p 8081 --cors

# Test URLs:
# http://localhost:8081 (Auto-discovers /openapi.json)
# http://localhost:8081/openapi.json (Direct OpenAPI spec)
```

### Environment Setup
Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=<your-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-key>
```

## Critical Implementation Details

### OpenAPI Discovery & Parsing Logic (`app/api/scan/route.ts`)
- Accepts website URLs (e.g., `https://mycompany.com`) - automatically tries appending `/openapi.json`
- Falls back to direct URL if no OpenAPI spec found at standard location
- Only extracts from `json.paths` - does not support OpenAPI 3.1 `webhooks` or components
- Uses `details.summary || details.description` for endpoint descriptions

### x402 Protocol Integration
- Rates stored in cents per `rate_unit` (per_request, per_1k_requests, per_10k_requests)
- `EndpointRateEditor` component provides UI for setting per-endpoint rates
- Published to Supabase `endpoints` table with `rate` and `rate_unit` columns
- Future: x402 headers (X-402-Rate, X-402-Unit) would be implemented in proxy/gateway layer

### Error Handling Pattern
```tsx
try {
  const res = await fetch('/api/...');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Default message');
  // Handle success
} catch (error: any) {
  console.error(error);
  alert(error.message || 'Fallback message');
}
```
**Always** parse `data.error` from response before throwing.

### Modal Component Quirks
- Uses `createPortal` to `document.body` - requires `mounted` state check for SSR safety
- Auto-locks body scroll when open (`document.body.style.overflow`)
- Animation classes: `animate-in fade-in zoom-in-95 duration-200` (Tailwind v4 syntax)

## Common Tasks

### Adding New API Routes
1. Create `app/api/<name>/route.ts`
2. Export async `POST` function (GET not used in this project)
3. Use `NextResponse.json()` for responses
4. Import Supabase from `@/lib/supabase` (already initialized)

### Adding New Pages
- Use `app/<route>/page.tsx` convention
- Dynamic routes: `[param]` folders, access via `use(params)` in React 19
- See `app/registry/[serviceId]/page.tsx` for reference

### Styling New Components
- Always import `cn` from `@/lib/utils` for className merging
- Use `monokai-*` colors, never hardcode hex values
- Button pattern: `rounded-lg px-6 py-3 transition-transform hover:scale-105`
- Loading states: `<Loader2 className="h-5 w-5 animate-spin" />` from `lucide-react`

### Supabase Queries
```typescript
// Single insert with return
const { data, error } = await supabase
  .from('table')
  .insert({ ... })
  .select()
  .single();

// Batch insert (no return needed)
const { error } = await supabase
  .from('table')
  .insert([{ ... }, { ... }]);

// Query with filter
const { data } = await supabase
  .from('table')
  .select('*')
  .eq('id', value);
```

## Project-Specific Gotchas
- **React Query Installed But Unused**: Direct fetch calls are preferred pattern
- **Backend Folder Ignored**: Python FastAPI server exists but isn't integrated with frontend
- **No Auth Implementation**: Supabase client uses anon key, no RLS policies referenced
- **Naive HTML Parsing**: Production use requires proper HTML parser (jsdom/cheerio)
- **HTTP-Server CORS**: Demo API server needs `--cors` flag or requests fail from :3000
