-- Gate402 Database Schema
-- Run this in your Supabase SQL Editor

-- Create services table with user ownership
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create endpoints table with x402 rate support
CREATE TABLE IF NOT EXISTS endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    method TEXT NOT NULL,
    path TEXT NOT NULL,
    description TEXT,
    rate NUMERIC DEFAULT 0,
    rate_unit TEXT DEFAULT 'per_request',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create API usage tracking table for revenue calculation
CREATE TABLE IF NOT EXISTS api_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint_id UUID NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    request_count INTEGER DEFAULT 1,
    revenue_cents NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_endpoints_service_id ON endpoints(service_id);
CREATE INDEX IF NOT EXISTS idx_services_created_at ON services(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_service_id ON api_usage(service_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at DESC);

-- Enable Row Level Security
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Services policies
CREATE POLICY "Users can view all services" ON services FOR SELECT USING (true);
CREATE POLICY "Users can insert their own services" ON services FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own services" ON services FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own services" ON services FOR DELETE USING (auth.uid() = user_id);

-- Endpoints policies (inherit from services)
CREATE POLICY "Users can view all endpoints" ON endpoints FOR SELECT USING (true);
CREATE POLICY "Users can insert endpoints for their services" ON endpoints FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM services WHERE services.id = service_id AND services.user_id = auth.uid())
);
CREATE POLICY "Users can update endpoints for their services" ON endpoints FOR UPDATE USING (
    EXISTS (SELECT 1 FROM services WHERE services.id = service_id AND services.user_id = auth.uid())
);
CREATE POLICY "Users can delete endpoints for their services" ON endpoints FOR DELETE USING (
    EXISTS (SELECT 1 FROM services WHERE services.id = service_id AND services.user_id = auth.uid())
);

-- API usage policies
CREATE POLICY "Users can view their own usage data" ON api_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert usage data" ON api_usage FOR INSERT WITH CHECK (true);
