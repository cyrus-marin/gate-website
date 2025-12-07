import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    try {
        // Check if Supabase is configured
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            return NextResponse.json({ 
                error: 'Database not configured. Please set up Supabase and run the schema migration.' 
            }, { status: 503 });
        }

        const { serviceName, description, endpoints } = await request.json();

        if (!serviceName || !endpoints || !Array.isArray(endpoints)) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        // Get auth token from headers (could be Supabase token or Web3 wallet address)
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        let userId: string;
        
        // Check if token is a Web3 wallet address (starts with 0x)
        if (token.startsWith('0x') && token.length === 42) {
            // Web3 wallet authentication
            userId = token.toLowerCase(); // Normalize wallet address
        } else {
            // Supabase token authentication
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    global: {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    },
                }
            );

            const { data: { user }, error: authError } = await supabase.auth.getUser();
            
            if (authError || !user) {
                return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
            }
            
            userId = user.id;
        }

        // Create Supabase client for database operations
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // 1. Insert Service with user_id (works for both Supabase UUIDs and wallet addresses)
        const { data: service, error: serviceError } = await supabase
            .from('services')
            .insert({ 
                name: serviceName, 
                description,
                user_id: userId 
            })
            .select()
            .single();

        if (serviceError) {
            console.error('Service insert error:', serviceError);
            return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
        }

        // 2. Insert Endpoints with x402 rate information
        const endpointsToInsert = endpoints.map((ep: any) => ({
            service_id: service.id,
            method: ep.method,
            path: ep.path,
            description: ep.description,
            rate: ep.rate || 0, // Legacy field
            rate_unit: ep.rateUnit || 'per_request',
            token: ep.token || 'MON',
            token_amount: ep.tokenAmount || 0,
        }));

        const { error: endpointsError } = await supabase
            .from('endpoints')
            .insert(endpointsToInsert);

        if (endpointsError) {
            console.error('Endpoints insert error:', endpointsError);
            return NextResponse.json({ error: 'Failed to create endpoints' }, { status: 500 });
        }

        // TODO: Implement x402 protocol headers
        // The x402 protocol would add HTTP 402 Payment Required responses
        // with headers like:
        // - X-402-Rate: rate value in cents
        // - X-402-Unit: rate unit (per_request, per_1k_requests, etc.)
        // - X-402-Payment-Address: payment endpoint or wallet address
        // This would be implemented in a proxy/gateway layer that sits
        // in front of the registered APIs

        return NextResponse.json({ success: true, serviceId: service.id });
    } catch (error) {
        console.error('Publish error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
