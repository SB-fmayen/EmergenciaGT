
"use client";

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { useEffect, type ReactNode, createContext, useContext, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { UserRole } from '@/lib/types';
import 'leaflet/dist/leaflet.css';


// Auth Context for the entire application
interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  stationId: string | null;
  unitId: string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [stationId, setStationId] = useState<string | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const tokenResult = await user.getIdTokenResult(true); // Force refresh of claims
          const claims = tokenResult.claims;
          setStationId(claims.stationId as string || null);
          setUnitId(claims.unitId as string || null);
          
          if (claims.admin) {
            setUserRole('admin');
          } else if (claims.unit) {
            setUserRole('unit');
          } else if (claims.stationId) {
            // If they have a stationId but are not admin/unit, they must be an operator
            setUserRole('operator');
          } else if (user.isAnonymous) {
            setUserRole('citizen'); // Anonymous users are treated as citizens
          }
          else {
            // A regular signed-in user
            setUserRole('citizen');
          }
        } catch (error) {
          console.error("Error getting token claims:", error);
          setUserRole('citizen'); // Fallback to default role
        }
      } else {
        setUserRole(null);
        setStationId(null);
        setUnitId(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = { user, userRole, stationId, unitId, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className="dark">
      <head>
        <title>EmergenciaGT</title>
        <meta name="description" content="Sistema de Emergencias - Respuesta Rápida • Guatemala" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#B91C1C" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/cuerpo-bomberos-logo.png" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
            {children}
            <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
