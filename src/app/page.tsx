
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Root page of the application.
 * Its sole responsibility is to redirect the user to the correct starting route.
 * For this application, the starting point is always the mobile authentication page.
 */
export default function RootPage() {
    const router = useRouter();
    
    useEffect(() => {
        // The root page's only job is to redirect to the mobile auth flow.
        // The auth page and subsequent layouts will handle role-based redirection.
        router.replace('/auth');
    }, [router]);
    
    // Display a loader while redirecting.
    // This is wrapped in a full-page layout to be consistent.
    return (
        <div className="bg-slate-900 min-h-screen flex flex-col justify-center items-center text-white">
            <svg className="animate-spin h-12 w-12 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-lg">Cargando aplicación...</p>
        </div>
    );
}
