
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from './(mobile)/layout'; 

/**
 * Root page of the application.
 * Its sole responsibility is to redirect the user to the correct route based on their authentication status.
 * It uses the AuthProvider from the (mobile) layout.
 */
export default function RootPage() {
    const router = useRouter();
    const { user, userRole, loading } = useAuth();
    
    useEffect(() => {
        if (loading) {
            return; // Wait until loading is finished
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
            // No user, redirect to the mobile app's login page.
            router.replace('/auth');
        }
    }, [user, userRole, loading, router]);
    
    // Display a loader while determining the redirect path.
    return (
        <div className="bg-slate-900 min-h-screen flex flex-col justify-center items-center text-white">
            <Loader2 className="w-12 h-12 animate-spin" />
            <p className="mt-4 text-lg">Cargando...</p>
        </div>
    );
}
