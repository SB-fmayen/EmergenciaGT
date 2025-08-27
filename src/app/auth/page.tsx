
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { firebaseApp } from "@/lib/firebase"; // Importaremos la configuración de Firebase
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmergencyLogoIcon } from "@/components/icons/EmergencyLogoIcon";
import { MobileAppContainer } from "@/components/MobileAppContainer";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type AuthView = "login" | "register" | "forgotPassword";

/**
 * Página de autenticación que maneja el registro, inicio de sesión y recuperación de contraseña
 * utilizando los servicios de Firebase Authentication.
 */
export default function AuthPage() {
  const [view, setView] = useState<AuthView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = getAuth(firebaseApp);

  /**
   * Maneja el registro de un nuevo usuario con correo y contraseña en Firebase.
   * Valida que las contraseñas coincidan y muestra notificaciones de éxito o error.
   * @param e - Evento del formulario.
   */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast({
        title: "¡Cuenta creada!",
        description: "Tu cuenta ha sido creada exitosamente. Serás redirigido.",
      });
      router.push("/welcome");
    } catch (error: any) {
      toast({
        title: "Error de Registro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja el inicio de sesión de un usuario existente con Firebase.
   * Muestra notificaciones de éxito o error.
   * @param e - Evento del formulario.
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente.",
      });
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error de Inicio de Sesión",
        description: "Credenciales incorrectas. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Envía un correo de recuperación de contraseña a través de Firebase.
   * @param e - Evento del formulario.
   */
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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const AuthButton = ({ onClick, children }: { onClick: (e: React.FormEvent) => void, children: React.ReactNode }) => (
    <Button
      onClick={onClick}
      disabled={loading}
      className="w-full bg-white text-red-600 py-3 h-auto rounded-xl font-bold text-lg hover:bg-gray-200 transition-all duration-300 transform hover:scale-105"
    >
      {loading ? <Loader2 className="animate-spin" /> : children}
    </Button>
  );

  const AuthForms = () => {
    switch (view) {
      case "register":
        return (
          <form onSubmit={handleRegister} className="space-y-6 animate-fade-in">
            <div className="border border-white/10 bg-white/5 backdrop-blur-lg rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6 text-center">Crear Cuenta</h2>
              <div className="space-y-4">
                <Input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-white/90 text-slate-900 placeholder:text-slate-500 border-0 rounded-xl focus:ring-2 focus:ring-white focus:bg-white" />
                <Input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-white/90 text-slate-900 placeholder:text-slate-500 border-0 rounded-xl focus:ring-2 focus:ring-white focus:bg-white" />
                <Input type="password" placeholder="Confirmar contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="bg-white/90 text-slate-900 placeholder:text-slate-500 border-0 rounded-xl focus:ring-2 focus:ring-white focus:bg-white" />
                <AuthButton onClick={handleRegister}>Crear Cuenta</AuthButton>
              </div>
            </div>
            <div className="text-center">
              <button type="button" onClick={() => setView("login")} className="text-white/80 hover:text-white text-sm underline">
                ¿Ya tienes cuenta? Inicia sesión
              </button>
            </div>
          </form>
        );
      case "forgotPassword":
        return (
          <form onSubmit={handlePasswordReset} className="space-y-6 animate-fade-in">
            <div className="border border-white/10 bg-white/5 backdrop-blur-lg rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6 text-center">Recuperar Contraseña</h2>
              <p className="text-white/80 text-sm mb-4 text-center">Ingresa tu correo y te enviaremos un enlace para restablecerla.</p>
              <div className="space-y-4">
                <Input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-white/90 text-slate-900 placeholder:text-slate-500 border-0 rounded-xl focus:ring-2 focus:ring-white focus:bg-white" />
                <AuthButton onClick={handlePasswordReset}>Enviar Enlace</AuthButton>
              </div>
            </div>
            <div className="text-center">
              <button type="button" onClick={() => setView("login")} className="text-white/80 hover:text-white text-sm underline">
                Volver al inicio de sesión
              </button>
            </div>
          </form>
        );
      case "login":
      default:
        return (
          <form onSubmit={handleLogin} className="space-y-6 animate-fade-in">
            <div className="border border-white/10 bg-white/5 backdrop-blur-lg rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6 text-center">Iniciar Sesión</h2>
              <div className="space-y-4">
                <Input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-white/90 text-slate-900 placeholder:text-slate-500 border-0 rounded-xl focus:ring-2 focus:ring-white focus:bg-white" />
                <Input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-white/90 text-slate-900 placeholder:text-slate-500 border-0 rounded-xl focus:ring-2 focus:ring-white focus:bg-white" />
                <AuthButton onClick={handleLogin}>Iniciar Sesión</AuthButton>
              </div>
              <div className="mt-4 text-center">
                <button type="button" onClick={() => setView("forgotPassword")} className="text-white/80 hover:text-white text-sm underline">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>
            <div className="text-center">
              <p className="text-white/80 mb-4">¿No tienes cuenta?</p>
              <Button onClick={() => setView("register")} variant="outline" className="bg-white/20 text-white px-8 py-3 h-auto rounded-xl font-medium hover:bg-white/30 transition-all duration-300 border-0 hover:text-white">
                Crear Cuenta
              </Button>
            </div>
          </form>
        );
    }
  };

  return (
    <MobileAppContainer className="bg-gradient-to-br from-red-800 via-red-900 to-black">
      <div className="flex-1 flex flex-col justify-center px-8 py-12 overflow-y-auto">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-white rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
            <EmergencyLogoIcon className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">EmergenciaGT</h1>
          <p className="text-red-100 text-lg font-medium">Sistema de Emergencias</p>
          <p className="text-red-200 text-sm mt-1">Respuesta Rápida • Guatemala</p>
        </div>
        
        <AuthForms />

      </div>
    </MobileAppContainer>
  );
}

    