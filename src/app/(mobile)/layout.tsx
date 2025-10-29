
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
        // Only 'admin' and 'operator' should be redirected to the admin dashboard.
        const isAdmin = userRole === 'admin' || userRole === 'operator';
        
        if (isAdmin) {
            router.replace('/dashboard/admin');
            return;
        }

        // 'unit' role should be redirected to the mission page.
        if (userRole === 'unit') {
            router.replace('/mission');
            return;
        }

        // For any other authenticated user (e.g., 'user', or no role defined yet),
        // if they are on the auth page, redirect them to the mobile dashboard.
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

  // If we are still loading the initial auth state, we show a spinner.
  // This should only happen on the first load of the mobile section.
  // Also, we don't show the loader for the auth page itself, as it has its own.
  if (loading && !pathname.startsWith('/auth')) {
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
