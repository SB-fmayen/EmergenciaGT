
import { redirect } from 'next/navigation';

/**
 * Página raíz de la aplicación.
 * Su única responsabilidad es redirigir al usuario a una ruta inicial dentro de la app móvil.
 * La lógica de si el usuario está o no autenticado se maneja en el layout de ese grupo.
 */
export default function RootPage() {
    redirect('/auth');
}

    