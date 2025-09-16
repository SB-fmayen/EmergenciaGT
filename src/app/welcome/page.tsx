
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/layout";
import { MobileAppContainer } from "@/components/MobileAppContainer";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

export default function WelcomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <MobileAppContainer className="bg-slate-900 justify-center items-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </MobileAppContainer>
    );
  }

  return (
    <MobileAppContainer className="bg-gradient-to-br from-blue-800 via-blue-900 to-black">
      <div className="flex-1 flex flex-col justify-center items-center p-8 text-center text-white">
        <div className="animate-fade-in">
          <CheckCircle className="w-24 h-24 text-green-400 mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4">¡Bienvenido a EmergenciaGT!</h1>
          <p className="text-lg text-blue-200 mb-8">
            Tu cuenta ha sido creada. Para una mejor atención en emergencias, te recomendamos registrar tu información médica.
          </p>
        </div>

        <div className="w-full space-y-4 animate-slide-up">
           <Link href="/medical-info" passHref>
             <Button className="w-full bg-white text-blue-600 h-14 text-lg font-bold hover:bg-gray-200 transition-transform transform hover:scale-105">
                Registrar Info. Médica
                <ArrowRight className="ml-2" />
             </Button>
           </Link>
           <Link href="/dashboard" passHref>
            <Button variant="ghost" className="w-full text-blue-200 hover:text-white hover:bg-white/10">
                Omitir por ahora
            </Button>
           </Link>
        </div>
      </div>
    </MobileAppContainer>
  );
}
