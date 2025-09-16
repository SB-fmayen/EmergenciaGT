
"use client";

import { MobileAppContainer } from "@/components/MobileAppContainer";
import { Loader2 } from "lucide-react";

/**
 * Página raíz de la aplicación.
 * Ya no contiene lógica de redirección. Su única función es mostrar un indicador de carga.
 * El layout padre (`/src/app/(mobile)/layout.tsx`) ahora se encarga de toda la lógica
 * de verificación de sesión y redirección, creando un flujo de carga único y sin conflictos.
 */
export default function RootPage() {
  // El componente se renderiza mientras el ProtectedMobileLayout en el layout padre
  // determina a dónde redirigir al usuario.
  return (
    <MobileAppContainer className="bg-gradient-to-br from-red-800 via-red-900 to-black justify-center items-center">
      <Loader2 className="w-12 h-12 text-white animate-spin" />
    </MobileAppContainer>
  );
}
