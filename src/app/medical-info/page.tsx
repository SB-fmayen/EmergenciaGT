
"use client";

import { useState, useEffect } from "react";
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
  MessageSquare,
  Loader2,
  Pill,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAuth, onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebase";
import type { MedicalData } from "@/lib/types";

const medicalConditionsList = [
  "Diabetes",
  "Hipertensión",
  "Problemas Cardíacos",
  "Asma",
  "Epilepsia",
  "Alergias",
];

/**
 * Página para que los usuarios registren su información médica.
 * Los datos se guardan en Firestore asociados al UID del usuario autenticado.
 */
export default function MedicalInfoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);

  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<MedicalData>({
    fullName: "",
    age: "",
    bloodType: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
    conditions: [],
    otherConditions: "",
    medications: [{ name: "" }],
    additionalNotes: "",
  });

  /**
   * Efecto para verificar el estado de autenticación del usuario.
   * Si no hay un usuario logueado, lo redirige a la página de inicio.
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        // Si no hay usuario, redirigir al login
        router.push("/");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, router]);
  
  /**
   * Maneja los cambios en los campos de tipo input.
   * @param field - El campo del estado formData a actualizar.
   * @param value - El nuevo valor del campo.
   */
  const handleInputChange = (field: keyof Omit<MedicalData, 'medications' | 'conditions'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Maneja los cambios en los campos de tipo select.
   * @param field - El campo del estado formData a actualizar.
   * @param value - El nuevo valor del campo.
   */
  const handleSelectChange = (field: keyof MedicalData, value: string) => {
     setFormData(prev => ({ ...prev, [field]: value }));
  }

  /**
   * Maneja la selección o deselección de una condición médica predefinida.
   * @param condition - La condición médica a agregar o quitar.
   * @param checked - El estado del checkbox.
   */
  const handleConditionChange = (condition: string, checked: boolean) => {
    setFormData(prev => {
      const newConditions = checked
        ? [...prev.conditions, condition]
        : prev.conditions.filter(c => c !== condition);
      return { ...prev, conditions: newConditions };
    });
  };

  /**
   * Agrega un nuevo campo para un medicamento.
   */
  const handleAddMedication = () => {
    setFormData(prev => ({ ...prev, medications: [...prev.medications, { name: "" }] }));
  };

  /**
   * Elimina un campo de medicamento.
   * @param index - El índice del medicamento a eliminar.
   */
  const handleRemoveMedication = (index: number) => {
    if (formData.medications.length > 1) {
      setFormData(prev => ({ ...prev, medications: prev.medications.filter((_, i) => i !== index) }));
    }
  };

  /**
   * Actualiza el valor de un campo de medicamento.
   * @param index - El índice del medicamento a actualizar.
   * @param value - El nuevo nombre y dosis del medicamento.
   */
  const handleMedicationChange = (index: number, value: string) => {
    const newMedications = [...formData.medications];
    newMedications[index] = { name: value };
    setFormData(prev => ({ ...prev, medications: newMedications }));
  };

  /**
   * Procesa el envío del formulario.
   * Guarda los datos médicos en Firestore en un documento con el ID del usuario.
   * @param e - Evento del formulario.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
        toast({ title: "Error", description: "Debes iniciar sesión para guardar tus datos.", variant: "destructive"});
        return;
    }

    setSaving(true);
    try {
      // Guardar datos en Firestore, usando el UID del usuario como ID del documento
      const userMedicalDocRef = doc(firestore, "medicalInfo", currentUser.uid);
      await setDoc(userMedicalDocRef, formData);

      toast({
        title: "¡Datos guardados!",
        description: "Tu información médica ha sido registrada correctamente.",
      });
      router.push("/dashboard");
    } catch (error) {
      console.error("Error saving medical info:", error);
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar tu información. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
        setSaving(false);
    }
  };

  // Muestra una pantalla de carga mientras se verifica el usuario
  if (loading) {
    return (
        <MobileAppContainer className="bg-slate-900 justify-center items-center">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
            <p className="text-white mt-4">Cargando...</p>
        </MobileAppContainer>
    )
  }

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
                <Input type="text" placeholder="Nombre Completo" value={formData.fullName} onChange={e => handleInputChange('fullName', e.target.value)} required />
                <div className="grid grid-cols-2 gap-4">
                  <Input type="number" placeholder="Edad" value={formData.age} onChange={e => handleInputChange('age', e.target.value)} required />
                  <Select onValueChange={value => handleSelectChange('bloodType', value)} value={formData.bloodType}>
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
                <Input type="text" placeholder="Nombre del contacto" value={formData.emergencyContactName} onChange={e => handleInputChange('emergencyContactName', e.target.value)} required />
                <div className="grid grid-cols-2 gap-4">
                  <Input type="tel" placeholder="Teléfono" value={formData.emergencyContactPhone} onChange={e => handleInputChange('emergencyContactPhone', e.target.value)} required />
                  <Input type="text" placeholder="Relación (Ej: Esposo/a)" value={formData.emergencyContactRelation} onChange={e => handleInputChange('emergencyContactRelation', e.target.value)} required />
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
                {medicalConditionsList.map((condition) => (
                  <label
                    key={condition}
                    className="flex items-center p-3 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <Checkbox id={condition} className="mr-3" onCheckedChange={checked => handleConditionChange(condition, !!checked)} checked={formData.conditions.includes(condition)} />
                    <span className="text-sm text-gray-300">{condition}</span>
                  </label>
                ))}
              </div>
              <Textarea
                rows={3}
                placeholder="Describe otras condiciones médicas importantes"
                value={formData.otherConditions}
                onChange={e => handleInputChange('otherConditions', e.target.value)}
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
                {formData.medications.map((med, index) => (
                  <div key={index} className="flex items-center space-x-3 animate-slide-in">
                    <Input
                      type="text"
                      placeholder="Nombre del medicamento y dosis"
                      value={med.name}
                      onChange={(e) => handleMedicationChange(index, e.target.value)}
                    />
                    {formData.medications.length > 1 && (
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
                <Textarea rows={4} placeholder="Cualquier información adicional importante..." value={formData.additionalNotes} onChange={e => handleInputChange('additionalNotes', e.target.value)} />
            </div>

          </form>
        </div>

        <footer className="px-6 py-4 bg-background/80 backdrop-blur-sm border-t border-slate-700/50 flex-shrink-0">
          <Button
            type="submit"
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-4 h-auto rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            disabled={saving}
          >
            {saving ? <Loader2 className="animate-spin" /> : "Guardar y Continuar"}
          </Button>
        </footer>
      </div>
    </MobileAppContainer>
  );
}
