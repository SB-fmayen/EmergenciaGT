
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, BrainCircuit, Loader2 } from "lucide-react";
import { suggestResponsePlan, type SuggestResponsePlanOutput } from "@/ai/flows/suggest-response-plan";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle as UiAlertTitle } from "@/components/ui/alert";
import type { AlertData, MedicalData } from "@/lib/types";


interface EmergencyModalProps {
  /** Controla si el modal está abierto o cerrado. */
  isOpen: boolean;
  /** Función para cerrar el modal. */
  onClose: () => void;
  /** Los datos de la alerta generada. */
  alertData: AlertData | null;
  /** Los datos médicos del usuario. */
  medicalData: MedicalData | null;
}

/**
 * Modal que se muestra después de activar una alerta de emergencia.
 * Confirma al usuario que la alerta fue enviada y muestra un tiempo estimado de llegada.
 * Permite al usuario solicitar un plan de respuesta generado por IA.
 * @param {EmergencyModalProps} props - Propiedades del componente.
 */
export function EmergencyModal({ isOpen, onClose, alertData, medicalData }: EmergencyModalProps) {
  const [responsePlan, setResponsePlan] = useState<SuggestResponsePlanOutput | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);

  /**
   * Llama al flujo de Genkit para obtener un plan de respuesta sugerido por IA.
   * Utiliza los datos reales de la alerta y la ficha médica.
   */
  const handleGeneratePlan = async () => {
    if (!alertData) return;

    setIsLoadingPlan(true);
    setResponsePlan(null);
    try {
      const alertDetails = `Alerta generada. Ubicación: ${alertData.location?.latitude}, ${alertData.location?.longitude}. Estado actual: ${alertData.status}.`;
      
      // Formatea el historial médico para que sea más legible para la IA
      const medicalHistory = medicalData 
        ? `Nombre del paciente: ${medicalData.fullName}, Edad: ${medicalData.age}, Tipo de Sangre: ${medicalData.bloodType}. Condiciones médicas conocidas: ${medicalData.conditions.join(', ') || 'Ninguna'}. Otras condiciones: ${medicalData.otherConditions || 'Ninguna'}. Medicamentos actuales: ${medicalData.medications.map(m => m.name).join(', ') || 'Ninguno'}. Notas adicionales: ${medicalData.additionalNotes || 'Ninguna'}.`
        : "No hay datos médicos disponibles para el paciente.";

      const plan = await suggestResponsePlan({ 
        alertDetails,
        medicalHistory
      });
      setResponsePlan(plan);
    } catch (error) {
      console.error("Error generating response plan:", error);
    } finally {
      setIsLoadingPlan(false);
    }
  };


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
              <Button onClick={handleGeneratePlan} disabled={isLoadingPlan || !alertData} className="w-full bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2">
                {isLoadingPlan ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <BrainCircuit className="h-5 w-5" />
                )}
                {isLoadingPlan ? "Generando Plan..." : "Sugerir Plan de Respuesta (IA)"}
              </Button>
              
              {responsePlan && (
                <Alert className="text-left bg-white/10 border-white/20">
                  <UiAlertTitle className="text-white font-bold">Plan de Respuesta Sugerido:</UiAlertTitle>
                  <AlertDescription className="text-white/90 whitespace-pre-wrap">
                    {responsePlan.responsePlan}
                  </AlertDescription>
                </Alert>
              )}

              <Button onClick={onClose} className="w-full bg-white text-red-600 px-12 py-4 h-auto rounded-xl font-bold text-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg">
                  Entendido
              </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
