
"use client";

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { useAuth } from "@/app/layout"; // Import from root layout now
import { useToast } from '@/hooks/use-toast';

function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userRole, loading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (loading) return; 

    const isAuthPage = pathname.startsWith('/login');

    if (user) {
        if (userRole === 'admin' || userRole === 'operator') {
            if (isAuthPage) {
                router.replace('/dashboard/admin');
                return;
            }
            // Admin-only page protection
            if (userRole === 'operator') {
                const adminOnlyPages = ['/dashboard/stations', '/dashboard/users', '/dashboard/analytics'];
                if (adminOnlyPages.some(page => pathname.startsWith(page))) {
                    toast({ title: "Acceso Denegado", description: "No tienes permisos para acceder a esta página.", variant: "destructive" });
                    router.replace('/dashboard/admin');
                }
            }
        } else {
            // Citizen or Unit trying to access admin area
            router.replace('/auth');
        }
    } else {
        // User is not logged in
        if (!isAuthPage) {
            router.replace('/login');
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userRole, loading, router, pathname, toast]);

  if (loading) {
    return (
      <div className="bg-slate-900 min-h-screen flex flex-col justify-center items-center text-white">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="mt-4 text-lg">Verificando sesión y permisos...</p>
      </div>
    );
  }

  // Prevents flicker of protected pages while redirecting unauthenticated users
  if (!user && !pathname.startsWith('/login')) {
     return (
       <div className="bg-slate-900 min-h-screen flex justify-center items-center">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
       </div>
    );
  }

  return <>{children}</>;
}


export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <ProtectedAdminLayout>{children}</ProtectedAdminLayout>
    )
}
