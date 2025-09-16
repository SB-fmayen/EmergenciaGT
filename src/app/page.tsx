
import { redirect } from 'next/navigation';

/**
 * Página raíz de la aplicación.
 * Su única responsabilidad es redirigir al usuario a la página correcta
 * basándose en su estado de autenticación.
 * 
 * Esta es una página de servidor y no contiene lógica de cliente.
 */
export default function RootPage() {
  // Redirige incondicionalmente al dashboard.
  // El layout que protege el dashboard se encargará de la lógica de autenticación.
  redirect('/dashboard');
}
