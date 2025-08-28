
"use client";

import { useEffect, useState, type ReactNode, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from '@/hooks/use-toast';


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
      setLoading(true); // Always start in a loading state on auth change
      if (currentUser) {
        setUser(currentUser);
        try {
            // Force refresh to get the latest claims. This is crucial for roles.
            const idTokenResult = await currentUser.getIdTokenResult(true); 
            const isAdmin = idTokenResult.claims.admin === true;
            setUserRole(isAdmin ? 'admin' : 'operator');
        } catch (error) {
            console.error("Error fetching user role from token:", error);
            setUserRole('operator'); // Default to operator on error
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false); // Set loading to false only after all async operations are done
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
  const { toast } = useToast();

  useEffect(() => {
    // Wait until loading is complete before running any logic
    if (loading) return; 

    const isAuthPage = pathname.startsWith('/login');

    // If no user, redirect to login page, unless they are already there
    if (!user && !isAuthPage) {
      router.push('/login');
      return;
    }
    
    // If user is logged in, redirect away from login page
    if (user && isAuthPage) {
      router.push('/dashboard/admin');
      return;
    }

    // Role-based protection for admin-only pages
    const adminPages = ['/dashboard/stations', '/dashboard/users'];
    if (user && userRole === 'operator' && adminPages.some(page => pathname.startsWith(page))) {
        toast({ title: "Acceso Denegado", description: "No tienes permisos para acceder a esta página.", variant: "destructive" });
        router.push('/dashboard/admin'); // Redirect operators away from admin-only pages
    }

  }, [user, userRole, loading, router, pathname, toast]);

  // If we are loading, show a full-screen spinner.
  // This is the key change: we prevent rendering of children until auth state is fully resolved.
  if (loading) {
    return (
      <div className="bg-slate-900 min-h-screen flex flex-col justify-center items-center text-white">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="mt-4 text-lg">Verificando sesión y permisos...</p>
      </div>
    );
  }

  // If user is not logged in and not on login page, they are being redirected. Show spinner.
  if (!user && !pathname.startsWith('/login')) {
     return (
       <div className="bg-slate-900 min-h-screen flex justify-center items-center">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
       </div>
    );
  }

  // Render children only when not loading and user state is confirmed
  return <>{children}</>;
}


export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <ProtectedLayout>{children}</ProtectedLayout>
        </AuthProvider>
    )
}
