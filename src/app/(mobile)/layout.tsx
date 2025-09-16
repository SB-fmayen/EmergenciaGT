
"use client";

import { useEffect, useState, type ReactNode, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { UserRole } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  loading: boolean;
  stationId?: string;
  unitId?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [stationId, setStationId] = useState<string | undefined>(undefined);
  const [unitId, setUnitId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        try {
            // Forzar la actualización del token para obtener los últimos claims
            const idTokenResult = await currentUser.getIdTokenResult(true);
            const claims = idTokenResult.claims;
            
            let role: UserRole = 'citizen'; // Rol por defecto para usuarios de la app móvil
            if (claims.unit === true) {
                role = 'unit';
            }
            
            setUserRole(role);
            setStationId(claims.stationId as string | undefined);
            setUnitId(claims.unitId as string | undefined);

        } catch (error) {
            console.error("Error al obtener claims del usuario:", error);
            setUserRole('citizen'); // Fallback a un rol seguro por defecto
            setStationId(undefined);
            setUnitId(undefined);
        }
      } else {
        setUser(null);
        setUserRole(null);
        setStationId(undefined);
        setUnitId(undefined);
      }
      setLoading(false);
    });

    // Limpieza al desmontar
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userRole, loading, stationId, unitId }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

function ProtectedMobileLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userRole, loading } = useAuth();
  
  const publicPaths = ['/auth', '/welcome'];

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === '/auth';

    if (user) {
        // Usuario ha iniciado sesión
        if (userRole === 'unit') {
            if (pathname !== '/mission') {
                router.replace('/mission');
            }
        } else if (userRole === 'citizen') {
             if (isAuthPage) {
                 router.replace('/dashboard');
             }
        } else {
            // Caso improbable (admin/operator en app móvil), redirigir a auth.
             if (!isAuthPage) {
                 router.replace('/auth');
             }
        }
    } else {
        // Usuario no ha iniciado sesión
        if (!isAuthPage && !publicPaths.includes(pathname)) {
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
  
  // Evita el parpadeo de contenido protegido mientras redirige
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
        <AuthProvider>
            <ProtectedMobileLayout>{children}</ProtectedMobileLayout>
        </AuthProvider>
    )
}
