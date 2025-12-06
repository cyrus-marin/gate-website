# Gate402 Demo Quickstart

This guide will help you run the Gate402 frontend and a local demo API to test the scanning functionality.

## Prerequisites

- Node.js 18+
- npm

## 1. Setup Environment

Ensure you have a `.env.local` file with your Supabase credentials if you want to test the **Publish** functionality. For scanning only, this is not strictly required but recommended to avoid console errors.

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

## 2. Start the Application

Run the Next.js development server:

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## 3. Start the Demo API

We have included a sample API (OpenAPI JSON and HTML) in `tmp/demo-api`. To serve this locally so the app can scan it:

```bash
npx http-server tmp/demo-api -p 8081 --cors
```

This will serve:
- OpenAPI Spec: `http://localhost:8081/openapi.json`
- HTML Page: `http://localhost:8081/index.html`

## 4. Test Scanning

1. Open Gate402 at [http://localhost:3000](http://localhost:3000).
2. In the input field, enter one of the demo URLs:
   - `http://localhost:8081/openapi.json` (Tests OpenAPI parsing)
   - `http://localhost:8081/index.html` (Tests HTML scraping)
3. Click **Scan**.
4. You should see a modal with the detected endpoints.

## 5. Test Publishing

1. After scanning, review the endpoints in the modal.
2. Enter a Service Name and Description.
3. Click **Publish Service**.
4. If successful, you will be redirected to the Success page.
