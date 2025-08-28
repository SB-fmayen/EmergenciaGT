
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { MobileAppContainer } from "@/components/MobileAppContainer";
import { Loader2 } from "lucide-react";

/**
 * Página raíz que actúa como un enrutador.
 * Redirige a los usuarios al dashboard si están autenticados,
 * o a la página de autenticación si no lo están.
 */
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Si hay un usuario, se asume que es un usuario final y se le redirige a su dashboard.
        // La lógica del layout de admin se encargará de los usuarios administradores.
        router.push("/dashboard");
      } else {
        // Si no hay usuario, se le redirige a la página de autenticación para usuarios finales.
        router.push("/auth");
      }
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MobileAppContainer className="bg-gradient-to-br from-red-800 via-red-900 to-black justify-center items-center">
      <Loader2 className="w-12 h-12 text-white animate-spin" />
    </MobileAppContainer>
  );
}
