
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './layout';
import { Loader2 } from 'lucide-react';

/**
 * Root page of the application.
 * Its responsibility is to redirect the user to the correct starting route based on their auth state.
 */
export default function RootPage() {
    const router = useRouter();
    const { user, userRole, loading } = useAuth();
    
    useEffect(() => {
        if (loading) {
            return; // Wait until authentication state is loaded
        }

        if (user) {
            // User is logged in, redirect based on role
            if (userRole === 'admin' || userRole === 'operator') {
                router.replace('/dashboard/admin');
            } else if (userRole === 'unit') {
                router.replace('/mission');
            } else { // 'citizen' or anonymous
                router.replace('/dashboard');
            }
        } else {
            // No user is logged in, redirect to the auth page.
            router.replace('/auth');
        }
    }, [user, userRole, loading, router]);
    
    // Display a loader while redirecting.
    return (
        <div className="bg-slate-900 min-h-screen flex flex-col justify-center items-center text-white">
            <Loader2 className="w-12 h-12 animate-spin" />
            <p className="mt-4 text-lg">Cargando aplicación...</p>
        </div>
    );
}
