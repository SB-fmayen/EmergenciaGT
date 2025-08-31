
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MobileAppContainer } from "@/components/MobileAppContainer";
import { ClipboardList, ShieldAlert } from "lucide-react";
import { EmergencyLogo } from "@/components/EmergencyLogo";


/**
 * Página de bienvenida que se muestra después de un registro exitoso.
 * Ofrece al usuario la opción de ir directamente al dashboard o registrar primero su información médica.
 */
export default function WelcomePage() {
  return (
    <MobileAppContainer className="bg-gradient-to-br from-red-800 via-red-900 to-black">
      <div className="flex-1 flex flex-col justify-center px-8 py-12 animate-fade-in">
        <div className="text-center mb-12">
          <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <EmergencyLogo className="w-full h-full" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">¡Cuenta Creada!</h1>
          <p className="text-red-100 text-lg font-medium mb-2">
            El siguiente paso es importante
          </p>
          <p className="text-red-200 text-sm">
            Tus datos médicos pueden salvar tu vida.
          </p>
        </div>

        <div className="border border-white/10 bg-white/5 backdrop-blur-lg rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-4 text-center">
            Completa tu perfil médico
          </h2>
          <p className="text-white/80 text-center mb-6">
            Dedica un momento a registrar tu información. Esto permitirá a los servicios de emergencia darte una atención más efectiva y rápida.
          </p>

          <div className="space-y-4">
             <Button asChild className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 h-auto rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
              <Link href="/medical-info">
                <ClipboardList className="mr-2" />
                Registrar Datos Médicos
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full bg-transparent hover:bg-white/10 border-white/20 text-white py-4 h-auto rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
              <Link href="/dashboard">
                <ShieldAlert className="mr-2" />
                Omitir por ahora
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </MobileAppContainer>
  );
}

    