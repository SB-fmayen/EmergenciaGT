
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/(mobile)/layout";
import { Loader2 } from "lucide-react";

/**
 * Página raíz de la aplicación.
 * Su única responsabilidad es redirigir al usuario a la página correcta
 * basándose en su estado de autenticación.
 */
export default function RootPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Si el usuario está logueado, el layout se encargará de redirigirlo
        // a /dashboard o /mission. Podemos enviarlo a una página base.
        router.replace('/dashboard');
      } else {
        // Si no hay usuario, lo enviamos a la página de login.
        router.replace('/auth');
      }
    }
  }, [user, loading, router]);

  // Muestra un loader mientras se determina el estado de la sesión.
  return (
    <div className="bg-slate-900 min-h-screen flex flex-col justify-center items-center text-white">
      <Loader2 className="w-12 h-12 animate-spin" />
      <p className="mt-4 text-lg">Iniciando aplicación...</p>
    </div>
  );
}
