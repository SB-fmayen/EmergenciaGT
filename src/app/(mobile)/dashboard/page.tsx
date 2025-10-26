
"use client";

import { useState, useEffect, useRef } from "react";
import { MobileAppContainer } from "@/components/MobileAppContainer";
import { EmergencyModal } from "@/components/dashboard/EmergencyModal";
import { MedicalInfoModal } from "@/components/dashboard/MedicalInfoModal";
import { CancelAlertModal } from "@/components/dashboard/CancelAlertModal";
import { QuickActions } from "@/components/dashboard/QuickActions";
import type { MedicalData, AlertData, StationData } from "@/lib/types";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp, collection, GeoPoint, updateDoc, getDocs } from "firebase/firestore";
import { firebaseApp, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, User as UserIcon, WifiOff, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { PanicButton } from "@/components/dashboard/PanicButton";
import { EmergencyButton } from "@/components/dashboard/EmergencyButton";
import { useAuth } from "@/app/layout";
import { signOut } from "firebase/auth";
import { MobileTour } from "@/components/dashboard/MobileTour";

// Haversine formula to calculate distance between two points
function getDistance(from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }) {
  const R = 6371; // Earth radius in km
  const dLat = (to.latitude - from.latitude) * Math.PI / 180;
  const dLon = (to.longitude - from.longitude) * Math.PI / 180;
  const a =
    0.5 -
    Math.cos(dLat) / 2 +
    (Math.cos(from.latitude * Math.PI / 180) * Math.cos(to.latitude * Math.PI / 180) * (1 - Math.cos(dLon))) / 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

export default function DashboardPage() {
  const [isEmergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [isCancelModalOpen, setCancelModalOpen] = useState(false);
  const [isMedicalInfoModalOpen, setMedicalInfoModalOpen] = useState(false);
  const [medicalData, setMedicalData] = useState<MedicalData | null>(null);
  const [alertData, setAlertData] = useState<AlertData | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const { user, loading: authLoading } = useAuth();
  const firestore = getFirestore(firebaseApp);
  const { toast } = useToast();
  const router = useRouter();
  const isOnline = useOnlineStatus();
  const mobileTourRef = useRef<{ startTour: () => void }>(null);

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
    setStatusMessage("Activando GPS...");

    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            toast({ title: "Error", description: "Tu navegador no soporta la geolocalización.", variant: "destructive" });
            return resolve(null);
        }

        const searchTimeout = 20000; // 20-second total search time.
        const requiredAccuracy = 50; // We need 50 meters or better.

        let watchId: number;

        const timeoutTimer = setTimeout(() => {
            navigator.geolocation.clearWatch(watchId);
            toast({
                title: "No se pudo obtener una ubicación precisa",
                description: "La señal del GPS es demasiado débil. Intente moverse a un lugar con cielo más despejado.",
                variant: "destructive",
            });
            resolve(null);
        }, searchTimeout);

        watchId = navigator.geolocation.watchPosition(
            (position) => {
                const accuracy = position.coords.accuracy;
                setStatusMessage(`Calibrando... Precisión actual: ${Math.round(accuracy)} metros.`);

                if (accuracy <= requiredAccuracy) {
                    clearTimeout(timeoutTimer);
                    navigator.geolocation.clearWatch(watchId);
                    setStatusMessage("Ubicación precisa encontrada.");
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                }
            },
            (error) => {
                clearTimeout(timeoutTimer);
                navigator.geolocation.clearWatch(watchId);

                let errorMessage = "Error al obtener la ubicación. ";
                if (error.code === error.PERMISSION_DENIED) {
                    errorMessage += "Asegúrate de haber concedido los permisos de ubicación precisa.";
                }
                
                toast({ title: "Error de Ubicación", description: errorMessage, variant: "destructive" });
                resolve(null);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 0, // Always get a fresh position.
            }
        );
    });
  };

  const findAndAssignNearestStation = async (alertLocation: { latitude: number; longitude: number; }): Promise<{ stationId: string; stationName: string; } | null> => {
      setStatusMessage("Asignando estación...");
      try {
          const stationsRef = collection(firestore, "stations");
          const stationsSnapshot = await getDocs(stationsRef);
          
          if (stationsSnapshot.empty) {
              toast({ title: "Sin estaciones", description: "No hay estaciones registradas para asignar la alerta.", variant: "destructive" });
              return null;
          }

          const stationsData = stationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StationData));

          let nearestStation: StationData | null = null;
          let minDistance = Infinity;

          for (const station of stationsData) {
              const distance = getDistance(alertLocation, station.location);
              if (distance < minDistance) {
                  minDistance = distance;
                  nearestStation = station;
              }
          }
          
          if (nearestStation) {
              setStatusMessage(`Estación más cercana: ${nearestStation.name}`);
              return { stationId: nearestStation.id, stationName: nearestStation.name };
          }

          return null;
      } catch (error) {
          console.error("Error finding nearest station:", error);
          toast({ title: "Error de asignación", description: "No se pudo encontrar la estación más cercana.", variant: "destructive" });
          return null;
      }
  };

  const handleActivateEmergency = async (alertType: string): Promise<boolean> => {
    if (isActivating || !user) {
      return false;
    }
    
    setIsActivating(true);

    const location = await getUserLocation();
    if (!location) {
      setIsActivating(false);
      setStatusMessage("");
      return false;
    }
    
    const nearestStation = await findAndAssignNearestStation(location);

    setStatusMessage("Enviando alerta...");

    try {
      const alertDocRef = doc(collection(firestore, "alerts"));
      
      const newAlert: AlertData = {
        id: alertDocRef.id,
        userId: user.uid,
        timestamp: serverTimestamp(),
        location: new GeoPoint(location.latitude, location.longitude),
        status: nearestStation ? 'assigned' : 'new',
        type: alertType,
        isAnonymous: user.isAnonymous,
        assignedStationId: nearestStation?.stationId || undefined,
        assignedStationName: nearestStation?.stationName || undefined,
      };

      await setDoc(alertDocRef, newAlert);
      setAlertData(newAlert);
      setEmergencyModalOpen(true);
      return true;
    } catch (error) {
      console.error("Error creating alert:", error);
      toast({ title: "Error", description: "No se pudo crear la alerta. Inténtalo de nuevo.", variant: "destructive"});
      return false;
    } finally {
      setIsActivating(false);
      setStatusMessage("");
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
    <>
      <MobileTour ref={mobileTourRef} />
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
             <div className="absolute top-4 right-4 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => mobileTourRef.current?.startTour()}
                  className="hover:bg-white/10"
                  aria-label="Ver recorrido"
                >
                  <HelpCircle className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="hover:bg-white/10"
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
             </div>
              {user.isAnonymous && (
                   <div className="absolute top-4 left-4 flex items-center bg-yellow-500/20 text-yellow-300 text-xs font-bold px-2 py-1 rounded-full">
                      <UserIcon className="w-4 h-4 mr-1.5"/>
                      Invitado
                  </div>
              )}
          </header>

          <main className="flex-1 flex flex-col justify-center p-6 space-y-8">
              <div id="panic-button-section">
                <PanicButton onActivate={() => handleActivateEmergency('Pánico General')} disabled={isActivating || !isOnline} />
              </div>
              
              <div id="specific-emergencies-section">
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
                          <span>{statusMessage || 'Procesando...'}</span>
                      </div>
                   )}
              </div>
          </main>

          <div id="quick-actions-section">
            <QuickActions 
              onShowMedicalInfo={handleShowMedicalInfo} 
              onShowAlerts={handleShowAlerts} 
              isAnonymous={user.isAnonymous}
            />
          </div>
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
              console.log("Attempting to cancel alert:", alertData?.id, "with user UID:", user?.uid, "Alert userId:", alertData?.userId);
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
    </>
  );
}
