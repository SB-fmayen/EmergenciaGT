
"use client";

import { useEffect, useState, type ReactNode, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, firestore } from "@/lib/firebase";
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc } from 'firebase/firestore';


type UserRole = 'admin' | 'operator' | null;

interface AuthContextType {
  user: User | null;
  userRole: UserRole;
  loading: boolean;
  stationId?: string; // Add stationId to context
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  loading: true,
  stationId: undefined,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [stationId, setStationId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        try {
            const idTokenResult = await currentUser.getIdTokenResult(true); 
            const isAdmin = idTokenResult.claims.admin === true;
            const role = isAdmin ? 'admin' : 'operator';
            setUserRole(role);

            // If user is an operator, fetch their stationId from Firestore
            if (role === 'operator') {
                const userDocRef = doc(firestore, 'users', currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists() && userDoc.data().stationId) {
                    setStationId(userDoc.data().stationId);
                } else {
                    setStationId(undefined);
                }
            } else {
                setStationId(undefined); // Admins don't have a station
            }
        } catch (error) {
            console.error("Error fetching user role or station:", error);
            setUserRole('operator');
            setStationId(undefined);
        }
      } else {
        setUser(null);
        setUserRole(null);
        setStationId(undefined);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userRole, loading, stationId }}>
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

    if (!user && !isAuthPage) {
      router.push('/login');
      return;
    }
    
    if (user && isAuthPage) {
      router.push('/dashboard/admin');
      return;
    }

    const adminPages = ['/dashboard/stations', '/dashboard/users'];
    if (user && userRole === 'operator' && adminPages.some(page => pathname.startsWith(page))) {
        toast({ title: "Acceso Denegado", description: "No tienes permisos para acceder a esta página.", variant: "destructive" });
        router.push('/dashboard/admin');
    }

  }, [user, userRole, loading, router, pathname, toast]);

  if (loading) {
    return (
      <div className="bg-slate-900 min-h-screen flex flex-col justify-center items-center text-white">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="mt-4 text-lg">Verificando sesión y permisos...</p>
      </div>
    );
  }

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
