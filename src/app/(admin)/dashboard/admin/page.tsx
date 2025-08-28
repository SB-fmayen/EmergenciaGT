
"use client";

import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { LogOut } from "lucide-react";
import dynamic from 'next/dynamic';

const AlertsMap = dynamic(() => import('@/components/admin/AlertsMap'), { 
  ssr: false,
  loading: () => <p className="text-center text-gray-500">Cargando mapa...</p>
});


/**
 * Página principal del dashboard de administración.
 * Mostrará el mapa de alertas en tiempo real en una vista de escritorio.
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
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-slate-900 text-white shadow-md z-20">
        <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                        <span className="text-red-600 font-bold text-xl">🚨</span>
                    </div>
                    <h1 className="text-2xl font-bold">Consola de Operaciones - EmergenciaGT</h1>
                </div>
                <div className="flex items-center space-x-4">
                     <Button onClick={handleLogout} variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700">
                        <LogOut className="mr-2 h-4 w-4"/>
                        Cerrar Sesión
                    </Button>
                </div>
            </div>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col p-6 overflow-hidden">
          <div className="bg-white rounded-lg shadow-lg flex-1 border border-gray-200">
             <AlertsMap />
          </div>
      </main>
    </div>
  );
}
