'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { signIn, signUp } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { error } = mode === 'signin' 
                ? await signIn(email, password)
                : await signUp(email, password);

            if (error) {
                setError(error.message);
            } else {
                if (mode === 'signup') {
                    setError('Check your email for the confirmation link!');
                } else {
                    onSuccess?.();
                    onClose();
                }
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80" onClick={onClose} />
            <div className="relative w-full max-w-md rounded-lg border border-monokai-gray bg-monokai-bg p-6 shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-monokai-gray hover:text-monokai-fg transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                <h2 className="mb-6 text-2xl font-bold text-monokai-fg">
                    {mode === 'signin' ? 'Sign In' : 'Sign Up'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-bold text-monokai-gray">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full rounded-lg border border-monokai-gray bg-monokai-bg/50 px-4 py-2 text-monokai-fg focus:border-monokai-pink focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-bold text-monokai-gray">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full rounded-lg border border-monokai-gray bg-monokai-bg/50 px-4 py-2 text-monokai-fg focus:border-monokai-pink focus:outline-none"
                        />
                    </div>

                    {error && (
                        <div className={cn(
                            "rounded-lg p-3 text-sm",
                            mode === 'signup' && error.includes('email') 
                                ? "bg-monokai-green/20 text-monokai-green"
                                : "bg-monokai-pink/20 text-monokai-pink"
                        )}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-monokai-pink px-6 py-3 font-bold text-white transition-transform hover:scale-105 disabled:opacity-50"
                    >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {mode === 'signin' ? 'Sign In' : 'Sign Up'}
                    </button>
                </form>

                <div className="mt-4 text-center text-sm text-monokai-gray">
                    {mode === 'signin' ? (
                        <>
                            Don't have an account?{' '}
                            <button
                                onClick={() => {
                                    setMode('signup');
                                    setError('');
                                }}
                                className="text-monokai-blue hover:underline"
                            >
                                Sign Up
                            </button>
                        </>
                    ) : (
                        <>
                            Already have an account?{' '}
                            <button
                                onClick={() => {
                                    setMode('signin');
                                    setError('');
                                }}
                                className="text-monokai-blue hover:underline"
                            >
                                Sign In
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
