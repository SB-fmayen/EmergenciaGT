
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
            const idTokenResult = await currentUser.getIdTokenResult(true); 
            const claims = idTokenResult.claims;
            
            let role: UserRole = 'operator';
            if (claims.admin === true) {
                role = 'admin';
            } else if (claims.unit === true) {
                role = 'unit';
            }
            
            setUserRole(role);
            setStationId(claims.stationId as string | undefined);
            setUnitId(claims.unitId as string | undefined);

        } catch (error) {
            console.error("Error fetching user claims:", error);
            setUserRole('operator'); // Fallback
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

  useEffect(() => {
    if (loading) return; 

    // Si no hay usuario, redirigir a la página de login de admin.
    // Asumimos que los usuarios de unidad usan la misma página de login.
    if (!user) {
      router.replace('/login');
      return;
    }
    
    // Si el usuario no tiene el rol 'unit', no debería estar aquí.
    // Lo mandamos a la página de admin.
    if (userRole && userRole !== 'unit') {
        router.replace('/dashboard/admin');
    }
  }, [user, userRole, loading, router, pathname]);

  if (loading) {
    return (
      <div className="bg-slate-900 min-h-screen flex flex-col justify-center items-center text-white">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="mt-4 text-lg">Verificando sesión de unidad...</p>
      </div>
    );
  }

  // Previene el parpadeo de la página de misión.
  if (!user || userRole !== 'unit') {
     return (
       <div className="bg-slate-900 min-h-screen flex justify-center items-center">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
       </div>
    );
  }

  return <>{children}</>;
}


export default function MobileUnitLayout({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <ProtectedMobileLayout>{children}</ProtectedMobileLayout>
        </AuthProvider>
    )
}
