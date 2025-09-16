
"use client";

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { useAuth } from "@/app/layout";
import { useToast } from '@/hooks/use-toast';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userRole, loading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (loading) return; 

    const isAuthPage = pathname.startsWith('/login');

    if (user) {
        // Un usuario de app móvil o unidad intenta acceder al panel de admin
        if (userRole === 'citizen' || userRole === 'unit') {
            toast({ title: "Acceso no autorizado", description: "Esta área es solo para administradores y operadores.", variant: "destructive" });
            router.replace('/dashboard');
            return;
        }

        // Usuario admin/operador está en una página de login
        if (isAuthPage) {
            router.replace('/dashboard/admin');
            return;
        }
        
        // Un operador intenta acceder a páginas de solo admin
        if (userRole === 'operator') {
            const adminOnlyPages = ['/dashboard/stations', '/dashboard/users', '/dashboard/analytics'];
            if (adminOnlyPages.some(page => pathname.startsWith(page))) {
                toast({ title: "Acceso Denegado", description: "No tienes permisos para acceder a esta página.", variant: "destructive" });
                router.replace('/dashboard/admin');
            }
        }

    } else {
        // Usuario no logueado intenta acceder a una página protegida de admin
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

  // Previene el parpadeo de contenido protegido para usuarios no logueados o con rol incorrecto
  const isProtectedAdminPage = !pathname.startsWith('/login');
  if (!user && isProtectedAdminPage) {
     return (
       <div className="bg-slate-900 min-h-screen flex justify-center items-center">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
       </div>
    );
  }

  return <>{children}</>;
}
