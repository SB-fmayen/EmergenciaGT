
"use client";

import { useEffect, type ReactNode, createContext, useContext, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { useToast } from '@/hooks/use-toast';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { UserRole } from '@/lib/types';


// Auth Context specific to the Admin Layout
interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const tokenResult = await user.getIdTokenResult(true);
          const claims = tokenResult.claims;
          if (claims.admin) {
            setUserRole('admin');
          } else if (claims.unit) {
            setUserRole('unit');
          } else {
            // If no specific admin/unit claim, they are an operator for this panel
            setUserRole('operator');
          }
        } catch (error) {
            console.error("Error getting admin token claims:", error);
            setUserRole(null); // Force re-login on error
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = { user, userRole, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an Admin AuthProvider');
  }
  return context;
};


export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AuthProvider>
  );
}


function AdminLayoutContent({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userRole, loading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (loading) return; 

    const isLoginPage = pathname.startsWith('/login');

    if (user) {
        // A 'citizen' user from the mobile app is trying to access the admin panel.
        if (userRole === 'citizen') {
            toast({ title: "Acceso no autorizado", description: "Esta área es solo para administradores y operadores.", variant: "destructive" });
            signOut(auth); // Log them out from the admin context
            router.replace('/login');
            return;
        }

        // A 'unit' user is logged in.
        if (userRole === 'unit') {
            // Redirect them to their mission page if they are not already there.
            if (!pathname.startsWith('/mission')) {
                 router.replace('/mission');
            }
            return;
        }

        // An admin/operator is on the login page, redirect them to the dashboard.
        if (isLoginPage) {
            router.replace('/dashboard/admin');
            return;
        }
        
        // An 'operator' tries to access admin-only pages.
        if (userRole === 'operator') {
            const adminOnlyPages = ['/dashboard/stations', '/dashboard/users', '/dashboard/analytics'];
            if (adminOnlyPages.some(page => pathname.startsWith(page))) {
                toast({ title: "Acceso Denegado", description: "No tienes permisos para acceder a esta página.", variant: "destructive" });
                router.replace('/dashboard/admin');
            }
        }

    } else {
        // No user is logged in, redirect to login page if they are not already there.
        if (!isLoginPage) {
            router.replace('/login');
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userRole, loading, router, pathname, toast]);

  // Shows a loading screen while auth state is being determined.
  if (loading) {
    return (
      <div className="bg-slate-900 min-h-screen flex flex-col justify-center items-center text-white">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="mt-4 text-lg">Verificando sesión y permisos...</p>
      </div>
    );
  }

  // Prevents flashing protected content for non-logged-in users.
  const isProtectedPage = !pathname.startsWith('/login');
  if (!user && isProtectedPage) {
     return (
       <div className="bg-slate-900 min-h-screen flex justify-center items-center">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
       </div>
    );
  }

  // Renders the children (the actual page) if all checks pass.
  return <>{children}</>;
}
