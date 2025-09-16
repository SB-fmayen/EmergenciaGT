

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MobileAppContainer } from "@/components/MobileAppContainer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Clock, MapPin, CheckCircle, AlertTriangle, ShieldX, UserCheck, Truck, Siren, Hospital, HardHat, FileClock, WifiOff } from "lucide-react";
import { getFirestore, collection, query, where, getDocs, orderBy, Timestamp, doc, updateDoc } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebase";
import type { AlertData, AlertStatus } from "@/lib/types";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CancelAlertModal } from "@/components/dashboard/CancelAlertModal";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/app/(mobile)/layout";

/**
 * Página que muestra el historial de alertas.
 * Para usuarios normales, muestra las alertas que han creado.
 * Para usuarios con rol 'unit', muestra las alertas que han atendido.
 */
export default function AlertsPage() {
  const router = useRouter();
  const { user, userRole, unitId, loading: authLoading } = useAuth();
  const firestore = getFirestore(firebaseApp);
  const { toast } = useToast();

  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCancelModalOpen, setCancelModalOpen] = useState(false);
  const [alertToCancel, setAlertToCancel] = useState<AlertData | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchAlerts = useCallback(async () => {
    if (!user) {
        setLoading(false);
        setError("No se pudo verificar la sesión de usuario para cargar el historial.");
        return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const alertsRef = collection(firestore, "alerts");
      let q;

      // La consulta correcta que requiere un índice compuesto.
      if (userRole === 'unit' && unitId) {
        q = query(alertsRef, where("assignedUnitId", "==", unitId), orderBy("timestamp", "desc"));
      } else {
        q = query(alertsRef, where("userId", "==", user.uid), orderBy("timestamp", "desc"));
      }
      
      const querySnapshot = await getDocs(q);
      const userAlerts = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        return {
          id: doc.id,
          ...data,
        } as AlertData;
      });
      
      setAlerts(userAlerts);
    } catch (e: any) {
      console.error("Error fetching alerts:", e);
      let errorMessage = "No se pudieron cargar las alertas. Por favor, inténtalo de nuevo.";
      
      // Captura y muestra el error específico de índice de Firestore.
      if (e.code === 'failed-precondition') {
          errorMessage = "La base de datos requiere un índice compuesto que no existe. Por favor, crea un índice en Firestore para la colección 'alerts' con los campos: 'userId' (Ascendente) y 'timestamp' (Descendente).";
          console.error("Firestore Index Error:", e.message);
      } else if (e.code === 'permission-denied') {
          errorMessage = "No tienes permisos para ver esta información. Revisa las reglas de seguridad de Firestore.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, userRole, unitId, firestore]);

  useEffect(() => {
    // Sincroniza la carga de datos para que ocurra solo después de que la autenticación esté lista.
    if (!authLoading && user) {
        fetchAlerts();
    } else if (!authLoading && !user) {
        setLoading(false);
        router.replace('/auth');
    }
  }, [authLoading, user, fetchAlerts, router]);
  

  const handleOpenCancelModal = (alert: AlertData) => {
    setAlertToCancel(alert);
    setCancelModalOpen(true);
  }

  const handleCloseCancelModal = () => {
    setCancelModalOpen(false);
    setAlertToCancel(null);
  }
  
  const handleConfirmCancellation = async (reason: string) => {
    if (!alertToCancel) return;
    setIsCancelling(true);

    try {
      const alertRef = doc(firestore, "alerts", alertToCancel.id);
      await updateDoc(alertRef, {
        status: 'cancelled',
        cancellationReason: reason
      });
      toast({
        title: "Alerta Cancelada",
        description: "La alerta ha sido cancelada correctamente."
      });
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => 
            alert.id === alertToCancel.id ? { ...alert, status: 'cancelled' } : alert
        )
      );
      handleCloseCancelModal();
    } catch(e) {
      console.error("Error cancelling alert:", e);
      toast({ title: "Error", description: "No se pudo cancelar la alerta.", variant: "destructive"})
    } finally {
      setIsCancelling(false);
    }
  }

  const getStatusInfo = (status: AlertStatus): { text: string; icon: React.ElementType; color: string } => {
    switch (status) {
      case 'new': return { text: 'Recibida', icon: AlertTriangle, color: 'text-yellow-400' };
      case 'assigned': return { text: 'Unidad Asignada', icon: HardHat, color: 'text-blue-400' };
      case 'en_route': return { text: 'En Camino', icon: Truck, color: 'text-cyan-400' };
      case 'on_scene': return { text: 'En el Lugar', icon: Siren, color: 'text-orange-400' };
      case 'attending': return { text: 'Atendiendo', icon: Hospital, color: 'text-fuchsia-400' };
      case 'transporting': return { text: 'Trasladando', icon: Ambulance, color: 'text-purple-400' };
      case 'patient_attended': return { text: 'Atendido en Lugar', icon: UserCheck, color: 'text-teal-400' };
      case 'resolved': return { text: 'Finalizada en Hospital', icon: CheckCircle, color: 'text-green-400' };
      case 'cancelled': return { text: 'Cancelada', icon: ShieldX, color: 'text-gray-400' };
      default: return { text: 'Desconocido', icon: AlertTriangle, color: 'text-gray-400' };
    }
  };

  const AlertCard = ({ alert }: { alert: AlertData }) => {
    const alertDate = alert.timestamp instanceof Timestamp ? alert.timestamp.toDate() : new Date();
    const { text, icon: Icon, color } = getStatusInfo(alert.status);

    return (
      <div className="bg-slate-800/50 rounded-2xl p-4 shadow-lg flex flex-col space-y-3 animate-fade-in">
        <div className="flex justify-between items-center">
          <span className={`flex items-center text-sm font-bold ${color}`}>
            <Icon className="w-4 h-4 mr-2" />
            {text}
          </span>
          <span className="text-xs text-gray-400">ID: {alert.id.substring(0, 6)}...</span>
        </div>
        <div className="text-sm text-gray-300 space-y-2">
            <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-slate-500" />
                <span>{format(alertDate, "eeee, dd 'de' MMMM 'de' yyyy", { locale: es })}</span>
            </div>
            <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-slate-500" />
                <span>{format(alertDate, "hh:mm a", { locale: es })}</span>
            </div>
             <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-slate-500" />
                <a 
                    href={`https://www.google.com/maps?q=${alert.location.latitude},${alert.location.longitude}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                >
                    Ver en mapa
                </a>
            </div>
        </div>
        {userRole !== 'unit' && (alert.status === 'new' || alert.status === 'assigned') && (
             <Button 
                variant="destructive" 
                size="sm" 
                className="mt-2 bg-red-800/80 hover:bg-red-700/80 text-red-200 border-red-500/50 border"
                onClick={() => handleOpenCancelModal(alert)}
            >
                <ShieldX className="w-4 h-4 mr-2" />
                Cancelar Solicitud
            </Button>
        )}
      </div>
    );
  };

  const getHeaderText = () => {
      if (userRole === 'unit') {
          return { title: "Historial de Misiones", subtitle: "Tus servicios atendidos" };
      }
      return { title: "Historial de Alertas", subtitle: "Tus emergencias registradas" };
  }

  const renderContent = () => {
    if (authLoading || loading) {
      return (
        <div className="text-center py-10">
          <Loader2 className="w-8 h-8 mx-auto text-white animate-spin" />
          <p className="text-white mt-4">Cargando historial...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-10 text-red-400 bg-red-900/50 rounded-lg p-4">
          <WifiOff className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <p className="font-bold">Error al Cargar</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      );
    }

    if (alerts.length > 0) {
      return alerts.map(alert => <AlertCard key={alert.id} alert={alert} />);
    }

    return (
      <div className="text-center py-10 text-slate-400">
        <FileClock className="w-12 h-12 mx-auto text-slate-500 mb-4" />
        <p>No tienes alertas en tu historial.</p>
      </div>
    );
  };

  return (
    <MobileAppContainer className="bg-slate-900">
      <div className="flex flex-col h-full">
        <header className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-6 py-6 flex items-center shadow-lg flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="mr-4 hover:bg-white/10"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{getHeaderText().title}</h1>
            <p className="text-yellow-100 text-sm">{getHeaderText().subtitle}</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {renderContent()}
        </div>
      </div>
      {userRole !== 'unit' && (
        <CancelAlertModal
          isOpen={isCancelModalOpen}
          onClose={handleCloseCancelModal}
          onConfirm={handleConfirmCancellation}
          isCancelling={isCancelling}
        />
      )}
    </MobileAppContainer>
  );
}
