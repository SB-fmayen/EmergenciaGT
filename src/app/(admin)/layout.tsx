
"use client";

import { useEffect, useState, type ReactNode, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from '@/hooks/use-toast';
import type { UserRole } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  loading: boolean;
  stationId?: string; // This now comes from the token
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
            // Force refresh the token to get the latest custom claims
            const idTokenResult = await currentUser.getIdTokenResult(true); 
            const claims = idTokenResult.claims;
            
            let role: UserRole = 'operator'; // Default role
            if (claims.admin === true) {
                role = 'admin';
            } else if (claims.unit === true) {
                role = 'unit';
            }
            
            setUserRole(role);

            // Get stationId and unitId directly from the token if it exists
            setStationId(claims.stationId as string | undefined);
            setUnitId(claims.unitId as string | undefined);

        } catch (error) {
            console.error("Error fetching user claims:", error);
            // Default to a safe state on error
            setUserRole('operator');
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

function ProtectedLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userRole, loading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (loading) return; 

    const isAuthPage = pathname.startsWith('/login');

    if (user) {
        // User is logged in
        if (userRole === 'unit') {
            // A unit should never be in the admin layout.
            // The login page itself will handle the initial redirect.
            // This is a safety net.
            router.replace('/mission');
            return;
        }

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
        <AuthProvider>
            <ProtectedLayout>{children}</ProtectedLayout>
        </AuthProvider>
    )
}
