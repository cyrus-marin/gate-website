'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft, TrendingUp, DollarSign, Activity, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiceWithStats {
    id: string;
    name: string;
    description: string;
    created_at: string;
    endpoint_count: number;
    total_revenue: number;
    total_requests: number;
}

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [services, setServices] = useState<ServiceWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [totalRequests, setTotalRequests] = useState(0);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
            return;
        }

        if (user) {
            fetchDashboardData();
        }
    }, [user, authLoading, router]);

    const fetchDashboardData = async () => {
        try {
            // Fetch user's services
            const { data: servicesData, error: servicesError } = await supabase
                .from('services')
                .select('*')
                .eq('user_id', user!.id)
                .order('created_at', { ascending: false });

            if (servicesError) throw servicesError;

            // For each service, get endpoint count and usage stats
            const servicesWithStats = await Promise.all(
                (servicesData || []).map(async (service) => {
                    // Get endpoint count
                    const { count: endpointCount } = await supabase
                        .from('endpoints')
                        .select('*', { count: 'exact', head: true })
                        .eq('service_id', service.id);

                    // Get usage stats (aggregate revenue and requests)
                    const { data: usageData } = await supabase
                        .from('api_usage')
                        .select('revenue_cents, request_count')
                        .eq('service_id', service.id);

                    const totalRevenue = (usageData || []).reduce((sum, u) => sum + Number(u.revenue_cents || 0), 0);
                    const totalRequests = (usageData || []).reduce((sum, u) => sum + Number(u.request_count || 0), 0);

                    return {
                        ...service,
                        endpoint_count: endpointCount || 0,
                        total_revenue: totalRevenue,
                        total_requests: totalRequests,
                    };
                })
            );

            setServices(servicesWithStats);

            // Calculate overall totals
            const overallRevenue = servicesWithStats.reduce((sum, s) => sum + s.total_revenue, 0);
            const overallRequests = servicesWithStats.reduce((sum, s) => sum + s.total_requests, 0);
            setTotalRevenue(overallRevenue);
            setTotalRequests(overallRequests);
        } catch (err: any) {
            console.error(err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-monokai-pink" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4">
                <h1 className="text-2xl font-bold text-monokai-pink">Error</h1>
                <p className="text-monokai-gray">{error}</p>
                <Link href="/" className="text-monokai-blue hover:underline">
                    Go Home
                </Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen p-8 md:p-16">
            <div className="mx-auto max-w-6xl space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-monokai-gray hover:text-monokai-fg transition-colors mb-4"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Home
                        </Link>
                        <h1 className="text-4xl font-bold text-monokai-fg">Dashboard</h1>
                        <p className="text-monokai-gray mt-2">{user?.email}</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="rounded-xl border border-monokai-gray/30 bg-monokai-gray/10 p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <DollarSign className="h-5 w-5 text-monokai-green" />
                            <h3 className="text-sm font-bold text-monokai-gray uppercase">Total Revenue</h3>
                        </div>
                        <p className="text-3xl font-bold text-monokai-green">
                            ${(totalRevenue / 100).toFixed(2)}
                        </p>
                    </div>

                    <div className="rounded-xl border border-monokai-gray/30 bg-monokai-gray/10 p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Activity className="h-5 w-5 text-monokai-blue" />
                            <h3 className="text-sm font-bold text-monokai-gray uppercase">Total Requests</h3>
                        </div>
                        <p className="text-3xl font-bold text-monokai-blue">
                            {totalRequests.toLocaleString()}
                        </p>
                    </div>

                    <div className="rounded-xl border border-monokai-gray/30 bg-monokai-gray/10 p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <TrendingUp className="h-5 w-5 text-monokai-pink" />
                            <h3 className="text-sm font-bold text-monokai-gray uppercase">Active APIs</h3>
                        </div>
                        <p className="text-3xl font-bold text-monokai-pink">
                            {services.length}
                        </p>
                    </div>
                </div>

                {/* Services List */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-monokai-blue">Your APIs</h2>
                        <Link
                            href="/"
                            className="rounded-lg bg-monokai-pink px-4 py-2 text-sm font-bold text-white transition-transform hover:scale-105"
                        >
                            Register New API
                        </Link>
                    </div>

                    {services.length === 0 ? (
                        <div className="rounded-xl border border-monokai-gray/30 bg-monokai-gray/10 p-12 text-center">
                            <p className="text-monokai-gray mb-4">You haven't registered any APIs yet.</p>
                            <Link
                                href="/"
                                className="inline-block rounded-lg bg-monokai-green px-6 py-3 font-bold text-monokai-bg transition-transform hover:scale-105"
                            >
                                Register Your First API
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {services.map((service) => (
                                <Link
                                    key={service.id}
                                    href={`/registry/${service.id}`}
                                    className="block rounded-xl border border-monokai-gray/30 bg-monokai-gray/10 p-6 transition-all hover:border-monokai-pink hover:bg-monokai-gray/20"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-xl font-bold text-monokai-fg">{service.name}</h3>
                                                <ExternalLink className="h-4 w-4 text-monokai-gray" />
                                            </div>
                                            <p className="text-sm text-monokai-gray mb-4">
                                                {service.description || 'No description provided'}
                                            </p>
                                            <div className="flex flex-wrap gap-4 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-monokai-gray">Endpoints:</span>
                                                    <span className="font-mono font-bold text-monokai-blue">
                                                        {service.endpoint_count}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-monokai-gray">Requests:</span>
                                                    <span className="font-mono font-bold text-monokai-blue">
                                                        {service.total_requests.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-monokai-gray">Revenue:</span>
                                                    <span className="font-mono font-bold text-monokai-green">
                                                        ${(service.total_revenue / 100).toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-monokai-gray">Created:</span>
                                                    <span className="font-mono text-monokai-gray/70">
                                                        {new Date(service.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
