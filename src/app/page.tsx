
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

/**
 * Root page of the application.
 * Its primary responsibility is to redirect the user to the correct starting route.
 * For this application, the default entry point is the mobile authentication page.
 */
export default function RootPage() {
    const router = useRouter();
    
    useEffect(() => {
        // We check auth state to see if a user might be an admin/operator and redirect them
        // to the admin panel if so. Otherwise, we default to the mobile auth flow.
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const tokenResult = await user.getIdTokenResult();
                    // If the user has admin-related claims, send them to the admin dashboard.
                    if (tokenResult.claims.admin || tokenResult.claims.unit || tokenResult.claims.stationId) {
                         router.replace('/dashboard/admin');
                         return;
                    }
                } catch (e) {
                    // Ignore token errors, proceed to default mobile flow.
                }
            }
            // For any non-admin user or new visitor, the starting point is the mobile auth page.
            router.replace('/auth');
        });

        // Clean up the listener when the component unmounts.
        return () => unsubscribe();
    }, [router]);
    
    // Display a loader while redirecting.
    return (
        <div className="bg-slate-900 min-h-screen flex flex-col justify-center items-center text-white">
            <Loader2 className="w-12 h-12 animate-spin" />
            <p className="mt-4 text-lg">Cargando aplicación...</p>
        </div>
    );
}
