
"use client";

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { useEffect, type ReactNode, createContext, useContext, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import type { UserRole } from '@/lib/types';

// 1. Definir el tipo para el contexto de autenticación
interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  unitId: string | null;
  loading: boolean;
}

// 2. Crear el contexto con un valor inicial undefined
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Crear el componente AuthProvider
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
          const tokenResult = await user.getIdTokenResult(true); // Forzar actualización de claims
          const claims = tokenResult.claims;
          if (claims.admin) {
            setUserRole('admin');
          } else if (claims.unit) {
            setUserRole('unit');
            setUnitId(claims.unitId as string || null);
          } else if (claims.operator) {
            setUserRole('operator');
          } else {
            setUserRole('citizen');
          }
        } catch (error) {
          console.error("Error al obtener claims del token:", error);
          setUserRole('citizen'); // Fallback a rol por defecto
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

// 4. Crear y EXPORTAR el hook personalizado `useAuth`
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
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
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
