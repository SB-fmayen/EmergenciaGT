
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './layout';
import { Loader2 } from 'lucide-react';

/**
 * Página raíz de la aplicación.
 * Su única responsabilidad es redirigir al usuario a la ruta correcta según su estado de autenticación.
 */
export default function RootPage() {
    const router = useRouter();
    const { user, userRole, loading } = useAuth();
    
    useEffect(() => {
        if (loading) {
            return; // Espera a que termine la carga
        }

        if (user) {
            if (userRole === 'admin' || userRole === 'operator') {
                router.replace('/dashboard/admin');
            } else if (userRole === 'unit') {
                router.replace('/mission');
            } else { // 'citizen'
                router.replace('/dashboard');
            }
        } else {
            // Si no hay usuario, redirige a la página de login de la app móvil por defecto.
            // El layout de admin se encargará de redirigir a /login si se intenta acceder a una ruta de admin.
            router.replace('/auth');
        }
    }, [user, userRole, loading, router]);
    
    // Muestra un loader mientras se determina la redirección
    return (
        <div className="bg-slate-900 min-h-screen flex flex-col justify-center items-center text-white">
            <Loader2 className="w-12 h-12 animate-spin" />
            <p className="mt-4 text-lg">Cargando...</p>
        </div>
    );
}
