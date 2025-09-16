
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MobileAppContainer } from "@/components/MobileAppContainer";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2, Info } from "lucide-react";
import { getFirestore, collection, addDoc, serverTimestamp, GeoPoint } from "firebase/firestore";
import { firebaseApp, auth } from "@/lib/firebase";
import { useAuth } from "@/app/(mobile)/layout";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "firebase/auth";
import { EmergencyModal } from "@/components/dashboard/EmergencyModal";
import { CancelAlertModal } from "@/components/dashboard/CancelAlertModal";
import { MedicalInfoModal } from "@/components/dashboard/MedicalInfoModal";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { EmergencyButton } from "@/components/dashboard/EmergencyButton";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import type { AlertData, MedicalData } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const firestore = getFirestore(firebaseApp);
  const { toast } = useToast();

  const [isActivating, setIsActivating] = useState(false);
  const [activeAlert, setActiveAlert] = useState<AlertData | null>(null);
  const [medicalData, setMedicalData] = useState<MedicalData | null>(null);
  
  // Estados para los modales
  const [isEmergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [isCancelModalOpen, setCancelModalOpen] = useState(false);
  const [isMedicalInfoModalOpen, setMedicalInfoModalOpen] = useState(false);
  
  const [isCancelling, setIsCancelling] = useState(false);

  // Cargar datos médicos al iniciar
  useEffect(() => {
    if (user && !user.isAnonymous) {
      const fetchMedicalData = async () => {
        const medicalInfoRef = doc(firestore, "medicalInfo", user.uid);
        const docSnap = await getDoc(medicalInfoRef);
        if (docSnap.exists()) {
          setMedicalData(docSnap.data() as MedicalData);
        }
      };
      fetchMedicalData();
    }
  }, [user, firestore]);

  const handleActivatePanic = async (type: string) => {
    if (!user) {
      toast({ title: "Error", description: "Debes iniciar sesión para enviar una alerta.", variant: "destructive" });
      return false;
    }
    
    setIsActivating(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;

      const newAlert: Omit<AlertData, 'id'> = {
        userId: user.uid,
        isAnonymous: user.isAnonymous,
        timestamp: serverTimestamp(),
        location: new GeoPoint(latitude, longitude),
        status: 'new',
        type: type,
      };

      const docRef = await addDoc(collection(firestore, "alerts"), newAlert);
      
      const createdAlert: AlertData = { ...newAlert, id: docRef.id, timestamp: new Date() };
      setActiveAlert(createdAlert);

      toast({ title: "¡Alerta Enviada!", description: "Los servicios de emergencia han sido notificados." });
      setEmergencyModalOpen(true);
      return true;

    } catch (error: any) {
      console.error("Error activating panic button:", error);
      let description = "No se pudo enviar la alerta. Inténtalo de nuevo.";
      if (error.code === 'PERMISSION_DENIED') {
        description = "Por favor, activa los permisos de geolocalización para enviar una alerta.";
      }
      toast({ title: "Error al enviar alerta", description, variant: "destructive" });
      return false;
    } finally {
      setIsActivating(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/auth');
  };
  
  const handleOpenCancelModal = () => {
    setEmergencyModalOpen(false); // Cierra el modal de éxito
    setCancelModalOpen(true);
  }

  const handleConfirmCancellation = async (reason: string) => {
    if (!activeAlert) return;
    setIsCancelling(true);

    try {
      const alertRef = doc(firestore, "alerts", activeAlert.id);
      await updateDoc(alertRef, {
        status: 'cancelled',
        cancellationReason: reason
      });
      toast({
        title: "Alerta Cancelada",
        description: "La alerta ha sido cancelada correctamente."
      });
      setActiveAlert(null);
      setCancelModalOpen(false);
    } catch(e) {
      console.error("Error cancelling alert:", e);
      toast({ title: "Error", description: "No se pudo cancelar la alerta.", variant: "destructive"})
    } finally {
      setIsCancelling(false);
    }
  }


  if (authLoading) {
    return (
      <MobileAppContainer className="bg-slate-900 justify-center items-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </MobileAppContainer>
    );
  }

  return (
    <MobileAppContainer className="bg-gradient-to-b from-slate-900 to-red-900/50">
      <header className="px-6 py-4 flex justify-between items-center text-white flex-shrink-0">
        <div>
           <p className="text-lg font-medium">{user?.isAnonymous ? "Invitado" : (medicalData?.fullName || "Usuario")}</p>
           <p className="text-sm text-slate-400">EmergenciaGT</p>
        </div>
        <Button onClick={handleLogout} variant="ghost" size="icon" className="text-slate-300 hover:bg-white/10 hover:text-white">
          <LogOut />
        </Button>
      </header>

      <div className="flex-1 flex flex-col justify-center items-center p-6 space-y-4">
        <EmergencyButton 
            title="Incendio"
            onActivate={() => handleActivatePanic('Incendio')}
            className="bg-gradient-to-br from-orange-500 to-red-600 shadow-orange-500/20"
            disabled={isActivating}
        />
         <EmergencyButton 
            title="Accidente"
            onActivate={() => handleActivatePanic('Accidente')}
            className="bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20"
            disabled={isActivating}
        />
         <EmergencyButton 
            title="Emergencia Médica"
            onActivate={() => handleActivatePanic('Emergencia Médica')}
            className="bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/20"
            disabled={isActivating}
        />
      </div>

      <QuickActions 
        onShowMedicalInfo={() => setMedicalInfoModalOpen(true)} 
        onShowAlerts={() => router.push('/alerts')}
        isAnonymous={!!user?.isAnonymous}
      />
      
      {/* Modales */}
      <EmergencyModal 
        isOpen={isEmergencyModalOpen} 
        onClose={() => setEmergencyModalOpen(false)}
        onCancel={handleOpenCancelModal}
      />
      <CancelAlertModal 
        isOpen={isCancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleConfirmCancellation}
        isCancelling={isCancelling}
      />
      <MedicalInfoModal
        isOpen={isMedicalInfoModalOpen}
        onClose={() => setMedicalInfoModalOpen(false)}
        medicalData={medicalData}
        isAnonymous={user?.isAnonymous}
      />

    </MobileAppContainer>
  );
}
