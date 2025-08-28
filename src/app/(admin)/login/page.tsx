
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileAppContainer } from "@/components/MobileAppContainer";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogIn, ShieldCheck } from "lucide-react";
import { EmergencyLogoIcon } from "@/components/icons/EmergencyLogoIcon";

/**
 * Página de inicio de sesión exclusiva para administradores y operadores.
 */
export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Por ahora, cualquier inicio de sesión exitoso es considerado un admin.
      // En el futuro, se podría verificar un rol específico en Firestore.
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Inicio de Sesión Exitoso",
        description: "Bienvenido al panel de administración.",
      });
      router.push("/dashboard/admin"); // Redirigir al dashboard de admin
    } catch (error: any) {
      let errorMessage = "Credenciales incorrectas o error de conexión.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "El correo o la contraseña son incorrectos.";
      }
      toast({
        title: "Error de Autenticación",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileAppContainer className="bg-slate-900 justify-center">
       <div className="flex-1 flex flex-col justify-center px-8 py-12">
        <div className="text-center mb-12">
            <div className="w-20 h-20 bg-white rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-10 h-10 text-slate-800" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Panel de Control</h1>
            <p className="text-slate-300 text-lg font-medium">Acceso para Operadores</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
            <div className="border border-white/10 bg-white/5 backdrop-blur-lg rounded-2xl p-8">
              <h2 className="text-xl font-bold text-white mb-6 text-center">Iniciar Sesión</h2>
              <div className="space-y-4">
                <Input 
                    type="email" 
                    placeholder="Correo de operador" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    className="bg-white/90 text-slate-900 placeholder:text-slate-500 border-0 rounded-xl focus:ring-2 focus:ring-white focus:bg-white"
                />
                <Input 
                    type="password" 
                    placeholder="Contraseña" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    className="bg-white/90 text-slate-900 placeholder:text-slate-500 border-0 rounded-xl focus:ring-2 focus:ring-white focus:bg-white"
                />
                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-white text-slate-800 py-3 h-auto rounded-xl font-bold text-lg hover:bg-gray-200 transition-all duration-300 transform hover:scale-105"
                    >
                    {loading ? <Loader2 className="animate-spin" /> : <><LogIn className="mr-2"/> Ingresar</>}
                </Button>
              </div>
            </div>
          </form>
       </div>
    </MobileAppContainer>
  );
}
