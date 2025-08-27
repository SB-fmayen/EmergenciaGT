
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmergencyLogoIcon } from "@/components/icons/EmergencyLogoIcon";
import { MobileAppContainer } from "@/components/MobileAppContainer";
import { useToast } from "@/hooks/use-toast";

type AuthView = "login" | "register" | "forgotPassword";

export default function AuthPage() {
  const [view, setView] = useState<AuthView>("login");
  const router = useRouter();
  const { toast } = useToast();

  const handleAuthAction = (action: AuthView) => {
    // Simulate auth logic
    let title = "";
    let description = "";
    let redirectPath = "/welcome";

    if (action === "login") {
      title = "¡Bienvenido!";
      description = "Has iniciado sesión correctamente.";
    } else if (action === "register") {
      title = "¡Cuenta creada!";
      description = "Tu cuenta ha sido creada exitosamente.";
    } else if (action === "forgotPassword") {
      title = "¡Enlace enviado!";
      description = "Revisa tu correo para restablecer tu contraseña.";
      redirectPath = ""; // Don't redirect, just show message and switch to login
    }
    
    toast({
      title,
      description,
    });

    if (redirectPath) {
      setTimeout(() => router.push(redirectPath), 1000);
    } else {
      setView('login');
    }
  };

  const AuthForms = () => {
    switch (view) {
      case "register":
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="border border-white/10 bg-white/5 backdrop-blur-lg rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6 text-center">Crear Cuenta</h2>
              <div className="space-y-4">
                <Input type="text" placeholder="Nombre completo" className="bg-white/90 text-slate-900 placeholder:text-slate-500 border-0 rounded-xl focus:ring-2 focus:ring-white focus:bg-white" />
                <Input type="email" placeholder="Correo electrónico" className="bg-white/90 text-slate-900 placeholder:text-slate-500 border-0 rounded-xl focus:ring-2 focus:ring-white focus:bg-white" />
                <Input type="tel" placeholder="Teléfono" className="bg-white/90 text-slate-900 placeholder:text-slate-500 border-0 rounded-xl focus:ring-2 focus:ring-white focus:bg-white" />
                <Input type="password" placeholder="Contraseña" className="bg-white/90 text-slate-900 placeholder:text-slate-500 border-0 rounded-xl focus:ring-2 focus:ring-white focus:bg-white" />
                <Input type="password" placeholder="Confirmar contraseña" className="bg-white/90 text-slate-900 placeholder:text-slate-500 border-0 rounded-xl focus:ring-2 focus:ring-white focus:bg-white" />
                <Button onClick={() => handleAuthAction('register')} className="w-full bg-white text-red-600 py-3 h-auto rounded-xl font-bold text-lg hover:bg-gray-200 transition-all duration-300 transform hover:scale-105">
                  Crear Cuenta
                </Button>
              </div>
            </div>
            <div className="text-center">
              <button onClick={() => setView("login")} className="text-white/80 hover:text-white text-sm underline">
                ¿Ya tienes cuenta? Inicia sesión
              </button>
            </div>
          </div>
        );
      case "forgotPassword":
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="border border-white/10 bg-white/5 backdrop-blur-lg rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6 text-center">Recuperar Contraseña</h2>
              <p className="text-white/80 text-sm mb-4 text-center">Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.</p>
              <div className="space-y-4">
                <Input type="email" placeholder="Correo electrónico" className="bg-white/90 text-slate-900 placeholder:text-slate-500 border-0 rounded-xl focus:ring-2 focus:ring-white focus:bg-white" />
                <Button onClick={() => handleAuthAction('forgotPassword')} className="w-full bg-white text-red-600 py-3 h-auto rounded-xl font-bold text-lg hover:bg-gray-200 transition-all duration-300 transform hover:scale-105">
                  Enviar Enlace
                </Button>
              </div>
            </div>
            <div className="text-center">
              <button onClick={() => setView("login")} className="text-white/80 hover:text-white text-sm underline">
                Volver al inicio de sesión
              </button>
            </div>
          </div>
        );
      case "login":
      default:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="border border-white/10 bg-white/5 backdrop-blur-lg rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6 text-center">Iniciar Sesión</h2>
              <div className="space-y-4">
                <Input type="email" placeholder="Correo electrónico" className="bg-white/90 text-slate-900 placeholder:text-slate-500 border-0 rounded-xl focus:ring-2 focus:ring-white focus:bg-white" />
                <Input type="password" placeholder="Contraseña" className="bg-white/90 text-slate-900 placeholder:text-slate-500 border-0 rounded-xl focus:ring-2 focus:ring-white focus:bg-white" />
                <Button onClick={() => handleAuthAction('login')} className="w-full bg-white text-red-600 py-3 h-auto rounded-xl font-bold text-lg hover:bg-gray-200 transition-all duration-300 transform hover:scale-105">
                  Iniciar Sesión
                </Button>
              </div>
              <div className="mt-4 text-center">
                <button onClick={() => setView("forgotPassword")} className="text-white/80 hover:text-white text-sm underline">
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
          </div>
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
