
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock } from "lucide-react";


interface EmergencyModalProps {
  /** Controla si el modal está abierto o cerrado. */
  isOpen: boolean;
  /** Función para cerrar el modal. */
  onClose: () => void;
}

/**
 * Modal que se muestra después de activar una alerta de emergencia.
 * Confirma al usuario que la alerta fue enviada y muestra un tiempo estimado de llegada.
 * @param {EmergencyModalProps} props - Propiedades del componente.
 */
export function EmergencyModal({ isOpen, onClose }: EmergencyModalProps) {

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-red-600/95 backdrop-blur-md border-red-500 text-white max-w-sm w-full animate-flash-emergency p-0">
        <DialogHeader className="sr-only">
            <DialogTitle>Alerta de Emergencia Enviada</DialogTitle>
            <DialogDescription>
                Los servicios de emergencia han sido notificados y están en camino.
            </DialogDescription>
        </DialogHeader>
        <div className="p-6 text-center">
            <div className="mb-8">
                <div className="w-32 h-32 bg-white rounded-full mx-auto mb-6 flex items-center justify-center animate-bounce">
                <CheckCircle className="w-16 h-16 text-red-600" />
                </div>
            </div>
            <h2 className="text-4xl font-black mb-4">¡ALERTA ENVIADA!</h2>
            <p className="text-2xl mb-6 font-medium">
                Los servicios de emergencia han sido notificados
            </p>
            <div className="bg-white/20 rounded-2xl p-6 mb-8">
                <p className="text-xl mb-2 flex items-center justify-center gap-2"><Clock /> Tiempo estimado de llegada</p>
                <p className="text-3xl font-bold">8-12 minutos</p>
            </div>
            
            <div className="space-y-4">
              <Button onClick={onClose} className="w-full bg-white text-red-600 px-12 py-4 h-auto rounded-xl font-bold text-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg">
                  Entendido
              </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
