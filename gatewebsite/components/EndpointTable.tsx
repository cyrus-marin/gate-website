'use client';

import { cn } from '@/lib/utils';

export interface Endpoint {
    method: string;
    path: string;
    description?: string;
    rate?: number; // Legacy: Cost per request in cents (deprecated)
    rateUnit?: string; // e.g., 'per_request', 'per_1k_requests'
    rate_unit?: string; // Database field name (snake_case)
    token?: string; // Token symbol (MON, ETH, USDC, etc.)
    tokenAmount?: number; // Amount in token units
    token_amount?: number; // Database field name (snake_case)
}

interface EndpointTableProps {
    endpoints: Endpoint[];
    className?: string;
}

const METHOD_COLORS: Record<string, string> = {
    GET: 'text-monokai-blue',
    POST: 'text-monokai-green',
    PUT: 'text-monokai-orange',
    DELETE: 'text-monokai-pink',
    PATCH: 'text-monokai-purple',
};

function formatPrice(tokenAmount: number, token: string, unit: string): string {
    const unitText = unit === 'per_1k_requests' ? '1K requests' : unit === 'per_10k_requests' ? '10K requests' : 'request';
    return `${tokenAmount.toFixed(3)} ${token} / ${unitText}`;
}

export default function EndpointTable({ endpoints, className }: EndpointTableProps) {
    if (endpoints.length === 0) {
        return (
            <div className="text-center text-monokai-gray italic py-8">
                No endpoints found.
            </div>
        );
    }

    return (
        <div className={cn('overflow-hidden rounded-lg border border-monokai-gray', className)}>
            <table className="w-full text-left text-sm">
                <thead className="bg-monokai-gray/20 text-monokai-fg uppercase tracking-wider">
                    <tr>
                        <th className="px-6 py-3 font-bold">Method</th>
                        <th className="px-6 py-3 font-bold">Path</th>
                        <th className="px-6 py-3 font-bold">Description</th>
                        <th className="px-6 py-3 font-bold">Rate</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-monokai-gray/30 bg-monokai-bg">
                    {endpoints.map((endpoint, index) => {
                        const tokenAmount = endpoint.token_amount || endpoint.tokenAmount || 0;
                        const token = endpoint.token || 'MON';
                        const unit = endpoint.rate_unit || endpoint.rateUnit || 'per_request';
                        
                        return (
                            <tr key={index} className="hover:bg-monokai-gray/10 transition-colors">
                                <td className={cn('px-6 py-4 font-mono font-bold', METHOD_COLORS[endpoint.method.toUpperCase()] || 'text-monokai-fg')}>
                                    {endpoint.method.toUpperCase()}
                                </td>
                                <td className="px-6 py-4 font-mono text-monokai-fg">
                                    {endpoint.path}
                                </td>
                                <td className="px-6 py-4 text-monokai-gray">
                                    {endpoint.description || '-'}
                                </td>
                                <td className="px-6 py-4 font-mono text-monokai-green">
                                    {tokenAmount === 0 ? (
                                        <span className="text-monokai-gray">Free</span>
                                    ) : (
                                        formatPrice(tokenAmount, token, unit)
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
