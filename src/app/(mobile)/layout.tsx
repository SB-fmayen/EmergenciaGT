
"use client";

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { useAuth, AuthProvider } from "@/app/layout";
import { useToast } from '@/hooks/use-toast';

function MobileLayoutContent({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userRole, loading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (loading) return; 

    // Handle routing for authenticated users
    if (user) {
        // Redirect admin/operators away from mobile app
        if (userRole === 'admin' || userRole === 'operator') {
            router.replace('/dashboard/admin');
            return;
        }
        // Redirect unit users to their mission page
        if (userRole === 'unit') {
            if (pathname !== '/mission') {
                router.replace('/mission');
            }
            return;
        }
        // Citizen/anonymous is on a mobile page
        if (pathname.startsWith('/auth')) {
             router.replace('/dashboard');
        }
    } else {
    // Handle routing for unauthenticated users
        if (!pathname.startsWith('/auth')) {
            router.replace('/auth');
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userRole, loading, router, pathname]);

  // Loading state while auth is being verified
  if (loading) {
    return (
      <div className="bg-slate-900 min-h-screen flex flex-col justify-center items-center text-white">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="mt-4 text-lg">Verificando sesión...</p>
      </div>
    );
  }

  // Prevent flicker of protected pages for unauthenticated users
  if (!user && !pathname.startsWith('/auth')) {
     return (
       <div className="bg-slate-900 min-h-screen flex justify-center items-center">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
       </div>
    );
  }

  return <>{children}</>;
}


export default function MobileLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <MobileLayoutContent>{children}</MobileLayoutContent>
    </AuthProvider>
  )
}
