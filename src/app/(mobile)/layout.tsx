
"use client";

import { useEffect, type ReactNode, createContext, useContext, useState } from 'react';
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import 'leaflet/dist/leaflet.css';
import type { UserRole } from '@/lib/types';

// 1. Define the type for the authentication context
interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  unitId: string | null;
  loading: boolean;
}

// 2. Create the context with an initial undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Create the AuthProvider component
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// 4. Create and EXPORT the custom `useAuth` hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Layout for the (mobile) route group
export default function MobileLayout({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
