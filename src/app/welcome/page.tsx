"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmergencyLogoIcon } from "@/components/icons/EmergencyLogoIcon";
import { MobileAppContainer } from "@/components/MobileAppContainer";
import { ClipboardHeart, ShieldAlert } from "lucide-react";

export default function WelcomePage() {
  return (
    <MobileAppContainer className="bg-gradient-to-br from-red-800 via-red-900 to-black">
      <div className="flex-1 flex flex-col justify-center px-8 py-12 animate-fade-in">
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-white rounded-full mx-auto mb-6 flex items-center justify-center shadow-xl">
            <EmergencyLogoIcon className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">¡Bienvenido!</h1>
          <p className="text-red-100 text-lg font-medium mb-2">
            Sistema de Emergencias Guatemala
          </p>
          <p className="text-red-200 text-sm">
            Respuesta rápida cuando más lo necesitas
          </p>
        </div>

        <div className="border border-white/10 bg-white/5 backdrop-blur-lg rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-4 text-center">
            ¿Cómo prefieres continuar?
          </h2>
          <p className="text-white/80 text-center mb-6">
            Puedes usar la app inmediatamente o registrar tus datos médicos para
            una respuesta más rápida.
          </p>

          <div className="space-y-4">
            <Button asChild className="w-full bg-red-500 hover:bg-red-600 text-white py-4 h-auto rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
              <Link href="/dashboard">
                <ShieldAlert className="mr-2" />
                Usar Ahora
              </Link>
            </Button>
            <Button asChild className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 h-auto rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
              <Link href="/medical-info">
                <ClipboardHeart className="mr-2" />
                Registrar Datos Médicos
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </MobileAppContainer>
  );
}
