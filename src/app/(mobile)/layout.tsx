
"use client";

import { useEffect, useState, type ReactNode, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
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
            // No forzamos la recarga del token para evitar bloqueos.
            const idTokenResult = await currentUser.getIdTokenResult(); 
            const claims = idTokenResult.claims;
            
            let role: UserRole = 'citizen'; // Rol por defecto para la app móvil
            if (claims.admin === true) {
                role = 'admin';
            } else if (claims.unit === true) {
                role = 'unit';
            }
            
            const detectedStationId = claims.stationId as string | undefined;
            const detectedUnitId = claims.unitId as string | undefined;

            setUserRole(role);
            setStationId(detectedStationId);
            setUnitId(detectedUnitId);

            // Logs para depuración
            console.log("Auth State Resolved:", {
              userEmail: currentUser.email,
              isAnonymous: currentUser.isAnonymous,
              role,
              stationId: detectedStationId,
              unitId: detectedUnitId,
            });


        } catch (error) {
            console.error("Error fetching user claims:", error);
            setUserRole('citizen'); // Fallback seguro
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

// Este es el layout para las rutas bajo (mobile)
// Protegerá las rutas que no son de autenticación como /mission y /alerts
function ProtectedMobileLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userRole, loading } = useAuth();
  
  // Lista de rutas públicas dentro del grupo (mobile)
  const publicRoutes = ['/auth', '/welcome', '/'];

  useEffect(() => {
    if (loading) return; 

    const isPublicPage = publicRoutes.some(route => pathname === route);

    if (user) {
      // Usuario está logueado
      if (userRole === 'admin' || userRole === 'operator') {
          // Si un admin/operador entra a una ruta móvil, redirigir a su panel.
          router.replace('/dashboard/admin');
          return;
      }
      
      // Si es un 'citizen' o 'unit' en una página pública, redirigirlo a su dashboard.
      if (isPublicPage) {
          if (userRole === 'unit') {
              router.replace('/mission');
          } else { // citizen
              router.replace('/dashboard');
          }
          return;
      }

    } else {
      // Usuario no está logueado
      if (!isPublicPage) {
        router.replace('/auth');
      }
    }
  }, [user, userRole, loading, router, pathname]);

  if (loading) {
    return (
      <div className="bg-slate-900 min-h-screen flex flex-col justify-center items-center text-white">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="mt-4 text-lg">Verificando sesión...</p>
      </div>
    );
  }

  // Previene el parpadeo de contenido protegido
  if (!user && !publicRoutes.some(route => pathname === route)) {
     return (
       <div className="bg-slate-900 min-h-screen flex justify-center items-center">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
       </div>
    );
  }

  return <>{children}</>;
}


export default function MobilePagesLayout({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <ProtectedMobileLayout>{children}</ProtectedMobileLayout>
        </AuthProvider>
    )
}
