
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, firestore } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { UserProfile } from "@/lib/types";
import Image from 'next/image';

type AuthView = "login" | "register" | "forgotPassword";

/**
 * Página de autenticación para la consola de operadores (vista de escritorio).
 * Permite iniciar sesión, registrar nuevos operadores y recuperar contraseñas.
 */
export default function AdminLoginPage() {
  const [view, setView] = useState<AuthView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleFirebaseAuthError = (error: any) => {
    const errorCode = error.code;
    let errorMessage = "Ocurrió un error desconocido.";
    switch (errorCode) {
      case 'auth/email-already-in-use':
          errorMessage = "Este correo electrónico ya está en uso.";
          break;
      case 'auth/weak-password':
          errorMessage = "La contraseña es muy débil. Debe tener al menos 6 caracteres.";
          break;
      case 'auth/invalid-email':
          errorMessage = "El formato del correo electrónico no es válido.";
          break;
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
          errorMessage = "Credenciales incorrectas. Por favor, intenta de nuevo.";
          break;
      default:
          errorMessage = `Ocurrió un error. Por favor, intenta de nuevo. (${errorCode})`;
          console.error("Firebase Auth Error:", error);
          break;
    }
    toast({ title: "Error de Autenticación", description: errorMessage, variant: "destructive" });
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      await setDoc(doc(firestore, "users", userCredential.user.uid), {
        lastLogin: serverTimestamp(),
      }, { merge: true });

      // This is crucial to get the latest custom claims after login
      await userCredential.user.getIdToken(true);

      toast({
        title: "Inicio de Sesión Exitoso",
        description: "Bienvenido a la Consola de Operaciones.",
      });
      
      // Redirect first
      router.push("/dashboard/admin");
      // Then force a refresh of the layout to re-check auth state and roles
      router.refresh(); 

    } catch (error: any) {
      handleFirebaseAuthError(error);
      setLoading(false); // Only set loading to false on error
    } 
    // Do not set loading to false on success, as the page will redirect and unmount.
  };
  
  const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const newUserProfile: Omit<UserProfile, 'stationId' | 'lastLogin'> = {
            uid: userCredential.user.uid,
            email: userCredential.user.email!,
            role: 'operator', 
            createdAt: serverTimestamp(),
          };
          await setDoc(doc(firestore, "users", userCredential.user.uid), newUserProfile);
          
          toast({
              title: "Registro Exitoso",
              description: "Tu cuenta de operador ha sido creada. Ahora puedes iniciar sesión.",
          });
          setView("login");
      } catch(error: any) {
          handleFirebaseAuthError(error);
      } finally {
          setLoading(false);
      }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        await sendPasswordResetEmail(auth, email);
        toast({
            title: "¡Enlace enviado!",
            description: "Revisa tu correo para restablecer tu contraseña.",
        });
        setView("login");
    } catch (error: any) {
        handleFirebaseAuthError(error);
    } finally {
        setLoading(false);
    }
  }

  const renderForm = () => {
    if (view === "register") {
      return (
        <form id="register-form" className="space-y-6" onSubmit={handleRegister}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Correo de Operador</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="operador@bomberos.gt" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña (mín. 6 caracteres)</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <Button type="submit" className="w-full bg-blue-600 text-white py-3 h-auto text-lg hover:bg-blue-700" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : "Crear Cuenta de Operador"}
            </Button>
        </form>
      );
    }
    
    if (view === "forgotPassword") {
      return (
        <form id="reset-form" className="space-y-6" onSubmit={handlePasswordReset}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Correo de Operador</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="operador@bomberos.gt" required />
            </div>
            <Button type="submit" className="w-full bg-gray-600 text-white py-3 h-auto text-lg hover:bg-gray-700" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : "Enviar Enlace de Recuperación"}
            </Button>
        </form>
      );
    }

    return (
      <form id="login-form" className="space-y-6" onSubmit={handleLogin}>
          <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-2">Correo de Operador</label>
              <Input type="email" id="login-email" required
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                     placeholder="operador@bomberos.gt"
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
              />
          </div>
          <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
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
    );
  };

  const getTitle = () => {
      switch(view) {
          case 'register': return 'Crear Cuenta de Operador';
          case 'forgotPassword': return 'Recuperar Contraseña';
          default: return 'Consola de Operadores';
      }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
            <div className="text-center mb-8">
                <div className="w-24 h-24 mx-auto mb-4">
                     <Image src="/cuerpo-bomberos-logo.png" alt="Logo de Bomberos Voluntarios" width={96} height={96} />
                </div>
                <h1 className="text-3xl font-bold text-gray-800">EmergenciaGT</h1>
                <p className="text-gray-600 text-xl">{getTitle()}</p>
            </div>
            
            {renderForm()}

            <div className="mt-6 text-center text-sm">
                {view === 'login' ? (
                    <div className="flex justify-between items-center">
                        <button onClick={() => setView('forgotPassword')} className="text-blue-600 hover:underline">¿Olvidaste tu contraseña?</button>
                        <button onClick={() => setView('register')} className="text-blue-600 hover:underline">Crear una cuenta</button>
                    </div>
                ) : (
                    <button onClick={() => setView('login')} className="text-blue-600 hover:underline">Volver a Iniciar Sesión</button>
                )}
            </div>
        </div>
    </div>
  );
}

    
