'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    walletAddress: string | null;
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signInWithWallet: (address: string, signature: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for Web3 wallet session in localStorage
        const storedWallet = localStorage.getItem('web3_wallet');
        if (storedWallet) {
            setWalletAddress(storedWallet);
            setLoading(false);
            return;
        }

        // Get initial Supabase session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { error };
    };

    const signUp = async (email: string, password: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
        });
        return { error };
    };

    const signInWithWallet = async (address: string, signature: string) => {
        try {
            // Store wallet address in localStorage for session persistence
            localStorage.setItem('web3_wallet', address);
            localStorage.setItem('web3_signature', signature);
            setWalletAddress(address);
            
            // Create/update user in Supabase database via API
            const response = await fetch('/api/auth/wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address, signature }),
            });

            if (!response.ok) {
                throw new Error('Failed to authenticate with wallet');
            }

            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const signOut = async () => {
        // Clear Web3 wallet session
        localStorage.removeItem('web3_wallet');
        localStorage.removeItem('web3_signature');
        setWalletAddress(null);
        
        // Sign out from Supabase
        await supabase.auth.signOut();
    };

    // User is authenticated if they have either a Supabase session or Web3 wallet
    const effectiveUser = walletAddress ? ({ id: walletAddress, email: `${walletAddress}@web3.local` } as User) : user;

    return (
        <AuthContext.Provider value={{ 
            user: effectiveUser, 
            session, 
            loading, 
            walletAddress,
            signIn, 
            signUp, 
            signInWithWallet,
            signOut 
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
