
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signInAnonymously,
  fetchSignInMethodsForEmail,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileAppContainer } from "@/components/MobileAppContainer";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, ShieldQuestion } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type AuthView = "login" | "register" | "forgotPassword";

const AuthButton = ({ onClick, loading, children }: { onClick: (e?: React.MouseEvent<HTMLButtonElement>) => void, loading: boolean, children: React.ReactNode }) => {
    return (
        <Button
        onClick={onClick}
        disabled={loading}
        className="w-full bg-white text-red-600 py-3 h-auto rounded-xl font-bold text-lg hover:bg-gray-200 transition-all duration-300 transform hover:scale-105"
        >
        {loading ? <Loader2 className="animate-spin" /> : children}
        </Button>
    );
};

const LoginForm = ({ setView, onFormSubmit, loading }: { setView: (view: AuthView) => void, onFormSubmit: (email: string, pass: string, keepLoggedIn: boolean) => void, loading: boolean }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [keepLoggedIn, setKeepLoggedIn] = useState(true);

    return (
        <form onSubmit={(e) => { e.preventDefault(); onFormSubmit(email, password, keepLoggedIn); }} className="space-y-6 animate-fade-in">
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
                <div className="flex items-center space-x-2">
                    <Checkbox id="keep-logged-in" checked={keepLoggedIn} onCheckedChange={(checked) => setKeepLoggedIn(!!checked)} className="border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-red-600"/>
                    <Label htmlFor="keep-logged-in" className="text-white/80">Mantener sesión iniciada</Label>
                </div>
                <AuthButton onClick={() => onFormSubmit(email, password, keepLoggedIn)} loading={loading}>Iniciar Sesión</AuthButton>
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

const RegisterForm = ({ setView, onFormSubmit, loading }: { setView: (view: AuthView) => void, onFormSubmit: (email: string, pass: string, confirm:string) => void, loading: boolean }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    return (
        <form onSubmit={(e) => { e.preventDefault(); onFormSubmit(email, password, confirmPassword);}} className="space-y-6 animate-fade-in">
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
            <AuthButton onClick={() => onFormSubmit(email, password, confirmPassword)} loading={loading}>Crear Cuenta</AuthButton>
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

const ForgotPasswordForm = ({ setView, onFormSubmit, loading }: { setView: (view: AuthView) => void, onFormSubmit: (email: string) => void, loading: boolean }) => {
    const [email, setEmail] = useState("");

    return (
        <form onSubmit={(e) => {e.preventDefault(); onFormSubmit(email);}} className="space-y-6 animate-fade-in">
        <div className="border border-white/10 bg-white/5 backdrop-blur-lg rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6 text-center">Recuperar Contraseña</h2>
          <p className="text-white/80 text-sm mb-4 text-center">Ingresa tu correo y te enviaremos un enlace para restablecerla.</p>
          <div className="space-y-4">
            <Input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-white/90 text-slate-900 placeholder:text-slate-500 border-0 rounded-xl focus:ring-2 focus:ring-white focus:bg-white" />
            <AuthButton onClick={() => onFormSubmit(email)} loading={loading}>Enviar Enlace</AuthButton>
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


export default function AuthPage() {
  const [view, setView] = useState<AuthView>("login");
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setAuthLoading(false);
      // Let the protected layout handle redirection for logged-in users.
    });
    return () => unsubscribe();
  }, [router]);

  const handleAuthAction = async (action: () => Promise<any>, successPath?: string) => {
    if (loading) return;
    setLoading(true);
    try {
        const result = await action();
        // Redirect on success
        if (successPath) {
            router.push(successPath);
        }
        return result;
    } catch (error: any) {
        handleFirebaseAuthError(error);
    } finally {
        setLoading(false);
    }
  }

  const handleRegister = (email:string, password:string, confirmPassword:string) => {
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Las contraseñas no coinciden.", variant: "destructive" });
      return;
    }
    handleAuthAction(() => createUserWithEmailAndPassword(auth, email, password), "/welcome");
  };

  const handleLogin = (email: string, password: string, keepLoggedIn: boolean) => {
    handleAuthAction(async () => {
      const persistenceType = keepLoggedIn
        ? browserLocalPersistence
        : browserSessionPersistence;
      await setPersistence(auth, persistenceType);
      await signInWithEmailAndPassword(auth, email, password);
    }, "/dashboard"); // Redirect to dashboard on successful login
  };

  const handlePasswordReset = (email: string) => {
    handleAuthAction(async () => {
        if (!email) {
            toast({ title: "Error", description: "Por favor, ingresa un correo electrónico.", variant: "destructive" });
            return;
        }
        const signInMethods = await fetchSignInMethodsForEmail(auth, email);
        if (signInMethods.length === 0) {
            toast({ title: "Error", description: "El correo proporcionado no se encuentra registrado.", variant: "destructive" });
            return;
        }

        await sendPasswordResetEmail(auth, email);
        toast({ title: "¡Enlace enviado!", description: "Revisa tu correo para restablecer tu contraseña." });
        setView("login");
    });
  };

  const handleAnonymousSignIn = () => {
    handleAuthAction(() => signInAnonymously(auth), "/dashboard");
  }

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
            errorMessage = "Ocurrió un error. Por favor, intenta de nuevo.";
            console.error("Firebase Auth Error:", error);
            break;
      }
      toast({ title: "Error de Autenticación", description: errorMessage, variant: "destructive" });
  }

  const renderForm = () => {
    switch (view) {
      case "register":
        return <RegisterForm setView={setView} onFormSubmit={handleRegister} loading={loading} />;
      case "forgotPassword":
        return <ForgotPasswordForm setView={setView} onFormSubmit={handlePasswordReset} loading={loading} />;
      case "login":
      default:
        return <LoginForm setView={setView} onFormSubmit={handleLogin} loading={loading} />;
    }
  };
  
  if (authLoading) {
      return (
          <MobileAppContainer className="bg-gradient-to-br from-red-800 via-red-900 to-black justify-center items-center">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
          </MobileAppContainer>
      )
  }

  return (
    <MobileAppContainer className="bg-gradient-to-br from-red-800 via-red-900 to-black">
      <div className="flex-1 flex flex-col justify-center px-8 py-12 overflow-y-auto">
        <div className="text-center mb-12">
           <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center">
             <Image 
                src="http://bomberosvoluntarios.org.gt/assets/img/about.jpg" 
                alt="Logo Bomberos Voluntarios" 
                width={96} 
                height={96} 
                className="rounded-full object-cover"
              />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">EmergenciaGT</h1>
          <p className="text-red-100 text-lg font-medium">Sistema de Emergencias</p>
          <p className="text-red-200 text-sm mt-1">Benemérito Cuerpo Voluntario de Bomberos de Guatemala</p>
        </div>
        
        {renderForm()}
        
         <div className="mt-6 text-center">
            <Button 
                variant="link" 
                className="text-white/80 hover:text-white"
                onClick={handleAnonymousSignIn}
                disabled={loading}
            >
                {loading ? <Loader2 className="animate-spin" /> : <ShieldQuestion className="w-4 h-4 mr-2" />}
                 Ingresar como Invitado
            </Button>
        </div>

      </div>
    </MobileAppContainer>
  );
}
