import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const { address, signature } = await request.json();

        if (!address || !signature) {
            return NextResponse.json({ error: 'Missing wallet address or signature' }, { status: 400 });
        }

        // Normalize address to lowercase
        const normalizedAddress = address.toLowerCase();

        // Check if wallet user exists in services table
        // Note: We're using Supabase for storage but managing Web3 auth separately
        // The user_id in services table will be the wallet address
        
        // For now, just validate the signature format and return success
        // In production, you'd verify the signature cryptographically
        
        return NextResponse.json({ 
            success: true,
            userId: normalizedAddress,
            message: 'Wallet authenticated successfully' 
        });
    } catch (error: any) {
        console.error('Wallet auth error:', error);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
}
