
"use client";

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

/**
 * Layout principal para el panel de administración.
 * Protege las rutas de administración y proporciona un diseño de página completa.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    // Si no hay usuario y se intenta acceder a una ruta que no es de login, redirigir al login.
    if (!user && pathname !== '/login') {
      router.push('/login');
    }
    
    // Si hay usuario y está intentando acceder a la página de login,
    // lo redirigimos al dashboard de administrador.
    if (user && pathname === '/login') {
      router.push('/dashboard/admin');
    }

  }, [user, loading, router, pathname]);

  // Mientras se verifica la sesión, mostramos un loader a pantalla completa.
  if (loading) {
    return (
      <div className="bg-slate-900 min-h-screen flex flex-col justify-center items-center text-white">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="mt-4 text-lg">Verificando sesión...</p>
      </div>
    );
  }

  // Si el usuario está verificado o está en la página de login,
  // mostramos el contenido de la página.
  if (user || pathname === '/login') {
      return <>{children}</>;
  }

  // Fallback por si algo falla.
  return (
       <div className="bg-slate-900 min-h-screen flex justify-center items-center">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
       </div>
  );
}
