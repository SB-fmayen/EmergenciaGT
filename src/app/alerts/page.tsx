
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MobileAppContainer } from "@/components/MobileAppContainer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Clock, MapPin, CheckCircle, AlertTriangle, Send, ShieldX } from "lucide-react";
import { getAuth, onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, orderBy, Timestamp, doc, updateDoc } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebase";
import type { AlertData, AlertStatus } from "@/lib/types";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CancelAlertModal } from "@/components/dashboard/CancelAlertModal";
import { useToast } from "@/hooks/use-toast";

/**
 * Página que muestra el historial de alertas de un usuario.
 */
export default function AlertsPage() {
  const router = useRouter();
  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);
  const { toast } = useToast();

  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCancelModalOpen, setCancelModalOpen] = useState(false);
  const [alertToCancel, setAlertToCancel] = useState<AlertData | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchAlerts(user.uid);
      } else {
        router.push("/auth");
      }
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth]);

  /**
   * Obtiene las alertas del usuario desde Firestore.
   * @param uid - El ID del usuario.
   */
  const fetchAlerts = async (uid: string) => {
    setLoading(true);
    setError(null);
    try {
      const alertsRef = collection(firestore, "alerts");
      const q = query(alertsRef, where("userId", "==", uid), orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      const userAlerts = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const timestamp = data.timestamp;
        
        // El timestamp de firestore es un objeto, lo convertimos a Date de JS de forma segura
        const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date();

        return {
          id: doc.id,
          ...data,
          timestamp: date,
        } as AlertData;
      });
      
      setAlerts(userAlerts);
    } catch (e: any) {
      console.error("Error fetching alerts:", e);
      // El error de índice de Firestore se mostrará aquí si no se ha creado
      if (e.code === 'failed-precondition') {
          setError("La base de datos requiere un índice para esta consulta. Por favor, créalo en la consola de Firebase.");
      } else {
          setError("No se pudieron cargar las alertas.");
      }
    } finally {
      setLoading(false);
    }
  };

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
      // Actualizar el estado local para reflejar el cambio inmediatamente
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
      case 'new':
        return { text: 'Nueva', icon: AlertTriangle, color: 'text-yellow-400' };
      case 'dispatched':
        return { text: 'En Camino', icon: Send, color: 'text-blue-400' };
      case 'resolved':
        return { text: 'Resuelta', icon: CheckCircle, color: 'text-green-400' };
      case 'cancelled':
        return { text: 'Cancelada', icon: AlertTriangle, color: 'text-gray-400' };
      default:
        return { text: 'Desconocido', icon: AlertTriangle, color: 'text-gray-400' };
    }
  };

  const AlertCard = ({ alert }: { alert: AlertData }) => {
    const { text, icon: Icon, color } = getStatusInfo(alert.status);
    const alertDate = alert.timestamp as Date;

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
        {alert.status === 'new' && (
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
            <h1 className="text-xl font-bold">Historial de Alertas</h1>
            <p className="text-yellow-100 text-sm">Tus emergencias registradas</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {loading ? (
            <div className="text-center py-10">
              <Loader2 className="w-8 h-8 mx-auto text-white animate-spin" />
              <p className="text-white mt-4">Cargando alertas...</p>
            </div>
          ) : error ? (
             <div className="text-center py-10 text-red-400 bg-red-900/50 rounded-lg">
              <p className="font-bold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : alerts.length > 0 ? (
            alerts.map(alert => <AlertCard key={alert.id} alert={alert} />)
          ) : (
            <div className="text-center py-10 text-slate-400">
              <p>No has generado ninguna alerta todavía.</p>
            </div>
          )}
        </div>
      </div>
       <CancelAlertModal
        isOpen={isCancelModalOpen}
        onClose={handleCloseCancelModal}
        onConfirm={handleConfirmCancellation}
        isCancelling={isCancelling}
      />
    </MobileAppContainer>
  );
}
