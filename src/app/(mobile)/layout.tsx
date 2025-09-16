
"use client";

import { useEffect, type ReactNode, createContext, useContext, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { useToast } from '@/hooks/use-toast';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { UserRole } from '@/lib/types';


// Auth Context specific to the Mobile Layout
interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  unitId: string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
          const tokenResult = await user.getIdTokenResult(true); // Force refresh of claims
          const claims = tokenResult.claims;
          if (claims.admin) {
            setUserRole('admin');
          } else if (claims.unit) {
            setUserRole('unit');
            setUnitId(claims.unitId as string || null);
          } else {
            // For this provider, if not admin or unit, they are a citizen or anon.
            setUserRole('citizen');
          }
        } catch (error) {
          console.error("Error getting token claims:", error);
          setUserRole('citizen'); // Fallback to default role
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a Mobile AuthProvider');
  }
  return context;
};

// This component handles the actual redirection and loading state logic.
function MobileLayoutContent({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userRole, loading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (loading) return; 

    const isAuthPage = pathname.startsWith('/auth');

    if (user) {
        // An admin/operator/unit is trying to access the mobile app pages.
        // Redirect them to their correct dashboard.
        if (userRole === 'admin' || userRole === 'operator') {
            router.replace('/dashboard/admin');
            return;
        }
        if (userRole === 'unit') {
            router.replace('/mission');
            return;
        }

        // A regular user is logged in but on the auth page, send them to the dashboard.
        if (isAuthPage) {
            router.replace('/dashboard');
        }
    } else {
        // No user is logged in, they should be on the auth page.
        // If they are on any other mobile page, redirect them to auth.
        if (!isAuthPage) {
            router.replace('/auth');
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userRole, loading, router, pathname]);

  // Shows a loading screen while auth state is being determined.
  if (loading) {
    return (
      <div className="bg-slate-900 min-h-screen flex flex-col justify-center items-center text-white">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="mt-4 text-lg">Verificando sesión...</p>
      </div>
    );
  }
  
  // Renders the children (the actual page) if all checks pass.
  return <>{children}</>;
}

// The main layout component for the (mobile) group.
export default function MobileLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <MobileLayoutContent>{children}</MobileLayoutContent>
    </AuthProvider>
  );
}
