
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ClipboardList, ShieldAlert } from "lucide-react";
import type { MedicalData } from "@/lib/types";

interface MedicalInfoModalProps {
  /** Controla si el modal está abierto o cerrado. */
  isOpen: boolean;
  /** Función para cerrar el modal. */
  onClose: () => void;
  /** Datos médicos del usuario a mostrar. */
  medicalData: MedicalData | null;
  /** Indica si el usuario es anónimo */
  isAnonymous?: boolean;
}

/**
 * Muestra la información médica del usuario en un modal.
 * Los datos se obtienen de Firestore.
 * @param {MedicalInfoModalProps} props - Propiedades del componente.
 */
export function MedicalInfoModal({
  isOpen,
  onClose,
  medicalData,
  isAnonymous = false,
}: MedicalInfoModalProps) {
  
  const hasData = !!medicalData && medicalData.fullName;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm w-full bg-slate-800 border-slate-700 text-white p-0 animate-slide-up">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-green-600 to-green-700 rounded-t-lg">
          <DialogTitle className="text-lg font-bold">Información Médica</DialogTitle>
          <DialogDescription className="text-green-100 text-sm">
            {isAnonymous ? "Datos temporales para esta emergencia" : "Tus datos registrados para emergencias"}
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {hasData ? (
            <div className="space-y-4 text-sm">
              <div className="flex justify-between"><strong>Nombre:</strong> <span>{medicalData.fullName}</span></div>
              <div className="flex justify-between"><strong>Edad:</strong> <span>{medicalData.age} años</span></div>
              <div className="flex justify-between items-center"><strong>Tipo de Sangre:</strong> <span className="bg-red-200 text-red-900 px-2 py-1 rounded-full text-xs font-medium">{medicalData.bloodType}</span></div>
              
              {medicalData.conditions && medicalData.conditions.length > 0 && (
                <div>
                  <strong>Condiciones:</strong>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {medicalData.conditions.map((condition, i) => (
                      <span key={i} className="bg-blue-200 text-blue-900 px-2 py-1 rounded-full text-xs">{condition}</span>
                    ))}
                  </div>
                </div>
              )}

              {medicalData.medications && medicalData.medications.length > 0 && medicalData.medications.some(m => m.name) && (
                <div>
                  <strong>Medicamentos:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {medicalData.medications.filter(m => m.name).map((med, i) => (
                      <li key={i} className="text-xs bg-purple-200 text-purple-900 p-2 rounded">{med.name}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {medicalData.emergencyContacts && medicalData.emergencyContacts.length > 0 && medicalData.emergencyContacts.some(c => c.name) && (
                 <div>
                    <strong>Contactos de Emergencia:</strong>
                    <div className="space-y-2 mt-2">
                        {medicalData.emergencyContacts.filter(c => c.name).map((contact, i) => (
                            <div key={i} className="bg-green-200/20 p-3 rounded-lg border border-green-400/50">
                                <strong>{contact.name} ({contact.relation})</strong><br/>
                                <a href={`tel:${contact.phone}`} className="text-green-300 font-medium">{contact.phone}</a>
                            </div>
                        ))}
                    </div>
                 </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                {isAnonymous ? <ShieldAlert className="w-8 h-8 text-slate-400"/> : <ClipboardList className="w-8 h-8 text-slate-400" />}
              </div>
              <p className="text-slate-400">
                {isAnonymous 
                    ? "En modo invitado, puedes añadir datos médicos que se enviarán solo con tu próxima alerta."
                    : "No hay información médica registrada."
                }
              </p>
               <Button onClick={() => {onClose(); window.location.href = '/medical-info'}} className="mt-4 bg-blue-500 hover:bg-blue-600">
                  {isAnonymous ? "Añadir Info. Temporal" : "Registrar ahora"}
               </Button>
            </div>
          )}
        </div>
        <DialogFooter className="p-6 pt-4 border-t border-slate-700 bg-slate-800/50">
           {(hasData || isAnonymous) && (
              <Button onClick={() => {onClose(); window.location.href = '/medical-info'}} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                {isAnonymous ? "Editar Info. Temporal" : "Actualizar Información"}
              </Button>
           )}
          <Button onClick={onClose} className="w-full bg-slate-600 hover:bg-slate-500 text-white" variant={(hasData || isAnonymous) ? "outline" : "default"}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
