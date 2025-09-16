
"use client";

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/app/layout'; // Import from root layout
import { Loader2 } from 'lucide-react';


// This component handles the actual redirection and loading state logic.
export default function MobileLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userRole, loading } = useAuth();

  useEffect(() => {
    if (loading) return; 

    const isAuthPage = pathname.startsWith('/auth');

    if (user) {
        const isAdminRole = userRole === 'admin' || userRole === 'operator' || userRole === 'unit';
        // An admin/operator/unit is trying to access the mobile app pages.
        // Redirect them to their correct dashboard.
        if (isAdminRole) {
            if (userRole === 'unit') {
                router.replace('/mission');
            } else {
                router.replace('/dashboard/admin');
            }
            return;
        }

        // A regular user is logged in but on the auth page, send them to the dashboard.
        if (isAuthPage) {
            router.replace('/dashboard');
        }
    } else {
        // No user is logged in, they should be on the auth page.
        // If they are on any other mobile page, redirect them to auth.
        if (!isAuthPage) {
            router.replace('/auth');
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userRole, loading, router, pathname]);

  // Shows a loading screen while auth state is being determined.
  if (loading) {
    return (
      <div className="bg-slate-900 min-h-screen flex flex-col justify-center items-center text-white">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="mt-4 text-lg">Verificando sesión...</p>
      </div>
    );
  }
  
  // Renders the children (the actual page) if all checks pass.
  return <>{children}</>;
}
