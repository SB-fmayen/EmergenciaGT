
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

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  loading: true,
  stationId: undefined,
  unitId: undefined,
});

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
            // No forzar la recarga del token para mejorar la velocidad.
            const idTokenResult = await currentUser.getIdTokenResult();
            const claims = idTokenResult.claims;
            
            // Lógica de roles específica para la app móvil:
            // Por defecto, cualquier usuario es un 'citizen'.
            // Solo si el claim 'unit' es explícitamente true, es una unidad.
            let role: UserRole = 'citizen'; 
            if (claims.unit === true) {
                role = 'unit';
            }
            
            setUserRole(role);
            setStationId(claims.stationId as string | undefined);
            setUnitId(claims.unitId as string | undefined);
            console.log("AuthProvider (Mobile) Resolved -> Role:", role, "| UnitID:", claims.unitId);

        } catch (error) {
            console.error("Error fetching user claims:", error);
            setUserRole('citizen'); // Fallback seguro para la app móvil
        }
      } else {
        setUser(null);
        setUserRole(null);
        setStationId(undefined);
        setUnitId(undefined);
      }
      setLoading(false);
    });

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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

function ProtectedMobileLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userRole, loading } = useAuth();
  
  const publicPaths = ['/auth', '/welcome', '/'];

  useEffect(() => {
    if (loading) return;

    if (user) {
        // User is logged in
        if (userRole === 'unit') {
            // Si el rol es 'unit', su única página es /mission
            if (pathname !== '/mission') router.replace('/mission');
        } else if (userRole === 'citizen') { 
            // Si es un ciudadano y está en una página pública, redirigir al dashboard
            if (publicPaths.includes(pathname)) {
                router.replace('/dashboard');
            }
        } else if (userRole === 'admin' || userRole === 'operator') {
            // Si un admin/operador entra por error, lo mandamos al login para que vea el error.
            router.replace('/auth');
        }
    } else {
        // User is not logged in
        if (!publicPaths.includes(pathname)) {
            router.replace('/auth');
        }
    }
  }, [user, userRole, loading, pathname, router]);

  if (loading) {
    return (
      <div className="bg-slate-900 min-h-screen flex flex-col justify-center items-center text-white">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="mt-4 text-lg">Verificando sesión...</p>
      </div>
    );
  }

  // Prevents flicker for unauthenticated users on protected routes
  if (!user && !publicPaths.includes(pathname)) {
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
            <ProtectedMobileLayout>{children}</ProtectedMobileLayout>
        </AuthProvider>
    )
}
