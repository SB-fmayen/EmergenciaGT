"use client";

import { useState } from "react";
import { MobileAppContainer } from "@/components/MobileAppContainer";
import { PanicButton } from "@/components/dashboard/PanicButton";
import { EmergencyModal } from "@/components/dashboard/EmergencyModal";
import { MedicalInfoModal } from "@/components/dashboard/MedicalInfoModal";
import { QuickActions } from "@/components/dashboard/QuickActions";
import type { MedicalData } from "@/lib/types";

export default function DashboardPage() {
  const [isEmergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [isMedicalInfoModalOpen, setMedicalInfoModalOpen] = useState(false);
  const [medicalData, setMedicalData] = useState<MedicalData | null>(null);

  const handleActivateEmergency = () => {
    console.log("Emergency Activated!");
    setEmergencyModalOpen(true);
  };

  const handleShowMedicalInfo = () => {
    // In a real app, you'd fetch this data
    setMedicalInfoModalOpen(true);
  };

  return (
    <MobileAppContainer className="bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="flex flex-col h-full">
        <header className="bg-gradient-to-r from-red-600 to-red-800 text-white px-6 py-6 text-center shadow-lg flex-shrink-0">
          <h1 className="text-2xl font-bold mb-1">EmergenciaGT</h1>
          <p className="text-red-100 text-sm">
            Sistema de Alerta Inmediata
          </p>
        </header>

        <div className="flex-1 flex items-center justify-center px-6">
          <PanicButton onActivate={handleActivateEmergency} />
        </div>

        <QuickActions onShowMedicalInfo={handleShowMedicalInfo} />
      </div>

      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
      />

      <MedicalInfoModal
        isOpen={isMedicalInfoModalOpen}
        onClose={() => setMedicalInfoModalOpen(false)}
        medicalData={medicalData}
      />
    </MobileAppContainer>
  );
}
