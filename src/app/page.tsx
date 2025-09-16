
import { redirect } from 'next/navigation';

/**
 * Página raíz de la aplicación.
 * Su única responsabilidad es redirigir al usuario al dashboard principal de la aplicación móvil.
 * La lógica de protección de rutas (si el usuario está o no autenticado) se maneja
 * en el layout que envuelve a '/dashboard'.
 */
export default function RootPage() {
    redirect('/dashboard');
}
