
"use client";

import { useState, useEffect } from "react";
import { MobileAppContainer } from "@/components/MobileAppContainer";
import { PanicButton } from "@/components/dashboard/PanicButton";
import { EmergencyModal } from "@/components/dashboard/EmergencyModal";
import { MedicalInfoModal } from "@/components/dashboard/MedicalInfoModal";
import { QuickActions } from "@/components/dashboard/QuickActions";
import type { MedicalData, AlertData } from "@/lib/types";
import { getAuth, onAuthStateChanged, signOut, type User } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp, collection, GeoPoint } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";


/**
 * Página principal del dashboard.
 * Muestra el botón de pánico y las acciones rápidas.
 * Gestiona la visibilidad de los modales de emergencia e información médica.
 */
export default function DashboardPage() {
  const [isEmergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [isMedicalInfoModalOpen, setMedicalInfoModalOpen] = useState(false);
  const [medicalData, setMedicalData] = useState<MedicalData | null>(null);
  const [alertData, setAlertData] = useState<AlertData | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);
  const { toast } = useToast();
  const router = useRouter();

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
        router.push('/');
      }
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth, firestore]);

  /**
   * Obtiene la geolocalización del usuario.
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
          () => {
            toast({ title: "Error de Ubicación", description: "No se pudo obtener tu ubicación. Activa los permisos.", variant: "destructive"});
            resolve(null);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      }
    });
  }

  /**
   * Se ejecuta cuando el botón de pánico es activado.
   * Obtiene la ubicación del usuario, crea una nueva alerta en Firestore
   * y muestra el modal de confirmación de emergencia.
   */
  const handleActivateEmergency = async () => {
    if (!currentUser) {
      toast({ title: "Error", description: "Debes iniciar sesión para activar una alerta.", variant: "destructive"});
      return;
    }
    
    // Muestra un toast mientras se obtiene la ubicación
    const { id, dismiss } = toast({ 
      description: (
        <div className="flex items-center gap-2 text-white">
          <Loader2 className="animate-spin" />
          <span>Activando Alerta: Obteniendo tu ubicación...</span>
        </div>
      ),
      duration: Infinity,
    });
    
    const location = await getUserLocation();
    dismiss(id);

    if (!location) {
        toast({ title: "Activación Cancelada", description: "No se pudo activar la alerta sin tu ubicación.", variant: "destructive" });
        return;
    }

    try {
      // Crea un ID de documento único para la nueva alerta
      const alertDocRef = doc(collection(firestore, "alerts"));

      const newAlert: AlertData = {
        id: alertDocRef.id,
        userId: currentUser.uid,
        timestamp: serverTimestamp(),
        location: new GeoPoint(location.latitude, location.longitude),
        status: 'new',
        isAnonymous: currentUser.isAnonymous,
      };

      await setDoc(alertDocRef, newAlert);
      
      setAlertData(newAlert);
      setEmergencyModalOpen(true);

    } catch (error) {
      console.error("Error creating alert:", error);
      toast({ title: "Error", description: "No se pudo crear la alerta. Inténtalo de nuevo.", variant: "destructive"});
    }
  };

  /**
   * Muestra el modal con la información médica del usuario.
   */
  const handleShowMedicalInfo = () => {
    setMedicalInfoModalOpen(true);
  };
  
  const handleShowAlerts = () => {
    // Los usuarios anónimos no tienen historial persistente
    if (currentUser?.isAnonymous) {
        toast({ title: "Modo Invitado", description: "El historial de alertas solo está disponible para usuarios registrados." });
        return;
    }
    router.push('/alerts');
  };

  const handleCloseEmergencyModal = () => {
    setEmergencyModalOpen(false);
    setAlertData(null);
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Sesión cerrada", description: "Has cerrado sesión correctamente." });
      router.push('/');
    } catch (error) {
      toast({ title: "Error", description: "No se pudo cerrar la sesión.", variant: "destructive" });
    }
  };


  // Muestra un loader mientras se cargan los datos
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
             {isAnonymousUser ? "Modo de Emergencia (Invitado)" : "Sistema de Alerta Inmediata"}
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

        <div className="flex-1 flex items-center justify-center px-6">
          <PanicButton onActivate={handleActivateEmergency} />
        </div>

        <QuickActions 
          onShowMedicalInfo={handleShowMedicalInfo} 
          onShowAlerts={handleShowAlerts} 
          isAnonymous={isAnonymousUser}
        />
      </div>

      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={handleCloseEmergencyModal}
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
