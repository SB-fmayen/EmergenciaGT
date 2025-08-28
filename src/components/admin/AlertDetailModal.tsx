
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
import { X, Map, User, Info, Ambulance, Loader2 } from "lucide-react";
import type { EnrichedAlert } from "@/app/(admin)/dashboard/admin/page";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AlertStatus } from "@/lib/types";
import { doc, updateDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";


interface AlertDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    alert: EnrichedAlert;
    onCenterMap: (alert: EnrichedAlert) => void;
}

const InfoRow = ({ label, value, valueClass }: { label: string, value?: string | number, valueClass?: string }) => (
    <div>
        <p className="font-semibold text-muted-foreground">{label}:</p>
        <p className={`mt-1 ${valueClass || 'text-foreground'}`}>{value || 'No disponible'}</p>
    </div>
);

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'new': return 'bg-red-500/20 text-red-500 dark:text-red-300';
        case 'dispatched': return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-300';
        case 'resolved': return 'bg-green-500/20 text-green-600 dark:text-green-300';
        case 'cancelled': return 'bg-gray-500/20 text-gray-500 dark:text-gray-400';
        default: return 'bg-gray-500/20 text-gray-500 dark:text-gray-400';
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

export function AlertDetailModal({ isOpen, onClose, alert, onCenterMap }: AlertDetailModalProps) {
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<AlertStatus>(alert.status);

    if (!alert) return null;

    const handleCenterMapClick = () => {
        onCenterMap(alert);
        onClose(); // Cierra el modal después de centrar
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
            toast({
                title: "Error",
                description: "No se pudo actualizar el estado de la alerta.",
                variant: "destructive"
            });
        } finally {
            setIsUpdating(false);
        }
    };

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
                                <InfoRow label="Tipo de Incidente" value="Accidente de Tránsito" />
                                <InfoRow label="Hora de Reporte" value={alert.timestamp ? format(alert.timestamp, "dd/MM/yyyy, hh:mm:ss a", { locale: es }) : 'N/A'} />
                                <InfoRow label="Severidad (IA)" value={alert.severity} valueClass="px-2 py-0.5 inline-block text-xs rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-300" />
                                <InfoRow label="Estado Actual" value={getStatusText(alert.status)} valueClass={`px-2 py-0.5 inline-block text-xs rounded-full ${getStatusBadge(alert.status)}`} />
                                <InfoRow label="Coordenadas" value={`${alert.location.latitude.toFixed(6)}, ${alert.location.longitude.toFixed(6)}`} />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mb-6 p-4 bg-background rounded-lg border border-border">
                         <h3 className="font-bold text-lg mb-2 text-muted-foreground">Descripción del Incidente</h3>
                         <p className="text-foreground text-sm">
                            Colisión múltiple en Zona 10. (Descripción simulada)
                         </p>
                    </div>

                    {/* Assigned Station */}
                     <div className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/50">
                         <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-primary"><Ambulance />Unidad Asignada</h3>
                        <div className="flex items-center justify-between">
                            <div>
                                <p><span className="font-medium">Estación:</span> {alert.stationInfo?.name || "Pendiente"}</p>
                                <p><span className="font-medium">ETA:</span> 8-12 minutos (simulado)</p>
                            </div>
                             <div className="flex space-x-2">
                                <Button className="bg-green-600 hover:bg-green-700 text-white">
                                    <Map className="mr-2 h-4 w-4"/> Ver Ruta
                                </Button>
                                <Button className="bg-purple-600 hover:bg-purple-700 text-white" disabled>
                                    Trasladar
                                </Button>
                            </div>
                        </div>
                    </div>

                </div>
                 <DialogFooter className="p-6 border-t border-border bg-background/50 flex-col sm:flex-row gap-2">
                    <div className="flex items-center space-x-4 w-full">
                        <Select defaultValue={alert.status} onValueChange={(v) => setSelectedStatus(v as AlertStatus)}>
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Actualizar estado" />
                            </SelectTrigger>
                            <SelectContent>
                               <SelectItem value="new">Activa</SelectItem>
                               <SelectItem value="dispatched">En Curso</SelectItem>
                               <SelectItem value="resolved">Finalizada</SelectItem>
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

    