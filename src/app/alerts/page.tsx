
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MobileAppContainer } from "@/components/MobileAppContainer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Clock, MapPin, CheckCircle, AlertTriangle, Send } from "lucide-react";
import { getAuth, onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebase";
import type { AlertData, AlertStatus } from "@/lib/types";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Página que muestra el historial de alertas de un usuario.
 */
export default function AlertsPage() {
  const router = useRouter();
  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);

  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchAlerts(user.uid);
      } else {
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, [auth, router]);

  /**
   * Obtiene las alertas del usuario desde Firestore.
   * @param uid - El ID del usuario.
   */
  const fetchAlerts = async (uid: string) => {
    setLoading(true);
    try {
      const alertsRef = collection(firestore, "alerts");
      const q = query(alertsRef, where("userId", "==", uid), orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      const userAlerts = querySnapshot.docs.map(doc => doc.data() as AlertData);
      setAlerts(userAlerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

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
    const alertDate = alert.timestamp.toDate();

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
          ) : alerts.length > 0 ? (
            alerts.map(alert => <AlertCard key={alert.id} alert={alert} />)
          ) : (
            <div className="text-center py-10 text-slate-400">
              <p>No has generado ninguna alerta todavía.</p>
            </div>
          )}
        </div>
      </div>
    </MobileAppContainer>
  );
}
