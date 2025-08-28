
"use client";

import { useEffect, useState, type ReactNode, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

type UserRole = 'admin' | 'operator' | null;

interface AuthContextType {
  user: User | null;
  userRole: UserRole;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
            // Get custom claims from the ID token. Force refresh to get the latest claims.
            const idTokenResult = await currentUser.getIdTokenResult(true); 
            const isAdmin = idTokenResult.claims.admin === true;
            setUserRole(isAdmin ? 'admin' : 'operator');
        } catch (error) {
            console.error("Error fetching user role from token:", error);
            setUserRole('operator'); // Default to operator on error
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userRole, loading }}>
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

  useEffect(() => {
    if (loading) return;

    if (!user && !pathname.startsWith('/login')) {
      router.push('/login');
      return;
    }
    
    if (user && pathname.startsWith('/login')) {
      router.push('/dashboard/admin');
      return;
    }

    // Role-based protection for admin-only pages
    const adminPages = ['/dashboard/stations', '/dashboard/users'];
    if (user && userRole === 'operator' && adminPages.some(page => pathname.startsWith(page))) {
        router.push('/dashboard/admin'); // Redirect operators away from admin-only pages
    }

  }, [user, userRole, loading, router, pathname]);

  if (loading) {
    return (
      <div className="bg-slate-900 min-h-screen flex flex-col justify-center items-center text-white">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="mt-4 text-lg">Verificando sesión y permisos...</p>
      </div>
    );
  }

  // Allow access to login page if no user, or to other pages if user exists.
  if ((!user && pathname.startsWith('/login')) || user) {
     return <>{children}</>;
  }

  // Fallback loading/redirecting state
  return (
       <div className="bg-slate-900 min-h-screen flex justify-center items-center">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
       </div>
  );
}

/**
 * Layout principal para el panel de administración.
 * Protege las rutas de administración y proporciona un diseño de página completa.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <ProtectedLayout>{children}</ProtectedLayout>
        </AuthProvider>
    )
}
