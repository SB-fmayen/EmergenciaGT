
"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { MobileAppContainer } from '@/components/MobileAppContainer';
import { Loader2 } from 'lucide-react';

/**
 * Layout principal para el panel de administración.
 * Protege las rutas de administración, redirigiendo a los usuarios no autenticados
 * a la página de login de administrador.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

    // Si no hay usuario y no estamos en la página de login, redirigir al login.
    if (!user && pathname !== '/login') {
      router.push('/login');
    }
    
    // Si hay un usuario y está intentando acceder a la página de login,
    // lo redirigimos al dashboard de administrador.
    if (user && pathname === '/login') {
      router.push('/dashboard/admin');
    }

  }, [user, loading, router, pathname]);

  // Mientras se verifica la sesión, mostramos un loader.
  if (loading) {
    return (
      <MobileAppContainer className="bg-slate-900 justify-center items-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
        <p className="text-white mt-4">Verificando acceso...</p>
      </MobileAppContainer>
    );
  }

  // Si el usuario está verificado o está en la página de login,
  // mostramos el contenido de la página.
  if (user || pathname === '/login') {
      return <>{children}</>;
  }

  // Fallback por si algo falla, muestra un loader en lugar de una página en blanco.
  return (
       <MobileAppContainer className="bg-slate-900 justify-center items-center">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
       </MobileAppContainer>
  );
}
