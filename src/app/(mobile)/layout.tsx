
"use client";

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from "@/app/layout"; // Import from root layout now
import { useToast } from '@/hooks/use-toast';

function ProtectedMobileLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userRole, loading } = useAuth();
  const toast = useToast();
  
  const publicPaths = ['/auth', '/welcome'];

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === '/auth';

    if (user) {
        if (userRole === 'unit') {
            if (pathname !== '/mission') {
                router.replace('/mission');
            }
        } else if (userRole === 'citizen') {
             if (isAuthPage) {
                 router.replace('/dashboard');
             }
        } else if (userRole === 'admin' || userRole === 'operator') {
            // An admin or operator is trying to access the mobile app.
            // Log them out of this context and send to the correct login.
            if (!pathname.startsWith('/(admin)')) {
                // This scenario should be handled by the admin layout, but as a safeguard:
                router.replace('/login'); // Redirect to admin login
            }
        }
    } else {
        // User is not logged in
        if (!publicPaths.includes(pathname)) {
            router.replace('/auth');
        }
    }
    
  }, [user, userRole, loading, pathname, router, publicPaths]);

  if (loading) {
    return (
      <div className="bg-slate-900 min-h-screen flex flex-col justify-center items-center text-white">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="mt-4 text-lg">Verificando sesión...</p>
      </div>
    );
  }
  
  if (!user && !publicPaths.includes(pathname)) {
    return (
      <div className="bg-slate-900 min-h-screen flex flex-col justify-center items-center text-white">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="mt-4 text-lg">Redirigiendo...</p>
      </div>
    );
  }

  return <>{children}</>;
}


export default function MobileLayout({ children }: { children: ReactNode }) {
    return (
        <ProtectedMobileLayout>{children}</ProtectedMobileLayout>
    )
}
