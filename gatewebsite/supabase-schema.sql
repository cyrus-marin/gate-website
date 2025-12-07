-- Gate402 Database Schema
-- Run this in your Supabase SQL Editor

-- ⚠️ RESET SCHEMA: Drop tables to ensure clean setup (CAUTION: Deletes all data)
DROP TABLE IF EXISTS api_usage CASCADE;
DROP TABLE IF EXISTS endpoints CASCADE;
DROP TABLE IF EXISTS services CASCADE;

-- Create services table with user ownership
-- user_id is TEXT to support both Supabase UUIDs and Web3 wallet addresses (0x...)
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create endpoints table with x402 rate support
CREATE TABLE endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    method TEXT NOT NULL,
    path TEXT NOT NULL,
    description TEXT,
    rate NUMERIC DEFAULT 0,
    rate_unit TEXT DEFAULT 'per_request',
    token TEXT DEFAULT 'MON',
    token_amount NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create API usage tracking table for revenue calculation
-- user_id is TEXT to support both Supabase UUIDs and Web3 wallet addresses (0x...)
CREATE TABLE api_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint_id UUID NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    request_count INTEGER DEFAULT 1,
    revenue_amount NUMERIC DEFAULT 0,
    revenue_token TEXT DEFAULT 'MON',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_endpoints_service_id ON endpoints(service_id);
CREATE INDEX idx_services_created_at ON services(created_at DESC);
CREATE INDEX idx_services_user_id ON services(user_id);
CREATE INDEX idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX idx_api_usage_service_id ON api_usage(service_id);
CREATE INDEX idx_api_usage_created_at ON api_usage(created_at DESC);

-- Enable Row Level Security
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Services policies (supports both Supabase UUIDs and Web3 wallet addresses)
CREATE POLICY "Users can view all services" ON services FOR SELECT USING (true);
CREATE POLICY "Users can insert their own services" ON services FOR INSERT WITH CHECK (
    auth.uid()::TEXT = user_id OR user_id LIKE '0x%'
);
CREATE POLICY "Users can update their own services" ON services FOR UPDATE USING (
    auth.uid()::TEXT = user_id OR user_id LIKE '0x%'
);
CREATE POLICY "Users can delete their own services" ON services FOR DELETE USING (
    auth.uid()::TEXT = user_id OR user_id LIKE '0x%'
);

-- Endpoints policies (inherit from services)
CREATE POLICY "Users can view all endpoints" ON endpoints FOR SELECT USING (true);
CREATE POLICY "Users can insert endpoints for their services" ON endpoints FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM services WHERE services.id = service_id AND (services.user_id = auth.uid()::TEXT OR services.user_id LIKE '0x%'))
);
CREATE POLICY "Users can update endpoints for their services" ON endpoints FOR UPDATE USING (
    EXISTS (SELECT 1 FROM services WHERE services.id = service_id AND (services.user_id = auth.uid()::TEXT OR services.user_id LIKE '0x%'))
);
CREATE POLICY "Users can delete endpoints for their services" ON endpoints FOR DELETE USING (
    EXISTS (SELECT 1 FROM services WHERE services.id = service_id AND (services.user_id = auth.uid()::TEXT OR services.user_id LIKE '0x%'))
);

-- API usage policies
CREATE POLICY "Users can view their own usage data" ON api_usage FOR SELECT USING (
    auth.uid()::TEXT = user_id OR user_id LIKE '0x%'
);
CREATE POLICY "System can insert usage data" ON api_usage FOR INSERT WITH CHECK (true);
