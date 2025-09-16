
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
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebase";
import type { MedicalData, EmergencyContact } from "@/lib/types";

const medicalConditionsList = [
  "Diabetes",
  "Hipertensión",
  "Problemas Cardíacos",
  "Asma",
  "Epilepsia",
  "Alergias",
];

const initialFormData: MedicalData = {
    fullName: "",
    age: "",
    bloodType: "",
    emergencyContacts: [{ name: "", phone: "", relation: "" }],
    conditions: [],
    otherConditions: "",
    medications: [{ name: "" }],
    additionalNotes: "",
}

/**
 * Página para que los usuarios registren y actualicen su información médica.
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
  const [isNewUser, setIsNewUser] = useState(true);

  const [formData, setFormData] = useState<MedicalData>(initialFormData);

  /**
   * Efecto para verificar la autenticación y cargar datos existentes.
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchMedicalData(user.uid);
      } else {
        router.push("/auth");
      }
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Carga los datos médicos del usuario desde Firestore si existen.
   * @param uid - El ID del usuario.
   */
  const fetchMedicalData = async (uid: string) => {
    setLoading(true);
    const userMedicalDocRef = doc(firestore, "medicalInfo", uid);
    const docSnap = await getDoc(userMedicalDocRef);
    if (docSnap.exists()) {
        const data = docSnap.data() as MedicalData;
        // Nos aseguramos de que los arrays existan para evitar errores
        data.emergencyContacts = data.emergencyContacts && data.emergencyContacts.length > 0 ? data.emergencyContacts : initialFormData.emergencyContacts;
        data.medications = data.medications && data.medications.length > 0 ? data.medications : initialFormData.medications;
        data.conditions = data.conditions || [];
        
        setFormData(data);
        setIsNewUser(false);
    } else {
        setFormData(initialFormData);
        setIsNewUser(true);
    }
    setLoading(false);
  }
  
  const handleInputChange = (field: keyof Omit<MedicalData, 'medications' | 'conditions' | 'emergencyContacts'>, value: string) => {
    if (field === 'age') {
        const numericValue = value.replace(/[^0-9]/g, '');
        if (numericValue.length <= 3) {
            setFormData(prev => ({ ...prev, [field]: numericValue }));
        }
    } else {
        setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSelectChange = (field: keyof MedicalData, value: string) => {
     setFormData(prev => ({ ...prev, [field]: value }));
  }

  const handleConditionChange = (condition: string, checked: boolean) => {
    setFormData(prev => {
      const newConditions = checked
        ? [...prev.conditions, condition]
        : prev.conditions.filter(c => c !== condition);
      return { ...prev, conditions: newConditions };
    });
  };

  // --- Manejo de Contactos de Emergencia ---
  
  const handleContactChange = (index: number, field: keyof EmergencyContact, value: string) => {
    if (field === 'phone') {
        // Solo permitir números y limitar a 8 dígitos
        const numericValue = value.replace(/[^0-9]/g, '');
        if (numericValue.length <= 8) {
            const newContacts = [...formData.emergencyContacts];
            newContacts[index] = { ...newContacts[index], [field]: numericValue };
            setFormData(prev => ({ ...prev, emergencyContacts: newContacts }));
        }
    } else {
        const newContacts = [...formData.emergencyContacts];
        newContacts[index] = { ...newContacts[index], [field]: value };
        setFormData(prev => ({ ...prev, emergencyContacts: newContacts }));
    }
  };

  const addContact = () => {
    setFormData(prev => ({ ...prev, emergencyContacts: [...prev.emergencyContacts, { name: "", phone: "", relation: "" }] }));
  };

  const removeContact = (index: number) => {
    if (formData.emergencyContacts.length > 1) {
      setFormData(prev => ({ ...prev, emergencyContacts: prev.emergencyContacts.filter((_, i) => i !== index) }));
    }
  };

  // --- Manejo de Medicamentos ---

  const handleAddMedication = () => {
    setFormData(prev => ({ ...prev, medications: [...prev.medications, { name: "" }] }));
  };

  const handleRemoveMedication = (index: number) => {
    // Permitir eliminar incluso si es el último, para dejar la lista vacía
     setFormData(prev => ({ ...prev, medications: prev.medications.filter((_, i) => i !== index) }));
  };

  const handleMedicationChange = (index: number, value: string) => {
    const newMedications = [...formData.medications];
    newMedications[index] = { name: value };
    setFormData(prev => ({ ...prev, medications: newMedications }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
        toast({ title: "Error", description: "Debes iniciar sesión para guardar tus datos.", variant: "destructive"});
        return;
    }

    setSaving(true);
    try {
      const finalData = {
          ...formData,
          // Filtra medicamentos y contactos vacíos antes de guardar
          medications: formData.medications.filter(m => m.name.trim() !== ""),
          emergencyContacts: formData.emergencyContacts.filter(c => c.name.trim() !== "" && c.phone.trim() !== "")
      }

      const userMedicalDocRef = doc(firestore, "medicalInfo", currentUser.uid);
      await setDoc(userMedicalDocRef, finalData);

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

  if (loading) {
    return (
        <MobileAppContainer className="bg-slate-900 justify-center items-center">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
            <p className="text-white mt-4">Cargando tus datos...</p>
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
              {isNewUser ? "Completa tus datos para emergencias" : "Actualiza tus datos de emergencia"}
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
                  <Input type="text" inputMode="numeric" placeholder="Edad" value={formData.age} onChange={e => handleInputChange('age', e.target.value)} required />
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
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold text-gray-100 flex items-center">
                  <span className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mr-3">
                    <Phone className="w-4 h-4 text-green-300" />
                  </span>
                  Contactos de Emergencia
                </h3>
                 <Button type="button" onClick={addContact} size="sm" className="bg-green-500 hover:bg-green-600 text-white rounded-lg">
                  <Plus className="w-4 h-4 mr-1" /> Agregar
                </Button>
              </div>
             
              <div className="space-y-4">
                {formData.emergencyContacts.map((contact, index) => (
                    <div key={index} className="space-y-3 p-4 bg-slate-700/50 rounded-xl relative animate-slide-in">
                        {formData.emergencyContacts.length > 1 && (
                             <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 w-7 h-7" onClick={() => removeContact(index)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}
                        <Input type="text" placeholder="Nombre del contacto" value={contact.name} onChange={e => handleContactChange(index, 'name', e.target.value)} required />
                        <div className="grid grid-cols-2 gap-4">
                            <Input type="tel" placeholder="Teléfono" value={contact.phone} onChange={e => handleContactChange(index, 'phone', e.target.value)} required />
                            <Input type="text" placeholder="Relación (Ej: Esposo/a)" value={contact.relation} onChange={e => handleContactChange(index, 'relation', e.target.value)} required />
                        </div>
                    </div>
                ))}
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
                {formData.medications.length > 0 ? formData.medications.map((med, index) => (
                  <div key={index} className="flex items-center space-x-3 animate-slide-in">
                    <Input
                      type="text"
                      placeholder="Nombre del medicamento y dosis"
                      value={med.name}
                      onChange={(e) => handleMedicationChange(index, e.target.value)}
                    />
                    <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveMedication(index)}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )) : (
                    <p className="text-slate-400 text-sm text-center py-2">No has agregado medicamentos.</p>
                )}
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
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-700 text-white py-4 h-auto rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            disabled={saving}
          >
            {saving ? <Loader2 className="animate-spin" /> : "Guardar Información"}
          </Button>
        </footer>
      </div>
    </MobileAppContainer>
  );
}
