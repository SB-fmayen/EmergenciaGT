
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
import { LogOut, RefreshCw, Bell, Zap, CheckCircle, Clock, MapPin, Building, Loader2, HardHat, Users, LayoutDashboard, Truck, Siren, Check, Stethoscope, Hospital, UserCheck, AlertTriangle } from "lucide-react";
import dynamic from 'next/dynamic';
import { collection, onSnapshot, query, where, getDocs, doc, orderBy, type Query, Timestamp } from "firebase/firestore";
import type { AlertData, MedicalData, StationData, UnitData, UserRole } from "@/lib/types";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertDetailModal } from "@/components/admin/AlertDetailModal";
import Link from 'next/link';
import { SettingsDropdown } from '@/components/admin/SettingsDropdown';
import { useAuth } from "@/app/(admin)/layout";

// Se usa dynamic import para el mapa, ya que Leaflet interactúa directamente con el DOM de la ventana,
// lo cual solo es posible en el lado del cliente. `ssr: false` previene que se intente renderizar en el servidor.
const AlertsMap = dynamic(() => import('@/components/admin/AlertsMap'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
});

/**
 * Interfaz que extiende una alerta con datos adicionales para mostrar en la UI.
 * @property {MedicalData} [userInfo] - Información médica del usuario que generó la alerta.
 * @property {string} [eta] - Tiempo estimado de llegada (funcionalidad futura).
 * @property {{ name: string }} [stationInfo] - Información de la estación asignada.
 * @property {string} [statusClass] - Clase CSS para estilizar según el estado.
 * @property {string} [severityClass] - Clase CSS para estilizar según la severidad.
 * @property {string} [severity] - Nivel de severidad de la alerta.
 */
export interface EnrichedAlert extends AlertData {
    userInfo?: MedicalData;
    eta?: string;
    stationInfo?: { name: string };
    statusClass?: string;
    severityClass?: string;
    severity?: string;
}

/**
 * Componente principal del Dashboard de Administración.
 * Muestra KPIs, una lista de alertas en tiempo real y un mapa interactivo.
 * Su comportamiento se adapta según el rol del usuario (admin vs. operator).
 */
export default function AdminDashboardPage() {
    const router = useRouter();
    const { toast } = useToast();
    // Obtiene el usuario, rol y stationId del contexto de autenticación.
    const { user, userRole, stationId } = useAuth();
    
    // --- ESTADOS DEL COMPONENTE ---
    const [theme, setTheme] = useState("dark"); // Estado para el tema (claro/oscuro)
    const [alerts, setAlerts] = useState<EnrichedAlert[]>([]); // Lista de alertas enriquecidas
    const [stations, setStations] = useState<StationData[]>([]); // Lista de estaciones (solo para admins)
    const [loading, setLoading] = useState(true); // Estado de carga general
    const [selectedAlert, setSelectedAlert] = useState<EnrichedAlert | null>(null); // Alerta seleccionada para ver en detalle
    const [isModalOpen, setIsModalOpen] = useState(false); // Visibilidad del modal de detalle
    
    const [searchTerm, setSearchTerm] = useState(""); // Término de búsqueda para filtrar alertas
    const [statusFilter, setStatusFilter] = useState("all"); // Filtro por estado de alerta

    // --- REFS ---
    // Ref para controlar si la carga inicial ya se completó (para evitar notificaciones de alertas viejas).
    const initialLoadDone = useRef(false);
    // Ref para almacenar la función de desuscripción de la escucha en tiempo real de Firestore.
    const unsubscribeFromAlerts = useRef<() => void>();

    /**
     * Procesa los datos crudos de las alertas y los enriquece con información del usuario de forma eficiente.
     * @param {AlertData[]} alertsData - Array de alertas obtenidas de Firestore.
     */
    const processAlerts = useCallback(async (alertsData: AlertData[]) => {
      try {
        // 1. Recolectar todos los User IDs únicos de las alertas no anónimas.
        const userIds = [...new Set(
            alertsData
                .filter(alert => alert.userId && !alert.isAnonymous)
                .map(alert => alert.userId)
        )];

        let medicalInfoMap = new Map<string, MedicalData>();

        // 2. Si hay User IDs, hacer UNA SOLA consulta a Firestore para obtener todos los datos médicos.
        if (userIds.length > 0) {
            // Nota: Firestore 'in' queries están limitadas a 30 elementos. Para una app real con más usuarios concurrentes,
            // sería necesario dividir esto en múltiples consultas si userIds.length > 30. Para este caso, se asume que no se superará.
            const medicalInfoQuery = query(collection(firestore, "medicalInfo"), where("uid", "in", userIds));
            const medicalInfoSnapshot = await getDocs(medicalInfoQuery);
            medicalInfoSnapshot.forEach(doc => {
                medicalInfoMap.set(doc.id, doc.data() as MedicalData);
            });
        }
        
        // 3. Enriquecer las alertas usando el mapa de datos médicos (mucho más rápido).
        const enrichedAlerts = alertsData.map(alert => {
            const userInfo = alert.userId ? medicalInfoMap.get(alert.userId) : undefined;
            const severity = 'Crítica'; // Placeholder
            return {
                ...alert,
                userInfo,
                stationInfo: alert.assignedStationName ? { name: alert.assignedStationName } : undefined,
                statusClass: `status-${alert.status}`,
                severityClass: `severity-critical`,
                severity,
            };
        });

        // Ordena las alertas por fecha, de la más reciente a la más antigua.
        enrichedAlerts.sort((a, b) => (b.timestamp as Timestamp).toMillis() - (a.timestamp as Timestamp).toMillis());
        
        setAlerts(enrichedAlerts);

      } catch (processingError) {
          console.error("Error processing snapshot data:", processingError);
          toast({ title: "Error de Datos", description: "No se pudieron procesar los datos de las alertas.", variant: "destructive" });
      } finally {
          setLoading(false);
          if (!initialLoadDone.current) {
            initialLoadDone.current = true;
          }
      }
    }, [toast]);

    /**
     * Establece la escucha en tiempo real (listener) a la colección de alertas en Firestore.
     * La consulta se adapta según el rol del usuario.
     */
    const fetchAlerts = useCallback(() => {
         // Si el rol aún no se ha determinado, no hace nada.
         if (!userRole) return;
         setLoading(true);

         // Si ya existe una suscripción, la cancela para evitar duplicados.
         if (unsubscribeFromAlerts.current) {
            unsubscribeFromAlerts.current();
         }

        const alertsRef = collection(firestore, "alerts");
        let q: Query;
        
        // Si es admin, obtiene todas las alertas, ordenadas por fecha.
        if (userRole === 'admin') {
            q = query(alertsRef, orderBy("timestamp", "desc"));
        } 
        // Si es operador, filtra las alertas por la estación a la que está asignado.
        else if (userRole === 'operator') {
             if (!stationId) {
                // Si el operador no tiene estación asignada, no muestra alertas.
                setAlerts([]);
                setLoading(false);
                return;
            }
            q = query(alertsRef, where("assignedStationId", "==", stationId), orderBy("timestamp", "desc"));
        } else {
            // Si el rol no es admin ni operator, no muestra nada.
            setAlerts([]);
            setLoading(false);
            return;
        }

        // Crea el listener de Firestore. `onSnapshot` se ejecuta cada vez que hay un cambio.
        unsubscribeFromAlerts.current = onSnapshot(q, async (querySnapshot) => {
            const currentAlerts = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as AlertData[];
            
            // Lógica para notificar solo de nuevas alertas después de la carga inicial.
            if (initialLoadDone.current) {
                const newAlerts = currentAlerts.filter(a => a.status === 'new' && !alerts.some(old => old.id === a.id));
                if (newAlerts.length > 0) {
                   toast({ title: "¡Nueva Alerta!", description: `${newAlerts.length} nueva(s) emergencia(s) recibida(s).` });
                }
            }
            
            await processAlerts(currentAlerts);
        }, (error) => {
            console.error("Error en onSnapshot de Firestore:", error);
            if (error.code === 'permission-denied') {
                toast({ title: "Error de Permisos", description: "No tienes permisos para ver las alertas.", variant: "destructive", duration: 10000 });
            } else {
                 toast({ title: "Error de Conexión", description: "No se pudieron cargar las alertas en tiempo real.", variant: "destructive" });
            }
            setLoading(false);
        });

    }, [userRole, stationId, processAlerts, toast, alerts]);

    /**
     * Efecto de inicialización del componente.
     * Carga el tema, las estaciones (si es admin) y las alertas.
     */
    useEffect(() => {
        // Recupera el tema guardado en localStorage.
        const savedTheme = localStorage.getItem("theme") || "dark";
        setTheme(savedTheme);
        document.documentElement.className = savedTheme;

        let stationsUnsub: (() => void) | undefined;
        // Si es admin, también se suscribe a los cambios en la colección de estaciones.
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
        
        // Inicia la carga de alertas una vez que el rol del usuario está definido.
        if (userRole) {
            fetchAlerts(); 
        }

        // Función de limpieza: se ejecuta cuando el componente se desmonta.
        // Cancela las suscripciones a Firestore para evitar fugas de memoria.
        return () => {
             if (stationsUnsub) {
                stationsUnsub();
             }
             if(unsubscribeFromAlerts.current) {
                unsubscribeFromAlerts.current();
             }
        }
    }, [userRole, fetchAlerts, toast]); 


    /**
     * Cambia el tema de la aplicación entre claro y oscuro.
     */
    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        document.documentElement.className = newTheme;
    };
    
    /**
     * Maneja el clic en una alerta de la lista, abriendo el modal de detalle.
     * @param {EnrichedAlert} alert - La alerta seleccionada.
     */
    const handleAlertClick = (alert: EnrichedAlert) => {
        setSelectedAlert(alert);
        setIsModalOpen(true);
    };
    
    /**
     * Centra el mapa en una alerta específica, sin abrir el modal.
     * @param {EnrichedAlert} alert - La alerta a centrar.
     */
    const handleMapCentering = (alert: EnrichedAlert) => {
        setSelectedAlert(alert);
        setIsModalOpen(false); 
    }

    /**
     * Cierra el modal de detalle y limpia la alerta seleccionada.
     */
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedAlert(null);
    }

    /**
     * Cierra la sesión del usuario y lo redirige a la página de login.
     */
    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast({ title: "Sesión cerrada" });
            router.push('/login');
        } catch (error) {
            toast({ title: "Error al cerrar sesión", variant: "destructive" });
        }
    };

    /**
     * Filtra la lista de alertas basándose en el término de búsqueda y el filtro de estado.
     * Se memoriza con `useMemo` para evitar recalcular en cada renderizado.
     */
    const filteredAlerts = useMemo(() => {
        return alerts.filter(alert => {
            const matchesStatus = statusFilter === "all" || alert.status === statusFilter;
            const matchesSearch = searchTerm === "" || 
                                  alert.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  (alert.userInfo?.fullName && alert.userInfo.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                  (alert.type && alert.type.toLowerCase().includes(searchTerm.toLowerCase()));
            return matchesStatus && matchesSearch;
        });
    }, [alerts, statusFilter, searchTerm]);

    /**
     * Calcula los Key Performance Indicators (KPIs) a partir de la lista de alertas.
     * Memorizado con `useMemo` para eficiencia.
     */
    const kpis = useMemo(() => {
        const activeOrAssigned = alerts.filter(a => a.status === 'new' || a.status === 'assigned').length;
        const inProgress = alerts.filter(a => ['en_route', 'on_scene', 'attending', 'transporting'].includes(a.status)).length;
        const resolved = alerts.filter(a => ['resolved', 'patient_attended', 'cancelled'].includes(a.status)).length;
        return {
            active: activeOrAssigned,
            inProgress: inProgress,
            resolved: resolved,
        }
    }, [alerts]);

    /**
     * Devuelve la clase CSS correspondiente para la insignia de estado.
     * @param {string} status - El estado de la alerta.
     * @returns {string} - Clases de Tailwind para el estilo.
     */
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'new': return 'bg-red-500/20 text-red-400';
            case 'assigned': return 'bg-blue-500/20 text-blue-400';
            case 'en_route': return 'bg-yellow-500/20 text-yellow-400';
            case 'on_scene': return 'bg-purple-500/20 text-purple-400';
            case 'attending': return 'bg-fuchsia-500/20 text-fuchsia-400';
            case 'transporting': return 'bg-sky-500/20 text-sky-400';
            case 'patient_attended': return 'bg-teal-500/20 text-teal-400';
            case 'resolved': return 'bg-green-500/20 text-green-400';
            case 'cancelled': return 'bg-gray-500/20 text-gray-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    /**
     * Traduce el identificador de estado a un texto legible en español.
     * @param {string} status - El estado de la alerta.
     * @returns {string} - El texto del estado en español.
     */
    const getStatusText = (status: string) => {
        switch (status) {
            case 'new': return 'Nueva';
            case 'assigned': return 'Asignada';
            case 'en_route': return 'En Ruta';
            case 'on_scene': return 'En el Lugar';
            case 'attending': return 'Atendiendo';
            case 'transporting': return 'Trasladando';
            case 'patient_attended': return 'Atendido en Lugar';
            case 'resolved': return 'Finalizada en Hospital';
            case 'cancelled': return 'Cancelada';
            default: return status;
        }
    };

    /**
     * Devuelve el ícono correspondiente para cada estado de alerta.
     * @param {string} status - El estado de la alerta.
     * @returns {JSX.Element | null} - El componente del ícono.
     */
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'new': return <Bell className="h-3 w-3" />;
            case 'assigned': return <HardHat className="h-3 w-3" />;
            case 'en_route': return <Truck className="h-3 w-3" />;
            case 'on_scene': return <Siren className="h-3 w-3" />;
            case 'attending': return <Stethoscope className="h-3 w-3" />;
            case 'transporting': return <Hospital className="h-3 w-3" />;
            case 'patient_attended': return <UserCheck className="h-3 w-3" />;
            case 'resolved': return <Check className="h-3 w-3" />;
            case 'cancelled': return <Check className="h-3 w-3" />;
            default: return null;
        }
    };

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
                    {/* Renderiza los botones de navegación solo si el usuario es administrador */}
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
        {/* Sección de KPIs */}
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
            {/* Columna de la Lista de Alertas */}
            <div className="bg-card rounded-lg shadow-lg border border-border flex flex-col">
                <div className="p-6 border-b border-border">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-foreground">Alertas de Emergencia</h2>
                        <Button variant="outline" onClick={fetchAlerts} disabled={loading}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}/>
                            Actualizar
                        </Button>
                    </div>
                     <div className="flex space-x-4">
                        <Input 
                            type="text" 
                            placeholder="Buscar por ID, nombre o tipo..." 
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
                                <SelectItem value="attending">Atendiendo</SelectItem>
                                <SelectItem value="transporting">Trasladando</SelectItem>
                                <SelectItem value="patient_attended">Atendido en Lugar</SelectItem>
                                <SelectItem value="resolved">Finalizada en Hospital</SelectItem>
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
                                        {alert.type && (
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-cyan-500/20 text-cyan-400`}>
                                                <AlertTriangle className="h-3 w-3" />
                                                {alert.type}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-sm text-muted-foreground">{alert.timestamp ? formatDistanceToNow((alert.timestamp as Timestamp).toDate(), { addSuffix: true, locale: es }) : 'hace un momento'}</span>
                                </div>
                                <div className="mb-3">
                                    <p className="font-medium text-foreground">{alert.isAnonymous ? "Usuario Anónimo" : alert.userInfo?.fullName || "Usuario Registrado"}</p>
                                    <p className="text-sm text-muted-foreground">Incidente reportado, {alert.assignedStationId ? `asignado a ${alert.assignedStationName}` : "pendiente de asignación"}</p>
                                </div>
                                 <div className="flex items-center justify-between text-sm">
                                    <div className="text-muted-foreground flex items-center gap-2">
                                        <MapPin className="h-4 w-4"/>
                                        <span>{alert.location.latitude.toFixed(4)}, {alert.location.longitude.toFixed(4)}</span>
                                    </div>
                                    <div className="text-muted-foreground flex items-center gap-2">
                                         <Building className="h-4 w-4"/>
                                        <span>{alert.assignedStationName || "Sin asignar"}</span>
                                    </div>
                                    <Button variant="link" className="p-0 h-auto text-primary hover:text-primary/80">Ver Detalle</Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

             {/* Columna del Mapa */}
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
    {/* Renderiza el modal de detalle solo si hay una alerta seleccionada */}
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

    