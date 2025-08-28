
"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Map, Zap, ChevronsRight, User, Info, Ambulance } from "lucide-react";
import type { EnrichedAlert } from "@/app/(admin)/dashboard/admin/page";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AlertDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    alert: EnrichedAlert;
    onCenterMap: (alert: EnrichedAlert) => void;
}

const InfoRow = ({ label, value, valueClass }: { label: string, value?: string | number, valueClass?: string }) => (
    <div>
        <span className="font-semibold text-slate-400">{label}:</span>
        <span className={`ml-2 ${valueClass || 'text-slate-200'}`}>{value || 'No disponible'}</span>
    </div>
);

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

export function AlertDetailModal({ isOpen, onClose, alert, onCenterMap }: AlertDetailModalProps) {
    if (!alert) return null;

    const handleCenterMapClick = () => {
        onCenterMap(alert);
        onClose(); // Cierra el modal después de centrar
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl w-full p-0 bg-slate-900 border-slate-700 text-white">
                <DialogHeader className="p-6 border-b border-slate-700 flex flex-row items-center justify-between">
                     <DialogTitle className="text-xl font-bold text-white">Detalle de Alerta: {alert.id.substring(0,8)}...</DialogTitle>
                     <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
                        <X className="h-5 w-5" />
                    </Button>
                </DialogHeader>

                <div className="p-6 max-h-[80vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                        {/* User Info */}
                        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-300"><User/>Información del Usuario</h3>
                            <div className="space-y-2 text-sm">
                                <InfoRow label="Nombre" value={alert.isAnonymous ? "Usuario Anónimo" : alert.userInfo?.fullName} />
                                <InfoRow label="Edad" value={alert.isAnonymous ? "N/A" : `${alert.userInfo?.age} años`} />
                                <InfoRow label="Tipo de Sangre" value={alert.isAnonymous ? "N/A" : alert.userInfo?.bloodType} />
                                <InfoRow label="Condiciones" value={alert.isAnonymous ? "N/A" : alert.userInfo?.conditions?.join(', ') || 'Ninguna'} />
                                <InfoRow label="Contacto" value={alert.isAnonymous ? "N/A" : alert.userInfo?.emergencyContacts?.[0]?.phone || 'No registrado'} />
                            </div>
                        </div>
                        {/* Event Info */}
                        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                             <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-300"><Info />Información del Evento</h3>
                            <div className="space-y-2 text-sm">
                                <InfoRow label="ID" value={alert.id} />
                                <InfoRow label="Tipo" value="Accidente de Tránsito" />
                                <InfoRow label="Hora" value={alert.timestamp ? format(alert.timestamp, "dd/MM/yyyy, hh:mm:ss a", { locale: es }) : 'N/A'} />
                                <InfoRow label="Severidad" value={alert.severity} valueClass="px-2 py-0.5 text-xs rounded-full bg-orange-500/20 text-orange-300" />
                                <InfoRow label="Estado" value={getStatusText(alert.status)} valueClass={`px-2 py-0.5 text-xs rounded-full ${getStatusBadge(alert.status)}`} />
                                <InfoRow label="Coordenadas" value={`${alert.location.latitude.toFixed(6)}, ${alert.location.longitude.toFixed(6)}`} />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                         <h3 className="font-bold text-lg mb-2 text-slate-300">Descripción</h3>
                         <p className="text-slate-200 text-sm">
                            Colisión múltiple en Zona 10. (Descripción simulada)
                         </p>
                    </div>

                    {/* Assigned Station */}
                     <div className="mb-6 p-4 bg-blue-900/40 rounded-lg border border-blue-500/50">
                         <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-slate-300"><Ambulance />Estación Asignada</h3>
                        <div className="flex items-center justify-between">
                            <div>
                                <p><span className="font-medium">Estación:</span> {alert.stationInfo?.name || "Pendiente"}</p>
                                <p><span className="font-medium">ETA:</span> 8-12 minutos (simulado)</p>
                            </div>
                             <div className="flex space-x-2">
                                <Button className="bg-green-600 hover:bg-green-700 text-white">
                                    <Map className="mr-2 h-4 w-4"/> Ver Ruta
                                </Button>
                                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                                    <ChevronsRight className="mr-2 h-4 w-4"/> Trasladar
                                </Button>
                            </div>
                        </div>
                    </div>

                </div>
                 <DialogFooter className="p-6 border-t border-slate-700 bg-slate-900/50">
                    <div className="flex items-center space-x-4 w-full">
                        <Select defaultValue={alert.status}>
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
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            Actualizar Estado
                        </Button>
                        <Button onClick={handleCenterMapClick}>
                            Ver en Mapa
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
