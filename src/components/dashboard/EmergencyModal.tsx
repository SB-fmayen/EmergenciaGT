
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, ShieldX } from "lucide-react";


interface EmergencyModalProps {
  /** Controla si el modal está abierto o cerrado. */
  isOpen: boolean;
  /** Función para cerrar el modal. */
  onClose: () => void;
  /** Función para abrir el modal de cancelación. */
  onCancel: () => void;
}

/**
 * Modal que se muestra después de activar una alerta de emergencia.
 * Confirma al usuario que la alerta fue enviada y muestra un tiempo estimado de llegada.
 * @param {EmergencyModalProps} props - Propiedades del componente.
 */
export function EmergencyModal({ isOpen, onClose, onCancel }: EmergencyModalProps) {

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-red-500 text-white max-w-sm w-full p-0">
        <DialogHeader className="sr-only">
            <DialogTitle>Alerta de Emergencia Enviada</DialogTitle>
            <DialogDescription>
                Los servicios de emergencia han sido notificados y están en camino.
            </DialogDescription>
        </DialogHeader>
        <div className="p-6 text-center">
            <div className="mb-8">
                <div className="w-32 h-32 bg-white rounded-full mx-auto mb-6 flex items-center justify-center">
                <CheckCircle className="w-16 h-16 text-red-600" />
                </div>
            </div>
            <h2 className="text-4xl font-black mb-4 text-red-500">¡ALERTA ENVIADA!</h2>
            <p className="text-2xl mb-6 font-medium text-slate-200">
                Los servicios de emergencia han sido notificados
            </p>
            <div className="bg-slate-800 rounded-2xl p-6 mb-8">
                <p className="text-xl mb-2 flex items-center justify-center gap-2 text-slate-300"><Clock /> Tiempo estimado de llegada</p>
                <p className="text-3xl font-bold text-white">8-12 minutos</p>
            </div>
            
            <div className="space-y-4">
              <Button onClick={onClose} className="w-full bg-red-600 text-white px-12 py-4 h-auto rounded-xl font-bold text-xl hover:bg-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
                  Entendido
              </Button>
               <Button onClick={onCancel} variant="outline" className="w-full border-slate-500 text-slate-300 hover:bg-slate-700 hover:text-white">
                  <ShieldX className="mr-2 h-4 w-4"/>
                  Cancelar Alerta
              </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
