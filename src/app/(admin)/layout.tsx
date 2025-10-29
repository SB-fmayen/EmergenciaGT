
"use client";

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/app/layout'; // Import from root layout

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userRole, loading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (loading) return; 

    const isLoginPage = pathname.startsWith('/login');

    if (!user && !isLoginPage) {
        // Not logged in and not on login page, redirect
        router.replace('/login');
        return;
    }

    if (user) {
        const isAdmin = userRole === 'admin';
        const isOperator = userRole === 'operator';
        const isUnit = userRole === 'unit';
        
        // If the user is not an admin, operator, or unit, they are a mobile user.
        // Kick them out to the mobile app's auth page.
        if (!isAdmin && !isOperator && !isUnit) {
            router.replace('/auth');
            return;
        }

        // Redirect unit role to mission page if they are not already there.
        if (isUnit && !pathname.startsWith('/mission')) {
            router.replace('/mission');
            return;
        }

        // If an admin or operator is on the login page, redirect them to their dashboard.
        if ((isAdmin || isOperator) && isLoginPage) {
            router.replace('/dashboard/admin');
            return;
        }
        
        // An 'operator' tries to access admin-only pages.
        if (isOperator) {
            const adminOnlyPages = ['/dashboard/stations', '/dashboard/users', '/dashboard/analytics'];
            if (adminOnlyPages.some(page => pathname.startsWith(page))) {
                toast({ title: "Acceso Denegado", description: "No tienes permisos para acceder a esta página.", variant: "destructive" });
                router.replace('/dashboard/admin');
            }
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userRole, loading, router, pathname, toast]);

  // Shows a loading screen while auth state is being determined.
  if (loading) {
    return (
      <div className="bg-slate-900 min-h-screen flex flex-col justify-center items-center text-white">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="mt-4 text-lg">Verificando sesión y permisos...</p>
      </div>
    );
  }

  // Prevents flashing protected content for non-logged-in users.
  // This is a special check for admin pages, as login is its own page.
  const isProtectedAdminPage = !pathname.startsWith('/login');
  if (!user && isProtectedAdminPage) {
     return (
       <div className="bg-slate-900 min-h-screen flex justify-center items-center">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
       </div>
    );
  }
  
  // Renders the children (the actual page) if all checks pass.
  return <>{children}</>;
}
