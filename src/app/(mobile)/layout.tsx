
"use client";

import { useEffect, type ReactNode, createContext, useContext, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import type { UserRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

// 1. Definir el tipo para el contexto de autenticación
interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  unitId: string | null;
  loading: boolean;
}

// 2. Crear el contexto con un valor inicial undefined
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Crear el componente AuthProvider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const tokenResult = await user.getIdTokenResult(true); // Forzar actualización de claims
          const claims = tokenResult.claims;
          if (claims.admin) {
            setUserRole('admin');
          } else if (claims.unit) {
            setUserRole('unit');
            setUnitId(claims.unitId as string || null);
          } else {
            // Si no tiene claim de admin o unit, puede ser 'operator' (en panel) o 'citizen' (en app móvil).
            // Como este es el layout móvil, asumimos 'citizen'.
            setUserRole('citizen'); 
          }
        } catch (error) {
          console.error("Error al obtener claims del token:", error);
          setUserRole('citizen'); // Fallback a rol por defecto
        }
      } else {
        setUserRole(null);
        setUnitId(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = { user, userRole, unitId, loading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// 4. Crear y EXPORTAR el hook personalizado `useAuth`
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// 5. El layout que usa el Provider
function MobileLayoutContent({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userRole, loading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (loading) return; 

    if (user) {
        if (userRole === 'admin' || userRole === 'operator') {
            router.replace('/dashboard/admin');
            return;
        }
        if (userRole === 'unit') {
            if (pathname !== '/mission') {
                router.replace('/mission');
            }
            return;
        }
        if (pathname.startsWith('/auth')) {
             router.replace('/dashboard');
        }
    } else {
        if (!pathname.startsWith('/auth')) {
            router.replace('/auth');
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userRole, loading, router, pathname]);

  if (loading) {
    return (
      <div className="bg-slate-900 min-h-screen flex flex-col justify-center items-center text-white">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="mt-4 text-lg">Verificando sesión...</p>
      </div>
    );
  }

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
