
"use client";

import { useState, useEffect } from "react";
import { MobileAppContainer } from "@/components/MobileAppContainer";
import { EmergencyModal } from "@/components/dashboard/EmergencyModal";
import { MedicalInfoModal } from "@/components/dashboard/MedicalInfoModal";
import { CancelAlertModal } from "@/components/dashboard/CancelAlertModal";
import { QuickActions } from "@/components/dashboard/QuickActions";
import type { MedicalData, AlertData } from "@/lib/types";
import { getAuth, onAuthStateChanged, signOut, type User } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp, collection, GeoPoint, updateDoc } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, User as UserIcon, WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { PanicButton } from "@/components/dashboard/PanicButton";
import { EmergencyButton } from "@/components/dashboard/EmergencyButton";


/**
 * Página principal del dashboard.
 * Muestra el botón de pánico y las acciones rápidas.
 * Gestiona la visibilidad de los modales de emergencia e información médica.
 */
export default function DashboardPage() {
  const [isEmergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [isCancelModalOpen, setCancelModalOpen] = useState(false);
  const [isMedicalInfoModalOpen, setMedicalInfoModalOpen] = useState(false);
  const [medicalData, setMedicalData] = useState<MedicalData | null>(null);
  const [alertData, setAlertData] = useState<AlertData | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isActivating, setIsActivating] = useState(false);


  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);
  const { toast } = useToast();
  const router = useRouter();
  const isOnline = useOnlineStatus();

  /**
   * Efecto para observar cambios en el estado de autenticación
   * y cargar los datos médicos del usuario si está logueado.
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        // Para usuarios anónimos, no intentamos cargar datos médicos guardados
        if (!user.isAnonymous) {
            const medicalDocRef = doc(firestore, "medicalInfo", user.uid);
            getDoc(medicalDocRef).then((docSnap) => {
              if (docSnap.exists()) {
                setMedicalData(docSnap.data() as MedicalData);
              }
              setLoading(false);
            });
        } else {
            setLoading(false);
        }
      } else {
        // Si no hay usuario, redirigir al login
        setCurrentUser(null);
        setLoading(false);
        router.push('/auth');
      }
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth, firestore]);

  /**
   * Obtiene la geolocalización del usuario y maneja errores específicos.
   * @returns Una promesa que resuelve con la posición o null si falla.
   */
  const getUserLocation = (): Promise<{ latitude: number; longitude: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        toast({ title: "Error", description: "La geolocalización no es soportada por tu navegador.", variant: "destructive"});
        resolve(null);
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            let title = "Error de Ubicación";
            let description = "No se pudo obtener tu ubicación. Intenta de nuevo.";
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    title = "Permiso de ubicación denegado";
                    description = "Por favor, habilita los permisos de ubicación en los ajustes de tu navegador para poder enviar una alerta.";
                    break;
                case error.POSITION_UNAVAILABLE:
                    description = "La información de ubicación no está disponible en este momento. Intenta moverte a un lugar con mejor señal.";
                    break;
                case error.TIMEOUT:
                    description = "Se agotó el tiempo de espera para obtener la ubicación. Por favor, inténtalo de nuevo.";
                    break;
            }

            toast({ title, description, variant: "destructive"});
            resolve(null);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      }
    });
  }

  /**
   * Se ejecuta cuando el botón de pánico es activado.
   * Obtiene la ubicación, verifica la conexión y crea la alerta en Firestore.
   * @param alertType - El tipo de alerta a registrar (ej. 'Pánico', 'Incendio').
   */
  const handleActivateEmergency = async (alertType: string): Promise<boolean> => {
    if (isActivating) return false;
    setIsActivating(true);

    const user = auth.currentUser;
    if (!user) {
      toast({ title: "Error de Autenticación", description: "No se pudo verificar tu sesión.", variant: "destructive"});
      setIsActivating(false);
      return false;
    }
    
    const { id: loadingToastId, dismiss: dismissLoadingToast } = toast({ 
      description: <div className="flex items-center gap-2 text-white"><Loader2 className="animate-spin" /> Obteniendo tu ubicación...</div>,
      duration: Infinity,
    });
    
    const location = await getUserLocation();
    dismissLoadingToast();

    if (!location) {
        toast({ title: "Activación Cancelada", description: "No se pudo activar la alerta sin tu ubicación.", variant: "destructive" });
        setIsActivating(false);
        return false; // Retorna false para que el botón sepa que no se activó
    }

    if (!isOnline) {
      toast({
        title: "Estás sin conexión",
        description: (
          <div className="flex items-start gap-2">
            <WifiOff className="h-6 w-6 mt-1 text-orange-400"/>
            <p>Tu alerta se ha guardado y se enviará automáticamente cuando recuperes la conexión a internet.</p>
          </div>
        ),
        variant: "destructive",
        duration: 10000
      });
    }

    try {
      const alertDocRef = doc(collection(firestore, "alerts"));
      const newAlert: AlertData = {
        id: alertDocRef.id,
        userId: user.uid,
        timestamp: serverTimestamp(),
        location: new GeoPoint(location.latitude, location.longitude),
        status: 'new',
        type: alertType, // Guardar el tipo de alerta
        isAnonymous: user.isAnonymous,
      };

      await setDoc(alertDocRef, newAlert);
      
      setAlertData(newAlert);
      
      if (isOnline) {
        setEmergencyModalOpen(true);
      }
      setIsActivating(false);
      return true; // Éxito
    } catch (error) {
      console.error("Error creating alert:", error);
      toast({ title: "Error", description: "No se pudo crear la alerta. Inténtalo de nuevo.", variant: "destructive"});
      setIsActivating(false);
      return false; // Fallo
    }
  };

  /**
   * Muestra el modal con la información médica del usuario.
   */
  const handleShowMedicalInfo = () => {
    setMedicalInfoModalOpen(true);
  };
  
  const handleShowAlerts = () => {
    if (currentUser?.isAnonymous) {
        toast({ title: "Modo Invitado", description: "El historial de alertas solo está disponible para usuarios registrados." });
        return;
    }
    router.push('/alerts');
  };

  const handleOpenCancelModal = () => {
    setEmergencyModalOpen(false);
    setCancelModalOpen(true);
  }

  const handleCloseCancelModal = () => {
    setCancelModalOpen(false);
    setAlertData(null);
  }
  
  const handleConfirmCancellation = async (reason: string) => {
    if (!alertData) return;
    setIsCancelling(true);

    try {
      const alertRef = doc(firestore, "alerts", alertData.id);
      await updateDoc(alertRef, {
        status: 'cancelled',
        cancellationReason: reason
      });
      toast({
        title: "Alerta Cancelada",
        description: "La alerta ha sido cancelada correctamente."
      })
      handleCloseCancelModal();
    } catch(e) {
      console.error("Error cancelling alert:", e);
      toast({ title: "Error", description: "No se pudo cancelar la alerta.", variant: "destructive"})
    } finally {
      setIsCancelling(false);
    }
  }


  const handleCloseEmergencyModal = () => {
    setEmergencyModalOpen(false);
    setAlertData(null);
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Sesión cerrada", description: "Has cerrado sesión correctamente." });
      router.push('/auth');
    } catch (error) {
      toast({ title: "Error", description: "No se pudo cerrar la sesión.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
        <MobileAppContainer className="bg-slate-900 justify-center items-center">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
        </MobileAppContainer>
    )
  }
  
  const isAnonymousUser = currentUser?.isAnonymous ?? false;

  return (
    <MobileAppContainer className="bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="flex flex-col h-full">
        <header className="relative bg-gradient-to-r from-red-600 to-red-800 text-white px-6 py-6 text-center shadow-lg flex-shrink-0">
          <h1 className="text-2xl font-bold mb-1">EmergenciaGT</h1>
          <p className="text-red-100 text-sm">
             {isAnonymousUser ? "Modo de Emergencia (Invitado)" : "Mantén presionado para activar"}
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
            {isAnonymousUser && (
                 <div className="absolute top-4 left-4 flex items-center bg-yellow-500/20 text-yellow-300 text-xs font-bold px-2 py-1 rounded-full">
                    <UserIcon className="w-4 h-4 mr-1.5"/>
                    Invitado
                </div>
            )}
        </header>

        <main className="flex-1 flex flex-col justify-center p-6 space-y-8">
            <PanicButton onActivate={() => handleActivateEmergency('Pánico')} />
            
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
          isAnonymous={isAnonymousUser}
        />
      </div>

      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={handleCloseEmergencyModal}
        onCancel={handleOpenCancelModal}
      />

      <CancelAlertModal
        isOpen={isCancelModalOpen}
        onClose={handleCloseCancelModal}
        onConfirm={handleConfirmCancellation}
        isCancelling={isCancelling}
      />

      <MedicalInfoModal
        isOpen={isMedicalInfoModalOpen}
        onClose={() => setMedicalInfoModalOpen(false)}
        medicalData={medicalData}
        isAnonymous={isAnonymousUser}
      />
    </MobileAppContainer>
  );
}
