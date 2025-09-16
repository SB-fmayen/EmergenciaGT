
"use client";

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { useEffect, useState, type ReactNode, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from '@/hooks/use-toast';
import type { UserRole } from '@/lib/types';

// Metadata can't be exported from a client component, so we define it here as a comment
// export const metadata: Metadata = {
//   title: 'EmergenciaGT',
//   description: 'Sistema de Emergencias - Respuesta Rápida • Guatemala',
//   manifest: '/manifest.json',
// };

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
            
            let role: UserRole = 'citizen'; // Default role
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
            setUserRole('citizen');
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
