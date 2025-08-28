
"use client";

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { useAdmin, AdminProvider } from '@/hooks/useAdmin';


function ProtectedLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userRole, loading } = useAdmin();

  useEffect(() => {
    if (loading) return;

    if (!user && pathname !== '/login') {
      router.push('/login');
    }
    
    if (user && pathname === '/login') {
      router.push('/dashboard/admin');
    }

    // Role-based protection for stations page
    if (user && userRole === 'operator' && pathname === '/dashboard/stations') {
        router.push('/dashboard/admin'); // Redirect operators away from admin-only pages
    }

  }, [user, userRole, loading, router, pathname]);

  if (loading) {
    return (
      <div className="bg-slate-900 min-h-screen flex flex-col justify-center items-center text-white">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="mt-4 text-lg">Verificando sesión y permisos...</p>
      </div>
    );
  }

  // Allow access to login page for unauthenticated users, or any page for authenticated users.
  // The role check above will handle redirection for unauthorized roles.
  if (!user && pathname === '/login') {
     return <>{children}</>;
  }

  if (user) {
     return <>{children}</>;
  }

  return (
       <div className="bg-slate-900 min-h-screen flex justify-center items-center">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
       </div>
  );
}


/**
 * Layout principal para el panel de administración.
 * Protege las rutas de administración y proporciona un diseño de página completa.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <AdminProvider>
            <ProtectedLayout>{children}</ProtectedLayout>
        </AdminProvider>
    )
}

    