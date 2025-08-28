
"use client";

import { Button } from "@/components/ui/button";
import { MobileAppContainer } from "@/components/MobileAppContainer";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { LogOut } from "lucide-react";
import dynamic from 'next/dynamic';

// Carga dinámica del mapa para evitar problemas de renderizado en el servidor (SSR)
const AlertsMap = dynamic(() => import('@/components/admin/AlertsMap'), { 
  ssr: false,
  loading: () => <p className="text-white text-center">Cargando mapa...</p>
});


/**
 * Página principal del dashboard de administración.
 * Mostrará el mapa de alertas en tiempo real.
 */
export default function AdminDashboardPage() {
    const router = useRouter();
    const { toast } = useToast();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast({ title: "Sesión cerrada" });
            router.push('/login');
        } catch (error) {
            toast({ title: "Error al cerrar sesión", variant: "destructive" });
        }
    };

  return (
    <MobileAppContainer className="bg-slate-800 p-0">
      <div className="flex flex-col h-full">
        <header className="bg-slate-900 p-4 flex justify-between items-center shadow-md z-10 flex-shrink-0">
          <h1 className="text-xl font-bold text-white">Panel de Operador</h1>
          <Button onClick={handleLogout} variant="ghost" size="sm" className="text-white hover:bg-slate-700">
              <LogOut className="mr-2 h-4 w-4"/>
              Cerrar Sesión
          </Button>
        </header>
        <main className="flex-1 relative">
            <AlertsMap />
        </main>
      </div>
    </MobileAppContainer>
  );
}
