'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, ArrowLeft, ExternalLink } from 'lucide-react';

interface Service {
    id: string;
    name: string;
    description: string;
    created_at: string;
    endpoint_count: number;
}

export default function RegistryPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchServices() {
            try {
                const res = await fetch('/api/registry');
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || 'Failed to fetch services');
                }

                setServices(data.services || []);
            } catch (err: any) {
                console.error(err);
                setError(err.message || 'Failed to load registry');
            } finally {
                setLoading(false);
            }
        }

        fetchServices();
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-monokai-pink" />
            </div>
        );
    }

    return (
        <main className="min-h-screen p-8 md:p-16">
            <div className="mx-auto max-w-6xl space-y-8">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-monokai-gray hover:text-monokai-fg transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                </Link>

                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold text-monokai-fg text-glow">
                        API Registry
                    </h1>
                    <p className="text-xl text-monokai-gray">
                        Browse all APIs registered on the <span className="text-monokai-blue">Agentic Internet</span>
                    </p>
                </div>

                {error ? (
                    <div className="rounded-lg border border-monokai-pink/30 bg-monokai-pink/10 p-6 text-center">
                        <p className="text-monokai-pink">{error}</p>
                    </div>
                ) : services.length === 0 ? (
                    <div className="rounded-lg border border-monokai-gray/30 bg-monokai-gray/10 p-12 text-center">
                        <p className="text-monokai-gray text-lg">No APIs registered yet.</p>
                        <Link
                            href="/"
                            className="mt-4 inline-block rounded-lg bg-monokai-pink px-6 py-3 font-bold text-white transition-transform hover:scale-105"
                        >
                            Register Your First API
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {services.map((service) => (
                            <Link
                                key={service.id}
                                href={`/registry/${service.id}`}
                                className="group rounded-xl border border-monokai-gray/30 bg-monokai-gray/10 p-6 transition-all hover:border-monokai-pink hover:bg-monokai-gray/20 hover:scale-105"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <h2 className="text-xl font-bold text-monokai-fg group-hover:text-monokai-pink transition-colors">
                                            {service.name}
                                        </h2>
                                        <ExternalLink className="h-4 w-4 text-monokai-gray group-hover:text-monokai-pink flex-shrink-0" />
                                    </div>
                                    
                                    <p className="text-sm text-monokai-gray line-clamp-2">
                                        {service.description || 'No description provided'}
                                    </p>

                                    <div className="flex items-center justify-between pt-2 border-t border-monokai-gray/20">
                                        <span className="text-xs text-monokai-gray">
                                            {service.endpoint_count} endpoint{service.endpoint_count !== 1 ? 's' : ''}
                                        </span>
                                        <span className="text-xs text-monokai-gray">
                                            {new Date(service.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
