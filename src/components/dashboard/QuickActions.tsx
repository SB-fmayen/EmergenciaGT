
"use client";

import { Button } from "@/components/ui/button";
import { ClipboardList, History, ShieldOff } from "lucide-react";

interface QuickActionsProps {
  onShowMedicalInfo: () => void;
  onShowAlerts: () => void;
  isAnonymous: boolean;
}

export function QuickActions({ onShowMedicalInfo, onShowAlerts, isAnonymous }: QuickActionsProps) {

  return (
    <div className="px-6 py-6 bg-black/20 backdrop-blur-sm">
      <div className="grid grid-cols-2 gap-4">
        <Button 
            onClick={onShowAlerts} 
            className="h-auto py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
            disabled={isAnonymous}
            aria-disabled={isAnonymous}
        >
          {isAnonymous ? <ShieldOff className="mr-2" /> : <History className="mr-2" />}
          Historial
        </Button>
        <Button
          onClick={onShowMedicalInfo}
          className="h-auto py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          <ClipboardList className="mr-2" /> Info Médica
        </Button>
      </div>
    </div>
  );
}
