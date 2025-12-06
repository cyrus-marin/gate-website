'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, ArrowRight } from 'lucide-react';

interface CTAInputProps {
    onSubmit: (value: string) => void;
    placeholder?: string;
    buttonText?: string;
    isLoading?: boolean;
    className?: string;
}

export default function CTAInput({
    onSubmit,
    placeholder = 'Enter URL...',
    buttonText = 'Scan',
    isLoading = false,
    className,
}: CTAInputProps) {
    const [value, setValue] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (value.trim()) {
            onSubmit(value);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className={cn('flex w-full max-w-lg items-center gap-2', className)}
        >
            <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                disabled={isLoading}
                className="flex-1 rounded-lg border-2 border-monokai-gray bg-monokai-bg px-4 py-3 text-monokai-fg placeholder:text-monokai-gray focus:border-monokai-pink focus:outline-none focus:ring-1 focus:ring-monokai-pink disabled:opacity-50"
            />
            <button
                type="submit"
                disabled={isLoading || !value.trim()}
                className="flex items-center gap-2 rounded-lg bg-monokai-pink px-6 py-3.5 font-bold text-white transition-transform hover:scale-105 hover:bg-opacity-90 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
            >
                {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    <>
                        {buttonText}
                        <ArrowRight className="h-5 w-5" />
                    </>
                )}
            </button>
        </form>
    );
}
