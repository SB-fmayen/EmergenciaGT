
"use client";

import { useState, useEffect } from "react";
import { MobileAppContainer } from "@/components/MobileAppContainer";
import { EmergencyModal } from "@/components/dashboard/EmergencyModal";
import { MedicalInfoModal } from "@/components/dashboard/MedicalInfoModal";
import { CancelAlertModal } from "@/components/dashboard/CancelAlertModal";
import { QuickActions } from "@/components/dashboard/QuickActions";
import type { MedicalData, AlertData } from "@/lib/types";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp, collection, GeoPoint, updateDoc } from "firebase/firestore";
import { firebaseApp, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, User as UserIcon, WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { PanicButton } from "@/components/dashboard/PanicButton";
import { EmergencyButton } from "@/components/dashboard/EmergencyButton";
import { useAuth } from "../layout";
import { signOut } from "firebase/auth";


export default function DashboardPage() {
  const [isEmergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [isCancelModalOpen, setCancelModalOpen] = useState(false);
  const [isMedicalInfoModalOpen, setMedicalInfoModalOpen] = useState(false);
  const [medicalData, setMedicalData] = useState<MedicalData | null>(null);
  const [alertData, setAlertData] = useState<AlertData | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const firestore = getFirestore(firebaseApp);
  const { toast } = useToast();
  const router = useRouter();
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (authLoading) return;
    if (!user) return; // The layout will redirect.

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
  }, [user, authLoading, router, firestore]);

  const getUserLocation = (): Promise<{ latitude: number; longitude: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        toast({ title: "Error", description: "La geolocalización no es soportada por tu navegador.", variant: "destructive"});
        resolve(null);
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
          (error) => {
            let errorMessage = "No se pudo obtener tu ubicación. ";
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage += "Permiso denegado.";
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage += "La información de ubicación no está disponible.";
                    break;
                case error.TIMEOUT:
                    errorMessage += "Se agotó el tiempo de espera.";
                    break;
                default:
                    errorMessage += "Ocurrió un error desconocido.";
                    break;
            }
            toast({ title: "Error de Ubicación", description: errorMessage, variant: "destructive" });
            resolve(null);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      }
    });
  };

  const handleActivateEmergency = async (alertType: string): Promise<boolean> => {
    if (isActivating || !user) {
      toast({ title: "Error", description: "No se pudo verificar tu sesión para enviar la alerta."});
      return false;
    }
    setIsActivating(true);

    const location = await getUserLocation();
    if (!location) {
      toast({ title: "Activación Cancelada", description: "No se pudo activar la alerta sin tu ubicación.", variant: "destructive" });
      setIsActivating(false);
      return false;
    }

    try {
      const alertDocRef = doc(collection(firestore, "alerts"));
      const newAlert: AlertData = {
        id: alertDocRef.id,
        userId: user.uid, // Aseguramos usar el ID del usuario del contexto
        timestamp: serverTimestamp(),
        location: new GeoPoint(location.latitude, location.longitude),
        status: 'new',
        type: alertType,
        isAnonymous: user.isAnonymous,
      };

      await setDoc(alertDocRef, newAlert);
      setAlertData(newAlert);
      setEmergencyModalOpen(true);
      setIsActivating(false);
      return true;
    } catch (error) {
      console.error("Error creating alert:", error);
      toast({ title: "Error", description: "No se pudo crear la alerta. Inténtalo de nuevo.", variant: "destructive"});
      setIsActivating(false);
      return false;
    }
  };
  
  const handleShowMedicalInfo = () => setMedicalInfoModalOpen(true);
  
  const handleShowAlerts = () => {
    if (user?.isAnonymous) {
      toast({ title: "Modo Invitado", description: "El historial de alertas solo está disponible para usuarios registrados." });
      return;
    }
    router.push('/alerts');
  };

  const handleLogout = async () => {
    try {
        await signOut(auth);
        toast({ title: "Sesión Cerrada" });
        router.push('/auth');
    } catch (error) {
        toast({ title: "Error al cerrar sesión", variant: "destructive" });
    }
  };

  if (authLoading || !user) {
    return (
      <MobileAppContainer className="bg-slate-900 justify-center items-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </MobileAppContainer>
    );
  }

  return (
    <MobileAppContainer className="bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        {!isOnline && (
            <div className="absolute top-0 left-0 right-0 bg-yellow-500 text-black text-center py-1 text-sm font-bold flex justify-center items-center gap-2 z-50">
                <WifiOff className="w-4 h-4" /> Estás sin conexión
            </div>
        )}
         <div className="flex flex-col h-full">
        <header className="relative bg-gradient-to-r from-red-600 to-red-800 text-white px-6 py-6 text-center shadow-lg flex-shrink-0">
          <h1 className="text-2xl font-bold mb-1">EmergenciaGT</h1>
          <p className="text-red-100 text-sm">
             {user.isAnonymous ? "Modo de Emergencia (Invitado)" : "Mantén presionado para activar"}
          </p>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="absolute top-4 right-4 hover:bg-white/10"
            aria-label="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </Button>
            {user.isAnonymous && (
                 <div className="absolute top-4 left-4 flex items-center bg-yellow-500/20 text-yellow-300 text-xs font-bold px-2 py-1 rounded-full">
                    <UserIcon className="w-4 h-4 mr-1.5"/>
                    Invitado
                </div>
            )}
        </header>

        <main className="flex-1 flex flex-col justify-center p-6 space-y-8">
            <PanicButton onActivate={() => handleActivateEmergency('Pánico General')} disabled={isActivating || !isOnline} />
            
            <div>
                 <h2 className="text-base font-bold text-center text-white mb-4">¿O es una de estas emergencias?</h2>
                 <div className="grid grid-cols-2 gap-4">
                    <EmergencyButton
                        title="Accidente Vehicular"
                        onActivate={() => handleActivateEmergency('Accidente Vehicular')}
                        className="bg-gradient-to-br from-blue-500 to-blue-700"
                        disabled={isActivating || !isOnline}
                    />
                    <EmergencyButton
                        title="Incendio"
                        onActivate={() => handleActivateEmergency('Incendio')}
                        className="bg-gradient-to-br from-orange-500 to-red-600"
                        disabled={isActivating || !isOnline}
                    />
                    <EmergencyButton
                        title="Crisis Médica"
                        onActivate={() => handleActivateEmergency('Crisis Médica')}
                        className="bg-gradient-to-br from-rose-500 to-fuchsia-600"
                        disabled={isActivating || !isOnline}
                    />
                    <EmergencyButton
                        title="Asistencia Ciudadana"
                        onActivate={() => handleActivateEmergency('Asistencia Ciudadana')}
                        className="bg-gradient-to-br from-teal-500 to-cyan-600"
                        disabled={isActivating || !isOnline}
                    />
                </div>

                 {isActivating && (
                    <div className="flex justify-center items-center gap-2 text-white animate-fade-in mt-4">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Procesando alerta...</span>
                    </div>
                 )}
            </div>
        </main>

        <QuickActions 
          onShowMedicalInfo={handleShowMedicalInfo} 
          onShowAlerts={handleShowAlerts} 
          isAnonymous={user.isAnonymous}
        />
      </div>

      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
        onCancel={() => { setEmergencyModalOpen(false); setCancelModalOpen(true); }}
      />

      <CancelAlertModal
        isOpen={isCancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={async (reason) => {
            if (!alertData) return;
            setIsCancelling(true);
            try {
                await updateDoc(doc(firestore, "alerts", alertData.id), { status: 'cancelled', cancellationReason: reason });
                toast({ title: "Alerta Cancelada", description: "Tu solicitud de ayuda ha sido cancelada." });
                setCancelModalOpen(false);
            } catch (e) {
                toast({ title: "Error", description: "No se pudo cancelar la alerta. Intenta de nuevo.", variant: "destructive"});
            } finally {
                setIsCancelling(false);
            }
        }}
        isCancelling={isCancelling}
      />

      <MedicalInfoModal
        isOpen={isMedicalInfoModalOpen}
        onClose={() => setMedicalInfoModalOpen(false)}
        medicalData={medicalData}
        isAnonymous={user.isAnonymous}
      />
    </MobileAppContainer>
  );
}
