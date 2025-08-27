
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { firebaseApp } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmergencyLogoIcon } from "@/components/icons/EmergencyLogoIcon";
import { MobileAppContainer } from "@/components/MobileAppContainer";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";

type AuthView = "login" | "register" | "forgotPassword";

const AuthButton = ({ onClick, children, loading }: { onClick: (e: React.FormEvent) => void, children: React.ReactNode, loading: boolean }) => (
    <Button
      onClick={onClick}
      disabled={loading}
      className="w-full bg-white text-red-600 py-3 h-auto rounded-xl font-bold text-lg hover:bg-gray-200 transition-all duration-300 transform hover:scale-105"
    >
      {loading ? <Loader2 className="animate-spin" /> : children}
    </Button>
  );

const LoginForm = ({ setView, onFormSubmit }: { setView: (view: AuthView) => void, onFormSubmit: (e: React.FormEvent, email: string, pass: string) => void }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    return (
        <form onSubmit={(e) => onFormSubmit(e, email, password)} className="space-y-6 animate-fade-in">
            <div className="border border-white/10 bg-white/5 backdrop-blur-lg rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6 text-center">Iniciar Sesión</h2>
              <div className="space-y-4">
                <Input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-white/90 text-slate-900 placeholder:text-slate-500 border-0 rounded-xl focus:ring-2 focus:ring-white focus:bg-white" />
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-white/90 text-slate-900 placeholder:text-slate-500 border-0 rounded-xl focus:ring-2 focus:ring-white focus:bg-white pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-600">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <AuthButton onClick={(e) => onFormSubmit(e, email, password)} loading={false}>Iniciar Sesión</AuthButton>
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
};

const RegisterForm = ({ setView, onFormSubmit }: { setView: (view: AuthView) => void, onFormSubmit: (e: React.FormEvent, email: string, pass: string, confirm:string) => void }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    return (
        <form onSubmit={(e) => onFormSubmit(e, email, password, confirmPassword)} className="space-y-6 animate-fade-in">
        <div className="border border-white/10 bg-white/5 backdrop-blur-lg rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6 text-center">Crear Cuenta</h2>
          <div className="space-y-4">
            <Input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-white/90 text-slate-900 placeholder:text-slate-500 border-0 rounded-xl focus:ring-2 focus:ring-white focus:bg-white" />
            <div className="relative">
                <Input type={showPassword ? "text" : "password"} placeholder="Contraseña (mín. 6 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-white/90 text-slate-900 placeholder:text-slate-500 border-0 rounded-xl focus:ring-2 focus:ring-white focus:bg-white pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-600">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
            </div>
            <div className="relative">
                <Input type={showConfirmPassword ? "text" : "password"} placeholder="Confirmar contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="bg-white/90 text-slate-900 placeholder:text-slate-500 border-0 rounded-xl focus:ring-2 focus:ring-white focus:bg-white pr-10" />
                 <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-600">
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
            </div>
            <AuthButton onClick={(e) => onFormSubmit(e, email, password, confirmPassword)} loading={false}>Crear Cuenta</AuthButton>
          </div>
        </div>
        <div className="text-center">
          <button type="button" onClick={() => setView("login")} className="text-white/80 hover:text-white text-sm underline">
            ¿Ya tienes cuenta? Inicia sesión
          </button>
        </div>
      </form>
    );
};

const ForgotPasswordForm = ({ setView, onFormSubmit }: { setView: (view: AuthView) => void, onFormSubmit: (e: React.FormEvent, email: string) => void }) => {
    const [email, setEmail] = useState("");
    return (
        <form onSubmit={(e) => onFormSubmit(e, email)} className="space-y-6 animate-fade-in">
        <div className="border border-white/10 bg-white/5 backdrop-blur-lg rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6 text-center">Recuperar Contraseña</h2>
          <p className="text-white/80 text-sm mb-4 text-center">Ingresa tu correo y te enviaremos un enlace para restablecerla.</p>
          <div className="space-y-4">
            <Input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-white/90 text-slate-900 placeholder:text-slate-500 border-0 rounded-xl focus:ring-2 focus:ring-white focus:bg-white" />
            <AuthButton onClick={(e) => onFormSubmit(e, email)} loading={false}>Enviar Enlace</AuthButton>
          </div>
        </div>
        <div className="text-center">
          <button type="button" onClick={() => setView("login")} className="text-white/80 hover:text-white text-sm underline">
            Volver al inicio de sesión
          </button>
        </div>
      </form>
    );
};


/**
 * Página de autenticación que maneja el registro, inicio de sesión y recuperación de contraseña
 * utilizando los servicios de Firebase Authentication. Es la página de entrada a la aplicación.
 */
export default function AuthPage() {
  const [view, setView] = useState<AuthView>("login");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = getAuth(firebaseApp);

  /**
   * Maneja el registro de un nuevo usuario con correo y contraseña en Firebase.
   * Valida que las contraseñas coincidan y muestra notificaciones de éxito o error.
   * Redirige a la página de bienvenida para el registro de datos médicos.
   * @param e - Evento del formulario.
   */
  const handleRegister = async (e: React.FormEvent, email:string, password:string, confirmPassword:string) => {
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
        description: "Tu cuenta ha sido creada exitosamente. Ahora registra tus datos médicos.",
      });
      router.push("/medical-info"); // Redirige a la página de información médica
    } catch (error: any) {
      const errorCode = error.code;
      let errorMessage = "Ocurrió un error desconocido.";
      if (errorCode === 'auth/email-already-in-use') {
        errorMessage = "Este correo electrónico ya está en uso.";
      } else if (errorCode === 'auth/weak-password') {
        errorMessage = "La contraseña es demasiado débil. Debe tener al menos 6 caracteres.";
      } else if (errorCode === 'auth/invalid-email') {
        errorMessage = "El formato del correo electrónico no es válido.";
      }
      toast({
        title: "Error de Registro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja el inicio de sesión de un usuario existente con Firebase.
   * Redirige al dashboard principal si el inicio de sesión es exitoso.
   * @param e - Evento del formulario.
   */
  const handleLogin = async (e: React.FormEvent, email: string, password: string) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "¡Bienvenido de nuevo!",
        description: "Has iniciado sesión correctamente.",
      });
      router.push("/dashboard"); // Redirige al dashboard principal
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
  const handlePasswordReset = async (e: React.FormEvent, email: string) => {
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
        description: "Asegúrate de que el correo electrónico sea correcto.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const renderForm = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      );
    }

    switch (view) {
      case "register":
        return <RegisterForm setView={setView} onFormSubmit={handleRegister} />;
      case "forgotPassword":
        return <ForgotPasswordForm setView={setView} onFormSubmit={handlePasswordReset} />;
      case "login":
      default:
        return <LoginForm setView={setView} onFormSubmit={handleLogin} />;
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
        
        {renderForm()}

      </div>
    </MobileAppContainer>
  );
}

    