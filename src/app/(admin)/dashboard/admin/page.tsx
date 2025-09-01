
"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth, firestore } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { LogOut, RefreshCw, Bell, Zap, CheckCircle, Clock, MapPin, Building, Loader2, HardHat, Users, LayoutDashboard, Truck, Siren, Check } from "lucide-react";
import dynamic from 'next/dynamic';
import { collection, onSnapshot, query, where, getDoc, doc, orderBy, Query, Timestamp, getDocs } from "firebase/firestore";
import type { AlertData, MedicalData, StationData } from "@/lib/types";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertDetailModal } from "@/components/admin/AlertDetailModal";
import Link from 'next/link';
import { SettingsDropdown } from '@/components/admin/SettingsDropdown';
import { useAuth } from "@/app/(admin)/layout";

const AlertsMap = dynamic(() => import('@/components/admin/AlertsMap'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
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
    const { user, userRole, stationId } = useAuth();
    
    const [theme, setTheme] = useState("dark");
    const [alerts, setAlerts] = useState<EnrichedAlert[]>([]);
    const [stations, setStations] = useState<StationData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAlert, setSelectedAlert] = useState<EnrichedAlert | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const initialLoadDone = useRef(false);
    const unsubscribeFromAlerts = useRef<() => void>();

    const processAlerts = useCallback(async (alertsData: AlertData[]) => {
      try {
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
                
                const severity = 'Crítica';
                return {
                    ...alert,
                    userInfo,
                    stationInfo: alert.assignedStationName ? { name: alert.assignedStationName } : undefined,
                    statusClass: `status-${alert.status}`,
                    severityClass: `severity-critical`,
                    severity,
                };
            })
        );
        // Ordenar en el cliente para todos los roles
        enrichedAlerts.sort((a, b) => (b.timestamp as Timestamp).toMillis() - (a.timestamp as Timestamp).toMillis());
        setAlerts(enrichedAlerts);

      } catch (processingError) {
          console.error("Error processing snapshot data:", processingError);
          toast({ title: "Error de Datos", description: "No se pudieron procesar los datos de las alertas.", variant: "destructive" });
      } finally {
          setLoading(false);
          initialLoadDone.current = true;
      }
    }, [toast]);

    const fetchAlerts = useCallback(async () => {
         if (!userRole) return;
         setLoading(true);

         if (unsubscribeFromAlerts.current) {
            unsubscribeFromAlerts.current();
         }

        const alertsRef = collection(firestore, "alerts");
        let q: Query;
        
        if (userRole === 'admin') {
            q = query(alertsRef, orderBy("timestamp", "desc"));
        } else if (userRole === 'operator') {
             if (!stationId) {
                setAlerts([]);
                setLoading(false);
                return;
            }
            q = query(alertsRef, where("assignedStationId", "==", stationId));
        } else {
            setLoading(false);
            return;
        }

        unsubscribeFromAlerts.current = onSnapshot(q, async (querySnapshot) => {
            const alertsData: AlertData[] = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp,
            })) as AlertData[];
            
            if (initialLoadDone.current) {
                const newAlerts = alertsData.filter(a => a.status === 'new' && !alerts.some(old => old.id === a.id));
                if (newAlerts.length > 0) {
                   toast({ title: "¡Nueva Alerta!", description: `${newAlerts.length} nueva(s) emergencia(s) recibida(s).` });
                }
            }
            
            processAlerts(alertsData);
        }, (error) => {
            console.error("Error en onSnapshot de Firestore:", error);
            if (error.code === 'permission-denied') {
                toast({ title: "Error de Permisos", description: "No tienes permisos para ver las alertas.", variant: "destructive", duration: 10000 });
            } else {
                 toast({ title: "Error de Conexión", description: "No se pudieron cargar las alertas en tiempo real.", variant: "destructive" });
            }
            setLoading(false);
        });

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userRole, stationId, processAlerts]);

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme") || "dark";
        setTheme(savedTheme);
        document.documentElement.className = savedTheme;

        let stationsUnsub: (() => void) | undefined;
        if (userRole === 'admin') {
            stationsUnsub = onSnapshot(collection(firestore, "stations"), 
                (snapshot) => {
                    const stationsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StationData));
                    setStations(stationsData);
                },
                (error) => {
                    console.error("Error al cargar estaciones:", error);
                    toast({ title: "Error de Estaciones", description: "No se pudieron cargar los datos de las estaciones.", variant: "destructive" });
                }
            );
        } else {
            setStations([]);
        }
        
        if (userRole) {
            fetchAlerts(); 
        }

        return () => {
             if (stationsUnsub) {
                stationsUnsub();
             }
             if(unsubscribeFromAlerts.current) {
                unsubscribeFromAlerts.current();
             }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userRole, stationId]); 


    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        document.documentElement.className = newTheme;
    };
    
    const handleAlertClick = (alert: EnrichedAlert) => {
        setSelectedAlert(alert);
        setIsModalOpen(true);
    };
    
    const handleMapCentering = (alert: EnrichedAlert) => {
        setSelectedAlert(alert);
        setIsModalOpen(false); 
    }

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedAlert(null);
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
        const activeOrAssigned = alerts.filter(a => a.status === 'new' || a.status === 'assigned').length
        const inProgress = alerts.filter(a => a.status === 'en_route' || a.status === 'on_scene').length
        return {
            active: activeOrAssigned,
            inProgress: inProgress,
            resolved: alerts.filter(a => a.status === 'resolved').length,
        }
    }, [alerts]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'new': return 'bg-red-500/20 text-red-400';
            case 'assigned': return 'bg-blue-500/20 text-blue-400';
            case 'en_route': return 'bg-yellow-500/20 text-yellow-400';
            case 'on_scene': return 'bg-purple-500/20 text-purple-400';
            case 'resolved': return 'bg-green-500/20 text-green-400';
            case 'cancelled': return 'bg-gray-500/20 text-gray-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'new': return 'Nueva';
            case 'assigned': return 'Asignada';
            case 'en_route': return 'En Ruta';
            case 'on_scene': return 'En el Lugar';
            case 'resolved': return 'Finalizada';
            case 'cancelled': return 'Cancelada';
            default: return status;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'new': return <Bell className="h-3 w-3" />;
            case 'assigned': return <HardHat className="h-3 w-3" />;
            case 'en_route': return <Truck className="h-3 w-3" />;
            case 'on_scene': return <Siren className="h-3 w-3" />;
            case 'resolved': return <Check className="h-3 w-3" />;
            case 'cancelled': return <Check className="h-3 w-3" />;
            default: return null;
        }
    }

  return (
    <>
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="bg-card border-b border-border shadow-md">
        <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-primary-foreground font-bold text-xl">🚨</span>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Consola de Emergencias</h1>
                </div>
                <div className="flex items-center space-x-4">
                    {userRole === 'admin' && (
                       <>
                        <Link href="/dashboard/analytics">
                            <Button variant="outline">
                                <LayoutDashboard className="mr-2 h-4 w-4"/>
                                Analíticas
                            </Button>
                        </Link>
                        <Link href="/dashboard/stations">
                            <Button variant="outline">
                                <HardHat className="mr-2 h-4 w-4"/>
                                Estaciones
                            </Button>
                        </Link>
                        <Link href="/dashboard/users">
                            <Button variant="outline">
                                <Users className="mr-2 h-4 w-4"/>
                                Usuarios
                            </Button>
                        </Link>
                       </>
                    )}
                    <SettingsDropdown
                         theme={theme}
                         toggleTheme={toggleTheme}
                    />
                     <Button onClick={handleLogout} variant="destructive" size="sm">
                        <LogOut className="mr-2 h-4 w-4"/>
                        Salir
                    </Button>
                </div>
            </div>
        </div>
      </header>
      
      <main className="flex-1 p-6 container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Nuevas y Asignadas</CardTitle>
                    <Bell className="h-5 w-5 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-red-500">{kpis.active}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">En Progreso</CardTitle>
                    <Zap className="h-5 w-5 text-yellow-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-yellow-500">{kpis.inProgress}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Finalizadas</CardTitle>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-green-500">{kpis.resolved}</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Tiempo Promedio</CardTitle>
                    <Clock className="h-5 w-5 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-blue-500">-- min</div>
                </CardContent>
            </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-card rounded-lg shadow-lg border border-border flex flex-col">
                <div className="p-6 border-b border-border">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-foreground">Alertas de Emergencia</h2>
                        <Button variant="outline" onClick={() => fetchAlerts()} disabled={loading}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}/>
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
                                <SelectItem value="new">Nueva</SelectItem>
                                <SelectItem value="assigned">Asignada</SelectItem>
                                <SelectItem value="en_route">En Ruta</SelectItem>
                                <SelectItem value="on_scene">En el Lugar</SelectItem>
                                <SelectItem value="resolved">Finalizada</SelectItem>
                                <SelectItem value="cancelled">Cancelada</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                    {loading ? (
                         <div className="flex justify-center items-center h-40">
                             <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                         </div>
                    ) : filteredAlerts.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            <p>No hay alertas que coincidan con los filtros.</p>
                            {userRole === 'operator' && !stationId && <p className="text-sm mt-1">No tienes una estación asignada.</p>}
                        </div>
                    ) : (
                        filteredAlerts.map((alert) => (
                            <div key={alert.id} 
                                 className={`p-4 border-b border-border hover:bg-muted/50 transition-colors cursor-pointer ${alert.severityClass}`}
                                 onClick={() => handleAlertClick(alert)}
                            >
                                 <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-foreground font-mono">{alert.id.substring(0, 8)}...</span>
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(alert.status)}`}>
                                            {getStatusIcon(alert.status)}
                                            {getStatusText(alert.status)}
                                        </span>
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full bg-orange-500/20 text-orange-400 dark:text-orange-300`}>{alert.severity}</span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">{alert.timestamp ? formatDistanceToNow((alert.timestamp as Timestamp).toDate(), { addSuffix: true, locale: es }) : 'hace un momento'}</span>
                                </div>
                                <div className="mb-3">
                                    <p className="font-medium text-foreground">{alert.isAnonymous ? "Usuario Anónimo" : alert.userInfo?.fullName || "Usuario Registrado"}</p>
                                    <p className="text-sm text-muted-foreground">Incidente reportado, {alert.assignedStationId ? "asignado" : "pendiente de asignación"}</p>
                                </div>
                                 <div className="flex items-center justify-between text-sm">
                                    <div className="text-muted-foreground flex items-center gap-2">
                                        <MapPin className="h-4 w-4"/>
                                        <span>{alert.location.latitude.toFixed(4)}, {alert.location.longitude.toFixed(4)}</span>
                                    </div>
                                    <div className="text-muted-foreground flex items-center gap-2">
                                         <Building className="h-4 w-4"/>
                                        <span>{alert.stationInfo?.name || "Sin asignar"}</span>
                                    </div>
                                    <Button variant="link" className="p-0 h-auto text-primary hover:text-primary/80">Ver Detalle</Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

             <div className="bg-card rounded-lg shadow-lg border border-border flex flex-col">
                 <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-foreground">Mapa de Incidentes</h2>
                    <p className="text-muted-foreground text-sm">Guatemala - Tiempo Real</p>
                </div>
                <div className="flex-1 p-4 bg-card/50 rounded-b-lg">
                    <div className="w-full h-[70vh] rounded-lg overflow-hidden">
                        <AlertsMap alerts={filteredAlerts} selectedAlert={selectedAlert} theme={theme} />
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
            stations={stations}
            onCenterMap={handleMapCentering}
            userRole={userRole}
        />
     )}
    </>
  );
}
