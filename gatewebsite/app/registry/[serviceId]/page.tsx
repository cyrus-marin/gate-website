'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import EndpointTable, { Endpoint } from '@/components/EndpointTable';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RegistryPage({ params }: { params: Promise<{ serviceId: string }> }) {
    const { serviceId } = use(params);
    const [service, setService] = useState<any>(null);
    const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch Service
                const { data: serviceData, error: serviceError } = await supabase
                    .from('services')
                    .select('*')
                    .eq('id', serviceId)
                    .single();

                if (serviceError) throw serviceError;
                setService(serviceData);

                // Fetch Endpoints
                const { data: endpointsData, error: endpointsError } = await supabase
                    .from('endpoints')
                    .select('*')
                    .eq('service_id', serviceId);

                if (endpointsError) throw endpointsError;
                setEndpoints(endpointsData || []);
            } catch (err) {
                console.error(err);
                setError('Failed to load service details');
            } finally {
                setLoading(false);
            }
        }

        if (serviceId) {
            fetchData();
        }
    }, [serviceId]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-monokai-pink" />
            </div>
        );
    }

    if (error || !service) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4">
                <h1 className="text-2xl font-bold text-monokai-pink">Error</h1>
                <p className="text-monokai-gray">{error || 'Service not found'}</p>
                <Link href="/" className="text-monokai-blue hover:underline">
                    Go Home
                </Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen p-8 md:p-16">
            <div className="mx-auto max-w-4xl space-y-8">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-monokai-gray hover:text-monokai-fg transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                </Link>

                <div className="space-y-4 border-b border-monokai-gray/30 pb-8">
                    <h1 className="text-4xl font-bold text-monokai-fg">{service.name}</h1>
                    <p className="text-xl text-monokai-gray">{service.description}</p>
                    <div className="flex gap-4 text-sm text-monokai-gray/70">
                        <span>ID: {service.id}</span>
                        <span>Created: {new Date(service.created_at).toLocaleDateString()}</span>
                    </div>
                </div>

                <div>
                    <h2 className="mb-6 text-2xl font-bold text-monokai-blue">Endpoints</h2>
                    <EndpointTable endpoints={endpoints} />
                </div>
            </div>
        </main>
    );
}
