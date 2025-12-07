'use client';

import { cn } from '@/lib/utils';
import { Endpoint } from './EndpointTable';

interface EndpointRateEditorProps {
    endpoints: Endpoint[];
    allEndpoints?: Endpoint[];
    startIndex?: number;
    onEndpointsChange: (endpoints: Endpoint[]) => void;
    className?: string;
}

const METHOD_COLORS: Record<string, string> = {
    GET: 'text-monokai-blue',
    POST: 'text-monokai-green',
    PUT: 'text-monokai-orange',
    DELETE: 'text-monokai-pink',
    PATCH: 'text-monokai-purple',
};

export default function EndpointRateEditor({ endpoints, allEndpoints, startIndex = 0, onEndpointsChange, className }: EndpointRateEditorProps) {
    const updateEndpoint = (index: number, field: keyof Endpoint, value: any) => {
        const updated = [...endpoints];
        updated[index] = { ...updated[index], [field]: value };
        onEndpointsChange(updated);
    };

    if (endpoints.length === 0) {
        return (
            <div className="text-center text-monokai-gray italic py-8">
                No endpoints found.
            </div>
        );
    }

    return (
        <div className={cn('space-y-3', className)}>
            {endpoints.map((endpoint, index) => (
                <div
                    key={index}
                    className="rounded-lg border border-monokai-gray/30 bg-monokai-bg p-4 space-y-3"
                >
                    <div className="flex items-start gap-3">
                        <span
                            className={cn(
                                'font-mono font-bold text-sm px-2 py-1 rounded',
                                METHOD_COLORS[endpoint.method.toUpperCase()] || 'text-monokai-fg'
                            )}
                        >
                            {endpoint.method.toUpperCase()}
                        </span>
                        <div className="flex-1">
                            <div className="font-mono text-monokai-fg break-all">{endpoint.path}</div>
                            {endpoint.description && (
                                <div className="text-sm text-monokai-gray mt-1">{endpoint.description}</div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pl-[4.5rem]">
                        <div>
                            <label className="block text-xs font-bold text-monokai-gray mb-1">
                                💰 Token
                            </label>
                            <select
                                value={endpoint.token || 'MON'}
                                onChange={(e) => updateEndpoint(index, 'token', e.target.value)}
                                className="w-full rounded border border-monokai-gray/50 bg-monokai-bg/50 px-3 py-1.5 text-sm text-monokai-fg focus:border-monokai-pink focus:outline-none"
                            >
                                <option value="MON">MON</option>
                                <option value="ETH">ETH</option>
                                <option value="USDC">USDC</option>
                                <option value="USDT">USDT</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-monokai-gray mb-1">
                                💵 Amount
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.001"
                                value={endpoint.tokenAmount || ''}
                                onChange={(e) => updateEndpoint(index, 'tokenAmount', parseFloat(e.target.value) || 0)}
                                placeholder="0.000"
                                className="w-full rounded border border-monokai-gray/50 bg-monokai-bg/50 px-3 py-1.5 text-sm text-monokai-fg placeholder:text-monokai-gray/50 focus:border-monokai-pink focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-monokai-gray mb-1">
                                Per
                            </label>
                            <select
                                value={endpoint.rateUnit || 'per_request'}
                                onChange={(e) => updateEndpoint(index, 'rateUnit', e.target.value)}
                                className="w-full rounded border border-monokai-gray/50 bg-monokai-bg/50 px-3 py-1.5 text-sm text-monokai-fg focus:border-monokai-pink focus:outline-none"
                            >
                                <option value="per_request">Request</option>
                                <option value="per_1k_requests">1K Requests</option>
                                <option value="per_10k_requests">10K Requests</option>
                            </select>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
