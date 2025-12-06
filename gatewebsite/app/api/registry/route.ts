import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        // Check if Supabase is configured
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            console.warn('Supabase not configured, returning empty services list');
            return NextResponse.json({ services: [] });
        }

        // Fetch all services with their endpoint counts
        const { data: services, error: servicesError } = await supabase
            .from('services')
            .select('*')
            .order('created_at', { ascending: false });

        if (servicesError) {
            console.error('Services fetch error:', servicesError);
            // Return empty array instead of error for better UX
            return NextResponse.json({ services: [] });
        }

        // Fetch endpoint counts for each service
        const servicesWithCounts = await Promise.all(
            (services || []).map(async (service) => {
                const { count, error } = await supabase
                    .from('endpoints')
                    .select('*', { count: 'exact', head: true })
                    .eq('service_id', service.id);

                return {
                    ...service,
                    endpoint_count: error ? 0 : count || 0,
                };
            })
        );

        return NextResponse.json({ services: servicesWithCounts });
    } catch (error) {
        console.error('Registry error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
