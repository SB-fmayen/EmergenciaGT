"use client";

import { Button } from "@/components/ui/button";
import { Ambulance, Flame, Shield, ClipboardList } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QuickActionsProps {
  onShowMedicalInfo: () => void;
}

export function QuickActions({ onShowMedicalInfo }: QuickActionsProps) {
    const { toast } = useToast();

    const handleActionClick = (service: string) => {
        toast({
            title: `Llamando a ${service}`,
            description: "Esta es una demostración del sistema de alerta."
        })
    }
  return (
    <div className="px-6 py-6 bg-black/20 backdrop-blur-sm">
      <h3 className="text-lg font-bold text-white mb-4 text-center">
        Acciones Rápidas
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <Button onClick={() => handleActionClick("Ambulancia")} className="h-auto py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium transition-all duration-300 transform hover:scale-105 shadow-lg">
          <Ambulance className="mr-2" /> Ambulancia
        </Button>
        <Button onClick={() => handleActionClick("Bomberos")} className="h-auto py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium transition-all duration-300 transform hover:scale-105 shadow-lg">
          <Flame className="mr-2" /> Bomberos
        </Button>
        <Button onClick={() => handleActionClick("Policía")} className="h-auto py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all duration-300 transform hover:scale-105 shadow-lg">
          <Shield className="mr-2" /> Policía
        </Button>
        <Button
          onClick={onShowMedicalInfo}
          className="h-auto py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          <ClipboardList className="mr-2" /> Info Médica
        </Button>
      </div>
    </div>
  );
}
