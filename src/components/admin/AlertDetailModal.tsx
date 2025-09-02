
"use client"

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Map, User, Info, Ambulance, Loader2, HardHat, AlertTriangle, Truck } from "lucide-react";
import type { EnrichedAlert } from "@/app/(admin)/dashboard/admin/page";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AlertStatus, StationData, UnitData } from "@/lib/types";
import { doc, updateDoc, Timestamp, collection, onSnapshot, query, where } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";


interface AlertDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    alert: EnrichedAlert;
    stations: StationData[];
    onCenterMap: (alert: EnrichedAlert) => void;
    userRole: 'admin' | 'operator' | 'unit' | null;
}

const InfoRow = ({ label, value, valueClass, children }: { label: string, value?: string | number | null, children?: React.ReactNode, valueClass?: string }) => (
    <div>
        <p className="font-semibold text-muted-foreground">{label}:</p>
        {value || children ? <div className={`mt-1 ${valueClass || 'text-foreground'}`}>{value || children}</div> : <p className="mt-1 text-muted-foreground/70">No disponible</p>}
    </div>
);


const getStatusBadge = (status: AlertStatus) => {
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

const getStatusText = (status: AlertStatus) => {
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

export function AlertDetailModal({ isOpen, onClose, alert, stations, onCenterMap, userRole }: AlertDetailModalProps) {
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    
    // Estados para la asignación
    const [units, setUnits] = useState<UnitData[]>([]);
    const [loadingUnits, setLoadingUnits] = useState(false);
    const [selectedStationId, setSelectedStationId] = useState<string | undefined>(alert.assignedStationId);
    const [selectedUnitId, setSelectedUnitId] = useState<string | undefined>(alert.assignedUnitId);
    
    const [selectedStatus, setSelectedStatus] = useState<AlertStatus>(alert.status);

    if (!alert) return null;

    // Cargar unidades cuando se selecciona una estación
    useEffect(() => {
        let unsubscribe: () => void;
        if (selectedStationId) {
            setLoadingUnits(true);
            const unitsRef = collection(firestore, "stations", selectedStationId, "unidades");
            const q = query(unitsRef, where("disponible", "==", true));
            
            unsubscribe = onSnapshot(q, (snapshot) => {
                const unitsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UnitData));
                setUnits(unitsData);
                setLoadingUnits(false);
            }, (error) => {
                console.error("Error fetching units:", error);
                toast({ title: "Error", description: "No se pudieron cargar las unidades de la estación.", variant: "destructive" });
                setLoadingUnits(false);
            });
        } else {
            setUnits([]);
            setSelectedUnitId(undefined);
        }
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [selectedStationId, toast]);

    // Resetear estados internos cuando el modal se abre o la alerta cambia
    useEffect(() => {
        if(isOpen) {
            setSelectedStatus(alert.status);
            setSelectedStationId(alert.assignedStationId);
            setSelectedUnitId(alert.assignedUnitId);
        }
    }, [isOpen, alert]);

    const reportDate = alert.timestamp && typeof (alert.timestamp as any).toDate === 'function' 
        ? (alert.timestamp as Timestamp).toDate() 
        : alert.timestamp as Date;

    const handleCenterMapClick = () => {
        onCenterMap(alert);
        onClose();
    }

    const handleUpdateStatus = async () => {
        setIsUpdating(true);
        try {
            const alertRef = doc(firestore, "alerts", alert.id);
            await updateDoc(alertRef, { status: selectedStatus });
            toast({
                title: "Estado Actualizado",
                description: `La alerta ${alert.id.substring(0, 8)} ha sido actualizada a "${getStatusText(selectedStatus)}".`
            });
            onClose();
        } catch (error) {
            console.error("Error updating status:", error);
            toast({ title: "Error", description: "No se pudo actualizar el estado de la alerta.", variant: "destructive" });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAssignUnit = async () => {
        if (!selectedStationId || !selectedUnitId) {
            toast({ title: "Error", description: "Debes seleccionar una estación y una unidad.", variant: "destructive"});
            return;
        }
        setIsAssigning(true);
        try {
            const station = stations.find(s => s.id === selectedStationId);
            const unit = units.find(u => u.id === selectedUnitId);

            const alertRef = doc(firestore, "alerts", alert.id);
            await updateDoc(alertRef, { 
                assignedStationId: selectedStationId,
                assignedStationName: station?.name || "Desconocido",
                assignedUnitId: selectedUnitId,
                assignedUnitName: unit?.nombre || "Desconocido",
                status: 'assigned' // Automatically set to assigned
            });
            toast({ title: "Unidad Asignada", description: `La alerta ha sido asignada a ${unit?.nombre} de ${station?.name}.`});
            onClose();
        } catch (error) {
            console.error("Error assigning unit:", error);
            toast({ title: "Error", description: "No se pudo asignar la unidad.", variant: "destructive"});
        } finally {
            setIsAssigning(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl w-full p-0 bg-card border-border text-foreground">
                <DialogHeader className="p-6 border-b border-border flex flex-row items-center justify-between">
                     <DialogTitle className="text-xl font-bold text-foreground">Detalle de Alerta: {alert.id.substring(0,8)}...</DialogTitle>
                </DialogHeader>

                <div className="p-6 max-h-[80vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                        {/* User Info */}
                        <div className="p-4 bg-background rounded-lg border border-border">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-muted-foreground"><User/>Información del Usuario</h3>
                            <div className="space-y-3 text-sm">
                                <InfoRow label="Nombre" value={alert.isAnonymous ? "Usuario Anónimo" : alert.userInfo?.fullName} />
                                <InfoRow label="Edad" value={alert.isAnonymous ? "N/A" : `${alert.userInfo?.age || ''} años`} />
                                <InfoRow label="Tipo de Sangre" value={alert.isAnonymous ? "N/A" : alert.userInfo?.bloodType} />
                                <InfoRow label="Condiciones" value={alert.isAnonymous ? "N/A" : alert.userInfo?.conditions?.join(', ') || 'Ninguna'} />
                                <InfoRow label="Contacto" value={alert.isAnonymous ? "N/A" : alert.userInfo?.emergencyContacts?.[0]?.phone || 'No registrado'} />
                            </div>
                        </div>
                        {/* Event Info */}
                        <div className="p-4 bg-background rounded-lg border border-border">
                             <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-muted-foreground"><Info />Información del Evento</h3>
                            <div className="space-y-3 text-sm">
                                <InfoRow label="ID de Evento" value={alert.id} />
                                <InfoRow label="Tipo de Alerta">
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-cyan-500/20 text-cyan-400">
                                        <AlertTriangle className="h-3 w-3" />
                                        {alert.type || 'Pánico General'}
                                    </span>
                                </InfoRow>
                                <InfoRow label="Hora de Reporte" value={reportDate ? format(reportDate, "dd/MM/yyyy, hh:mm:ss a", { locale: es }) : 'N/A'} />
                                <InfoRow label="Estado Actual">
                                     <span className={`px-2 py-0.5 inline-block text-xs rounded-full ${getStatusBadge(alert.status)}`}>
                                        {getStatusText(alert.status)}
                                    </span>
                                </InfoRow>
                                <InfoRow label="Coordenadas" value={`${alert.location.latitude.toFixed(6)}, ${alert.location.longitude.toFixed(6)}`} />
                                <InfoRow label="Razón Cancelación" value={alert.cancellationReason} />
                            </div>
                        </div>
                    </div>

                    {userRole === 'admin' && (
                     <div className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/50">
                         <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-primary"><Truck />Asignar Unidad</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-primary/90">1. Seleccionar Estación</label>
                                <Select onValueChange={setSelectedStationId} value={selectedStationId}>
                                    <SelectTrigger className="w-full mt-1">
                                        <SelectValue placeholder="Seleccionar estación..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {stations.map(station => (
                                            <SelectItem key={station.id} value={station.id}>{station.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div>
                                <label className="text-sm font-medium text-primary/90">2. Seleccionar Unidad</label>
                                <Select onValueChange={setSelectedUnitId} value={selectedUnitId} disabled={!selectedStationId || loadingUnits}>
                                    <SelectTrigger className="w-full mt-1">
                                        <SelectValue placeholder={loadingUnits ? "Cargando..." : "Seleccionar unidad..."} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {loadingUnits ? (
                                            <div className="flex items-center justify-center p-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            </div>
                                        ) : units.length > 0 ? (
                                            units.map(unit => (
                                                <SelectItem key={unit.id} value={unit.id}>{unit.nombre}</SelectItem>
                                            ))
                                        ) : (
                                            <div className="p-2 text-center text-sm text-muted-foreground">No hay unidades disponibles</div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                         <div className="mt-4 flex justify-end">
                            <Button className="bg-primary hover:bg-primary/90" onClick={handleAssignUnit} disabled={isAssigning || !selectedStationId || !selectedUnitId}>
                                {isAssigning ? <Loader2 className="animate-spin" /> : "Asignar y Notificar"}
                            </Button>
                         </div>
                         <div className="mt-4 text-sm text-primary/80">
                             <p><strong>Unidad Asignada:</strong> {alert.assignedUnitName || 'Ninguna'}</p>
                             <p><strong>Estación:</strong> {alert.assignedStationName || 'Ninguna'}</p>
                         </div>
                    </div>
                    )}
                </div>
                 <DialogFooter className="p-6 border-t border-border bg-background/50 flex-col sm:flex-row gap-2">
                    <div className="flex items-center space-x-4 w-full">
                        <Select defaultValue={alert.status} onValueChange={(v) => setSelectedStatus(v as AlertStatus)}>
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Actualizar estado" />
                            </SelectTrigger>
                            <SelectContent>
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
                        <Button className="bg-primary hover:bg-primary/90" onClick={handleUpdateStatus} disabled={isUpdating || selectedStatus === alert.status}>
                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Actualizar Estado
                        </Button>
                    </div>
                     <div className="w-full sm:w-auto">
                        <Button onClick={handleCenterMapClick} variant="outline" className="w-full">
                           <Map className="mr-2 h-4 w-4" /> Ver en Mapa
                        </Button>
                     </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
