
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth, firestore } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { LogOut, RefreshCw, Bell, Zap, CheckCircle, Clock, MapPin, Building, Loader2 } from "lucide-react";
import dynamic from 'next/dynamic';
import { collection, onSnapshot, query, getDoc, doc, where, orderBy } from "firebase/firestore";
import type { AlertData, MedicalData } from "@/lib/types";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertDetailModal } from "@/components/admin/AlertDetailModal";

const AlertsMap = dynamic(() => import('@/components/admin/AlertsMap'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-800 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div>
});

export interface EnrichedAlert extends AlertData {
    userInfo?: MedicalData;
    eta?: string;
    stationInfo?: { name: string };
    statusClass?: string;
    severityClass?: string;
    severity?: string;
}


export default function AdminDashboardPage() {
    const router = useRouter();
    const { toast } = useToast();

    const [alerts, setAlerts] = useState<EnrichedAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAlert, setSelectedAlert] = useState<EnrichedAlert | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("new");

    useEffect(() => {
        setLoading(true);
        const alertsRef = collection(firestore, "alerts");
        const q = query(alertsRef, orderBy("timestamp", "desc"));

        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            const alertsData: AlertData[] = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate(),
            })) as AlertData[];

            const enrichedAlerts = await Promise.all(
                alertsData.map(async (alert) => {
                    let userInfo: MedicalData | undefined = undefined;
                    if (alert.userId && !alert.isAnonymous) {
                         const userDocRef = doc(firestore, "medicalInfo", alert.userId);
                         const userDocSnap = await getDoc(userDocRef);
                         if (userDocSnap.exists()) {
                             userInfo = userDocSnap.data() as MedicalData;
                         }
                    }
                    
                    const severity = 'Crítica'; // Simulado por ahora
                    return {
                        ...alert,
                        userInfo,
                        stationInfo: { name: "Estación Central" }, // Simulado
                        statusClass: `status-${alert.status}`,
                        severityClass: `severity-critical`, // Forzado a critico para que se vea
                        severity,
                    };
                })
            );
            
            setAlerts(enrichedAlerts);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching alerts:", error);
            toast({ title: "Error de Conexión", description: "No se pudieron cargar las alertas en tiempo real.", variant: "destructive" });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [toast]);

    const handleAlertClick = (alert: EnrichedAlert) => {
        setSelectedAlert(alert);
        setIsModalOpen(true);
    };
    
    const handleMapCentering = (alert: EnrichedAlert) => {
        setSelectedAlert(alert);
        setIsModalOpen(false); // Cierra el modal si estuviera abierto
    }


    const handleCloseModal = () => {
        setIsModalOpen(false);
        // Dejamos selectedAlert como está para que el mapa pueda seguir centrado si es necesario
    }


    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast({ title: "Sesión cerrada" });
            router.push('/login');
        } catch (error) {
            toast({ title: "Error al cerrar sesión", variant: "destructive" });
        }
    };

    const filteredAlerts = useMemo(() => {
        return alerts.filter(alert => {
            const matchesStatus = statusFilter === "all" || alert.status === statusFilter;
            const matchesSearch = searchTerm === "" || 
                                  alert.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  (alert.userInfo?.fullName && alert.userInfo.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
            return matchesStatus && matchesSearch;
        });
    }, [alerts, statusFilter, searchTerm]);

    const kpis = useMemo(() => {
        return {
            active: alerts.filter(a => a.status === 'new').length,
            inProgress: alerts.filter(a => a.status === 'dispatched').length,
            resolved: alerts.filter(a => a.status === 'resolved').length,
        }
    }, [alerts]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'new': return 'bg-red-500/20 text-red-300';
            case 'dispatched': return 'bg-yellow-500/20 text-yellow-300';
            case 'resolved': return 'bg-green-500/20 text-green-300';
            case 'cancelled': return 'bg-gray-500/20 text-gray-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'new': return 'Activa';
            case 'dispatched': return 'En Curso';
            case 'resolved': return 'Finalizada';
            case 'cancelled': return 'Cancelada';
            default: return status;
        }
    };

  return (
    <>
    <div className="flex flex-col min-h-screen bg-slate-900 text-gray-200">
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-xl">🚨</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Consola de Emergencias - EmergenciaGT</h1>
                </div>
                <div className="flex items-center space-x-4">
                     <div className="text-right">
                        <div className="font-semibold text-white">María González</div>
                        <div className="text-sm text-red-400">Administrador</div>
                    </div>
                     <Button onClick={handleLogout} variant="destructive" size="sm">
                        <LogOut className="mr-2 h-4 w-4"/>
                        Cerrar Sesión
                    </Button>
                </div>
            </div>
        </div>
      </header>
      
      <main className="flex-1 p-6 container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Alertas Activas</CardTitle>
                    <Bell className="h-5 w-5 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-red-500">{kpis.active}</div>
                </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">En Curso</CardTitle>
                    <Zap className="h-5 w-5 text-yellow-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-yellow-500">{kpis.inProgress}</div>
                </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Finalizadas</CardTitle>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-green-500">{kpis.resolved}</div>
                </CardContent>
            </Card>
             <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Tiempo Promedio</CardTitle>
                    <Clock className="h-5 w-5 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-blue-500">-- min</div>
                </CardContent>
            </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 flex flex-col">
                <div className="p-6 border-b border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white">Alertas de Emergencia</h2>
                        <Button variant="outline">
                            <RefreshCw className="mr-2 h-4 w-4"/>
                            Actualizar
                        </Button>
                    </div>
                     <div className="flex space-x-4">
                        <Input 
                            type="text" 
                            placeholder="Buscar por ID o nombre..." 
                            className="flex-1"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filtrar por estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los estados</SelectItem>
                                <SelectItem value="new">Activas</SelectItem>
                                <SelectItem value="dispatched">En Curso</SelectItem>
                                <SelectItem value="resolved">Finalizadas</SelectItem>
                                <SelectItem value="cancelled">Canceladas</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                    {loading ? (
                         <div className="flex justify-center items-center h-40">
                             <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                         </div>
                    ) : filteredAlerts.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            <p>No hay alertas que coincidan con los filtros.</p>
                        </div>
                    ) : (
                        filteredAlerts.map((alert) => (
                            <div key={alert.id} 
                                 className={`p-4 border-b border-slate-700 hover:bg-slate-700/50 transition-colors cursor-pointer ${alert.severityClass}`}
                                 onClick={() => handleAlertClick(alert)}
                            >
                                 <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-white font-mono">{alert.id.substring(0, 8)}...</span>
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(alert.status)}`}>{getStatusText(alert.status)}</span>
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full bg-orange-500/20 text-orange-300`}>{alert.severity}</span>
                                    </div>
                                    <span className="text-sm text-gray-400">{alert.timestamp ? formatDistanceToNow(alert.timestamp, { addSuffix: true, locale: es }) : 'hace un momento'}</span>
                                </div>
                                <div className="mb-3">
                                    <p className="font-medium text-gray-100">{alert.isAnonymous ? "Usuario Anónimo" : alert.userInfo?.fullName || "Usuario Registrado"}</p>
                                    <p className="text-sm text-gray-400">Incidente reportado, pendiente de asignación</p>
                                </div>
                                 <div className="flex items-center justify-between text-sm">
                                    <div className="text-gray-400 flex items-center gap-2">
                                        <MapPin className="h-4 w-4"/>
                                        <span>{alert.location.latitude.toFixed(4)}, {alert.location.longitude.toFixed(4)}</span>
                                    </div>
                                    <div className="text-gray-300 flex items-center gap-2">
                                         <Building className="h-4 w-4"/>
                                        <span>{alert.stationInfo?.name || "Pendiente"}</span>
                                    </div>
                                    <Button variant="link" className="p-0 h-auto text-blue-400 hover:text-blue-300">Ver Detalle</Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

             <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 flex flex-col">
                 <div className="p-6 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-white">Mapa de Incidentes</h2>
                    <p className="text-gray-400 text-sm">Guatemala - Tiempo Real</p>
                </div>
                <div className="flex-1 p-4 bg-slate-800/50 rounded-b-lg">
                    <div className="w-full h-[70vh] rounded-lg overflow-hidden">
                        <AlertsMap alerts={filteredAlerts} selectedAlert={selectedAlert} />
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
     {selectedAlert && (
        <AlertDetailModal 
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            alert={selectedAlert}
            onCenterMap={handleMapCentering}
        />
     )}
    </>
  );
}
