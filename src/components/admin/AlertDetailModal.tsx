
"use client"

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Map, User, Info, Ambulance, Loader2, HardHat } from "lucide-react";
import type { EnrichedAlert } from "@/app/(admin)/dashboard/admin/page";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AlertStatus, StationData } from "@/lib/types";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";


interface AlertDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    alert: EnrichedAlert;
    stations: StationData[];
    onCenterMap: (alert: EnrichedAlert) => void;
    userRole: 'admin' | 'operator' | null;
}

const InfoRow = ({ label, value, valueClass }: { label: string, value?: string | number, valueClass?: string }) => (
    <div>
        <p className="font-semibold text-muted-foreground">{label}:</p>
        <p className={`mt-1 ${valueClass || 'text-foreground'}`}>{value || 'No disponible'}</p>
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
    const [selectedStatus, setSelectedStatus] = useState<AlertStatus>(alert.status);
    const [selectedStation, setSelectedStation] = useState<string | undefined>(alert.assignedStationId);

    if (!alert) return null;

    // Convert Firestore Timestamp to JS Date object safely.
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

    const handleAssignStation = async () => {
        if (!selectedStation) {
            toast({ title: "Error", description: "Debes seleccionar una estación para asignar.", variant: "destructive"});
            return;
        }
        setIsAssigning(true);
        try {
            const station = stations.find(s => s.id === selectedStation);
            const alertRef = doc(firestore, "alerts", alert.id);
            await updateDoc(alertRef, { 
                assignedStationId: selectedStation,
                assignedStationName: station?.name || "Desconocido",
                status: 'assigned' // Automatically set to assigned
            });
            toast({ title: "Estación Asignada", description: `La alerta ha sido asignada a ${station?.name}.`});
            onClose();
        } catch (error) {
            console.error("Error assigning station:", error);
            toast({ title: "Error", description: "No se pudo asignar la estación.", variant: "destructive"});
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
                                <InfoRow label="Edad" value={alert.isAnonymous ? "N/A" : `${alert.userInfo?.age} años`} />
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
                                <InfoRow label="Hora de Reporte" value={reportDate ? format(reportDate, "dd/MM/yyyy, hh:mm:ss a", { locale: es }) : 'N/A'} />
                                <InfoRow label="Severidad (IA)" value={alert.severity} valueClass="px-2 py-0.5 inline-block text-xs rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-300" />
                                <InfoRow label="Estado Actual" value={getStatusText(alert.status)} valueClass={`px-2 py-0.5 inline-block text-xs rounded-full ${getStatusBadge(alert.status)}`} />
                                <InfoRow label="Coordenadas" value={`${alert.location.latitude.toFixed(6)}, ${alert.location.longitude.toFixed(6)}`} />
                                <InfoRow label="Razón Cancelación" value={alert.cancellationReason} />
                            </div>
                        </div>
                    </div>

                    {/* Assigned Station - Only for Admins */}
                    {userRole === 'admin' && (
                     <div className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/50">
                         <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-primary"><HardHat />Asignar Estación</h3>
                        <div className="flex items-center justify-between">
                            <div className="flex-1 pr-4">
                                <p className="font-medium text-primary/80 mb-2">Estación Asignada: <span className="font-bold text-primary">{alert.assignedStationName || "Pendiente de Asignación"}</span></p>
                                <div className="flex gap-2">
                                     <Select onValueChange={setSelectedStation} defaultValue={selectedStation}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Seleccionar estación..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {stations.map(station => (
                                                <SelectItem key={station.id} value={station.id}>{station.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                     <Button className="bg-primary hover:bg-primary/90" onClick={handleAssignStation} disabled={isAssigning || !selectedStation}>
                                        {isAssigning ? <Loader2 className="animate-spin" /> : "Asignar"}
                                    </Button>
                                </div>
                            </div>
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
                               <SelectItem value="transporting">Trasladando a Hospital</SelectItem>
                               <SelectItem value="patient_attended">Atendido en Lugar (Sin Traslado)</SelectItem>
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
