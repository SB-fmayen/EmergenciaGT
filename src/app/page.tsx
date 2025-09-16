
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from './layout';

/**
 * Root page of the application.
 * Its primary responsibility is to redirect the user to the correct starting route
 * based on their authentication state and role.
 */
export default function RootPage() {
    const router = useRouter();
    const { user, userRole, loading } = useAuth();
    
    useEffect(() => {
        if (loading) return; // Wait until auth state is determined

        if (user) {
             const isAdminRole = userRole === 'admin' || userRole === 'operator';
             if (isAdminRole) {
                 router.replace('/dashboard/admin');
             } else if (userRole === 'unit') {
                 router.replace('/mission');
             } else {
                 // Assumes 'citizen' or anonymous, redirect to their dashboard
                 router.replace('/dashboard');
             }
        } else {
            // No user, default to mobile auth flow
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
