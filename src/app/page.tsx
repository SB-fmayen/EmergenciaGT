
"use client";
import MobileLayout from "./(mobile)/layout";

/**
 * Página raíz de la aplicación.
 * Ahora envuelve el contenido con el MobileLayout para centralizar la lógica de autenticación.
 */
export default function RootPage() {
  return (
    <MobileLayout>
      {/* El contenido real se decidirá por la lógica en MobileLayout (pantalla de carga/redirección) */}
    </MobileLayout>
  );
}
