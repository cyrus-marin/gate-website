# Supabase Setup Instructions

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in project details and wait for it to be created

## 2. Get Your Credentials

1. Go to **Project Settings** → **API**
2. Copy the following:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")

## 3. Configure Environment Variables

Create a `.env.local` file in the project root with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 4. Run the Database Migration

1. In your Supabase project, go to **SQL Editor**
2. Click "New Query"
3. Copy the contents of `supabase-schema.sql`
4. Paste into the query editor
5. Click "Run" or press `Ctrl+Enter`

This will create:
- `services` table (id, name, description, created_at)
- `endpoints` table (id, service_id, method, path, description, rate, rate_unit, created_at)
- Proper indexes for performance
- Foreign key relationships

## 5. (Optional) Enable Public Access

If you want to allow public read/write without authentication, uncomment the RLS policies in the SQL file:

```sql
-- Uncomment these lines:
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to services" ON services FOR SELECT USING (true);
CREATE POLICY "Allow public read access to endpoints" ON endpoints FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to services" ON services FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert access to endpoints" ON endpoints FOR INSERT WITH CHECK (true);
```

## 6. Restart Your Dev Server

```bash
npm run dev
```

## 7. Test the Application

1. Visit `http://localhost:3000`
2. Enter a URL to scan (e.g., `http://127.0.0.1:8081`)
3. Set prices for endpoints
4. Click "Publish Service"
5. Visit `/registry` to see your published APIs

## Troubleshooting

**Error: "Failed to fetch services"**
- Check that your `.env.local` file exists and has correct credentials
- Verify the SQL migration ran successfully
- Check browser console for detailed errors

**Error: "Database not configured"**
- Make sure `.env.local` file is in the project root
- Restart the dev server after creating `.env.local`

**Error: "relation 'services' does not exist"**
- Run the SQL migration in Supabase SQL Editor
- Verify tables were created in **Table Editor**
