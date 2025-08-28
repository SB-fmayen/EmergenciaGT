
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

/**
 * Página de inicio de sesión para la consola de operadores (vista de escritorio).
 */
export default function AdminLoginPage() {
  const [email, setEmail] = useState("operador@emergenciagt.com");
  const [password, setPassword] = useState("operador123");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Inicio de Sesión Exitoso",
        description: "Bienvenido a la Consola de Operaciones.",
      });
      router.push("/dashboard/admin");
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
            <div className="text-center mb-8">
                <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-white text-4xl">🚨</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-800">EmergenciaGT</h1>
                <p className="text-gray-600 text-xl">Consola de Operadores</p>
            </div>
            
            <form id="login-form" className="space-y-6" onSubmit={handleLogin}>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Correo de Operador</label>
                    <Input type="email" id="login-email" required
                           className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                           placeholder="operador@emergenciagt.com"
                           value={email}
                           onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                    <Input type="password" id="login-password" required
                           className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                           placeholder="••••••••"
                           value={password}
                           onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                
                <Button type="submit" 
                        className="w-full bg-red-600 text-white py-3 h-auto text-lg rounded-lg hover:bg-red-700 transition-colors font-semibold"
                        disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" /> : "Iniciar Sesión"}
                </Button>
            </form>
        </div>
    </div>
  );
}
