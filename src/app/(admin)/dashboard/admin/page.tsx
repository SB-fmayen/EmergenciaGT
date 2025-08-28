
"use client";

import { Button } from "@/components/ui/button";
import { MobileAppContainer } from "@/components/MobileAppContainer";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { LogOut } from "lucide-react";

/**
 * Página principal del dashboard de administración.
 * Por ahora, es un placeholder que permite cerrar sesión.
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
    <MobileAppContainer className="bg-slate-800">
      <header className="bg-slate-900 p-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold text-white">Panel de Operador</h1>
        <Button onClick={handleLogout} variant="ghost" size="sm" className="text-white hover:bg-slate-700">
            <LogOut className="mr-2 h-4 w-4"/>
            Cerrar Sesión
        </Button>
      </header>
      <div className="p-6">
        <p className="text-white">¡Bienvenido al dashboard de administración!</p>
        <p className="text-slate-400 mt-4">Aquí es donde construiremos el mapa en tiempo real y la lista de alertas.</p>
      </div>
    </MobileAppContainer>
  );
}
