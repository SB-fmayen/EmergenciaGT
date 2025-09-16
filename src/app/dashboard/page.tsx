
"use client";

import { useState, useEffect } from "react";
import { MobileAppContainer } from "@/components/MobileAppContainer";
import { EmergencyModal } from "@/components/dashboard/EmergencyModal";
import { MedicalInfoModal } from "@/components/dashboard/MedicalInfoModal";
import { CancelAlertModal } from "@/components/dashboard/CancelAlertModal";
import { QuickActions } from "@/components/dashboard/QuickActions";
import type { MedicalData, AlertData } from "@/lib/types";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp, collection, GeoPoint, updateDoc } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, User as UserIcon, WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { PanicButton } from "@/components/dashboard/PanicButton";
import { EmergencyButton } from "@/components/dashboard/EmergencyButton";
import { useAuth } from "@/app/layout";


export default function DashboardPage() {
  const [isEmergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [isCancelModalOpen, setCancelModalOpen] = useState(false);
  const [isMedicalInfoModalOpen, setMedicalInfoModalOpen] = useState(false);
  const [medicalData, setMedicalData] = useState<MedicalData | null>(null);
  const [alertData, setAlertData] = useState<AlertData | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const { user, loading: authLoading, userRole } = useAuth();
  const firestore = getFirestore(firebaseApp);
  const { toast } = useToast();
  const router = useRouter();
  const isOnline = useOnlineStatus();

  useEffect(() => {
    // Si la autenticación aún está cargando, no hacemos nada.
    if (authLoading) return;

    // Si no hay usuario, lo redirigimos a la página de autenticación.
    if (!user) {
      router.replace('/auth');
      return;
    }

    // Redirección según el rol del usuario
    if (userRole === 'admin' || userRole === 'operator') {
        router.replace('/dashboard/admin');
        return;
    }
    if (userRole === 'unit') {
        router.replace('/mission');
        return;
    }

    // Si el usuario es un ciudadano registrado (no anónimo), buscamos sus datos médicos.
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
  }, [user, authLoading, userRole, router, firestore]);

  const getUserLocation = (): Promise<{ latitude: number; longitude: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        toast({ title: "Error", description: "La geolocalización no es soportada por tu navegador.", variant: "destructive"});
        resolve(null);
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
          (error) => {
            // ... (manejo de errores de geolocalización)
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
  
  // ... (resto de los handlers: handleShowMedicalInfo, handleShowAlerts, etc.)
  const handleShowMedicalInfo = () => setMedicalInfoModalOpen(true);
  const handleShowAlerts = () => {
    if (user?.isAnonymous) {
      toast({ title: "Modo Invitado", description: "El historial de alertas solo está disponible para usuarios registrados." });
      return;
    }
    router.push('/alerts');
  };

  const handleLogout = async () => {
    // ... (lógica de logout)
  };

  // Muestra el cargador principal solo mientras el estado de autenticación se resuelve.
  if (authLoading) {
    return (
      <MobileAppContainer className="bg-slate-900 justify-center items-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </MobileAppContainer>
    );
  }

  // Si después de cargar no hay usuario, el useEffect ya habrá iniciado la redirección.
  // Renderizar null para evitar mostrar el dashboard momentáneamente.
  if (!user) return null;

  return (
    <MobileAppContainer className="bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        {/* ... El JSX del dashboard sin cambios ... */}
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
            <PanicButton onActivate={() => handleActivateEmergency('Pánico General')} disabled={isActivating} />
            
            <div>
                 <h2 className="text-base font-bold text-center text-white mb-4">¿O es una de estas emergencias?</h2>
                 <div className="grid grid-cols-2 gap-4">
                    <EmergencyButton
                        title="Accidente Vehicular"
                        onActivate={() => handleActivateEmergency('Accidente Vehicular')}
                        className="bg-gradient-to-br from-blue-500 to-blue-700"
                        disabled={isActivating}
                    />
                    <EmergencyButton
                        title="Incendio"
                        onActivate={() => handleActivateEmergency('Incendio')}
                        className="bg-gradient-to-br from-orange-500 to-red-600"
                        disabled={isActivating}
                    />
                    <EmergencyButton
                        title="Crisis Médica"
                        onActivate={() => handleActivateEmergency('Crisis Médica')}
                        className="bg-gradient-to-br from-rose-500 to-fuchsia-600"
                        disabled={isActivating}
                    />
                    <EmergencyButton
                        title="Asistencia Ciudadana"
                        onActivate={() => handleActivateEmergency('Asistencia Ciudadana')}
                        className="bg-gradient-to-br from-teal-500 to-cyan-600"
                        disabled={isActivating}
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
        onConfirm={() => {}}
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
