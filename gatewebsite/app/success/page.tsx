'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { Suspense } from 'react';

function SuccessContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');

    return (
        <div className="max-w-md space-y-6 rounded-2xl border border-monokai-green/30 bg-monokai-bg p-8 shadow-[0_0_50px_-12px] shadow-monokai-green/20">
            <div className="flex justify-center">
                <CheckCircle className="h-20 w-20 text-monokai-green" />
            </div>
            <h1 className="text-3xl font-bold text-monokai-fg">Published Successfully!</h1>
            <p className="text-monokai-gray">
                Your service has been registered to the Gate402 network.
            </p>

            <div className="pt-6">
                {id ? (
                    <Link
                        href={`/registry/${id}`}
                        className="inline-block w-full rounded-lg bg-monokai-blue px-6 py-3 font-bold text-monokai-bg transition-transform hover:scale-105"
                    >
                        View in Registry
                    </Link>
                ) : (
                    <Link
                        href="/"
                        className="inline-block w-full rounded-lg bg-monokai-gray px-6 py-3 font-bold text-white transition-transform hover:scale-105"
                    >
                        Back to Home
                    </Link>
                )}
            </div>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
            <Suspense fallback={
                <div className="max-w-md space-y-6 rounded-2xl border border-monokai-green/30 bg-monokai-bg p-8 shadow-[0_0_50px_-12px] shadow-monokai-green/20">
                    <div className="flex justify-center">
                        <CheckCircle className="h-20 w-20 text-monokai-green" />
                    </div>
                    <h1 className="text-3xl font-bold text-monokai-fg">Published Successfully!</h1>
                    <p className="text-monokai-gray">Loading...</p>
                </div>
            }>
                <SuccessContent />
            </Suspense>
        </main>
    );
}
