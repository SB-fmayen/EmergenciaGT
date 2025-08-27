"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { MobileAppContainer } from "@/components/MobileAppContainer";
import {
  ArrowLeft,
  HeartPulse,
  Plus,
  Trash2,
  User,
  Phone,
  BookUser,
  ClipboardList,
  Pill,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const medicalConditions = [
  "Diabetes",
  "Hipertensión",
  "Problemas Cardíacos",
  "Asma",
  "Epilepsia",
  "Alergias",
];

export default function MedicalInfoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [medications, setMedications] = useState([""]);

  const handleAddMedication = () => {
    setMedications([...medications, ""]);
  };

  const handleRemoveMedication = (index: number) => {
    if (medications.length > 1) {
      const newMedications = medications.filter((_, i) => i !== index);
      setMedications(newMedications);
    }
  };

  const handleMedicationChange = (index: number, value: string) => {
    const newMedications = [...medications];
    newMedications[index] = value;
    setMedications(newMedications);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically save the data to a backend/store
    console.log("Saving medical info...");
    toast({
      title: "¡Datos guardados!",
      description: "Tu información médica ha sido registrada correctamente.",
    });
    router.push("/dashboard");
  };

  return (
    <MobileAppContainer className="bg-slate-900">
      <div className="flex flex-col h-full">
        <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-6 flex items-center shadow-lg flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="mr-4 hover:bg-white/10"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Información Médica</h1>
            <p className="text-blue-100 text-sm">
              Completa tus datos para emergencias
            </p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-slate-800/50 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-gray-100 mb-4 flex items-center">
                <span className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mr-3">
                  <User className="w-4 h-4 text-blue-300" />
                </span>
                Información Personal
              </h3>
              <div className="space-y-4">
                <Input type="text" placeholder="Nombre Completo" />
                <div className="grid grid-cols-2 gap-4">
                  <Input type="number" placeholder="Edad" />
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de Sangre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-gray-100 mb-4 flex items-center">
                <span className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mr-3">
                  <Phone className="w-4 h-4 text-green-300" />
                </span>
                Contacto de Emergencia
              </h3>
              <div className="space-y-4">
                <Input type="text" placeholder="Nombre del contacto" />
                <div className="grid grid-cols-2 gap-4">
                  <Input type="tel" placeholder="Teléfono" />
                  <Input type="text" placeholder="Relación (Ej: Esposo/a)" />
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-gray-100 mb-4 flex items-center">
                <span className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center mr-3">
                  <HeartPulse className="w-4 h-4 text-red-300" />
                </span>
                Condiciones Médicas
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {medicalConditions.map((condition) => (
                  <label
                    key={condition}
                    className="flex items-center p-3 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <Checkbox id={condition} className="mr-3" />
                    <span className="text-sm text-gray-300">{condition}</span>
                  </label>
                ))}
              </div>
              <Textarea
                rows={3}
                placeholder="Describe otras condiciones médicas importantes"
              />
            </div>
            
            <div className="bg-slate-800/50 rounded-2xl p-6 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-100 flex items-center">
                  <span className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center mr-3">
                    <Pill className="w-4 h-4 text-purple-300" />
                  </span>
                  Medicamentos
                </h3>
                <Button type="button" onClick={handleAddMedication} size="sm" className="bg-purple-500 hover:bg-purple-600 text-white rounded-lg">
                  <Plus className="w-4 h-4 mr-1" /> Agregar
                </Button>
              </div>
              <div className="space-y-3">
                {medications.map((med, index) => (
                  <div key={index} className="flex items-center space-x-3 animate-slide-in">
                    <Input
                      type="text"
                      placeholder="Nombre del medicamento y dosis"
                      value={med}
                      onChange={(e) => handleMedicationChange(index, e.target.value)}
                    />
                    {medications.length > 1 && (
                      <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveMedication(index)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-gray-100 mb-4 flex items-center">
                  <span className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center mr-3">
                    <MessageSquare className="w-4 h-4 text-yellow-300" />
                  </span>
                  Notas Adicionales
                </h3>
                <Textarea rows={4} placeholder="Cualquier información adicional importante..." />
            </div>

          </form>
        </div>

        <footer className="px-6 py-4 bg-background/80 backdrop-blur-sm border-t border-slate-700/50 flex-shrink-0">
          <Button
            type="submit"
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-4 h-auto rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Guardar y Continuar
          </Button>
        </footer>
      </div>
    </MobileAppContainer>
  );
}
