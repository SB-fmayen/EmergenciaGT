
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { MobileAppContainer } from "@/components/MobileAppContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, ArrowLeft, Plus, Trash2, HeartPulse, User } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../layout";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebase";
import type { MedicalData } from "@/lib/types";

const medicalFormSchema = z.object({
  fullName: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  age: z.string().min(1, { message: "La edad es requerida." }),
  bloodType: z.string().min(2, { message: "El tipo de sangre es requerido." }),
  conditions: z.array(z.string()).optional(),
  otherConditions: z.string().optional(),
  medications: z.array(z.object({ name: z.string() })).optional(),
  emergencyContacts: z.array(z.object({
    name: z.string().min(1, "Nombre de contacto requerido"),
    phone: z.string().min(8, "Teléfono debe tener al menos 8 dígitos"),
    relation: z.string().min(1, "Relación requerida"),
  })).min(1, "Debes agregar al menos un contacto de emergencia."),
  additionalNotes: z.string().optional(),
});

const defaultConditions = [
  "Alergias",
  "Asma",
  "Diabetes",
  "Hipertensión",
  "Problemas Cardíacos",
];

export default function MedicalInfoPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const firestore = getFirestore(firebaseApp);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialDataLoading, setInitialDataLoading] = useState(true);

  const form = useForm<z.infer<typeof medicalFormSchema>>({
    resolver: zodResolver(medicalFormSchema),
    defaultValues: {
      fullName: "",
      age: "",
      bloodType: "",
      conditions: [],
      otherConditions: "",
      medications: [{ name: "" }],
      emergencyContacts: [{ name: "", phone: "", relation: "" }],
      additionalNotes: "",
    },
  });
  
  const { fields: medFields, append: appendMed, remove: removeMed } = useFieldArray({
    control: form.control,
    name: "medications",
  });
  const { fields: contactFields, append: appendContact, remove: removeContact } = useFieldArray({
    control: form.control,
    name: "emergencyContacts",
  });
  
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth");
      return;
    }
    if (user.isAnonymous) {
      // Allow anonymous to fill form but don't try to fetch data
      setInitialDataLoading(false);
      return;
    }
    
    const fetchMedicalData = async () => {
      setInitialDataLoading(true);
      const medicalInfoRef = doc(firestore, "medicalInfo", user.uid);
      const docSnap = await getDoc(medicalInfoRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as MedicalData;
        form.reset({
          ...data,
          // Ensure arrays are not undefined for the form
          medications: data.medications?.length ? data.medications : [{ name: "" }],
          emergencyContacts: data.emergencyContacts?.length ? data.emergencyContacts : [{ name: "", phone: "", relation: "" }],
        });
      }
      setInitialDataLoading(false);
    };

    fetchMedicalData();
  }, [user, authLoading, router, firestore, form]);


  const onSubmit = async (values: z.infer<typeof medicalFormSchema>) => {
    if (!user) {
      toast({ title: "Error", description: "Debes iniciar sesión para guardar tus datos.", variant: "destructive"});
      return;
    }
    if (user.isAnonymous) {
      toast({ title: "Modo Invitado", description: "La información médica se guardará temporalmente. Inicia sesión para guardarla de forma permanente." });
      // TODO: Handle temporary storage for anonymous users (e.g., localStorage)
      router.push('/dashboard');
      return;
    }

    setIsSubmitting(true);
    try {
      const medicalInfoRef = doc(firestore, "medicalInfo", user.uid);
      await setDoc(medicalInfoRef, {
        ...values,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      toast({
        title: "¡Éxito!",
        description: "Tu información médica ha sido guardada correctamente.",
      });
      router.push("/dashboard");
    } catch (error) {
      console.error("Error saving medical info:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar tu información. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || initialDataLoading) {
    return (
      <MobileAppContainer className="bg-slate-900 justify-center items-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
        <p className="text-slate-400 mt-4">Cargando información...</p>
      </MobileAppContainer>
    );
  }

  return (
    <MobileAppContainer className="bg-slate-900">
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
          <header className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-6 flex items-center shadow-lg flex-shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mr-4 hover:bg-white/10"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Información Médica</h1>
              <p className="text-blue-100 text-sm">Vital para tu atención</p>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
            <div className="space-y-4 p-4 bg-slate-800/50 rounded-lg">
              <h2 className="font-bold text-lg text-white flex items-center"><User className="mr-2"/>Datos Personales</h2>
               <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Nombre Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Tu nombre completo" {...field} className="bg-slate-700 border-slate-600 text-white"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Edad</FormLabel>
                        <FormControl>
                           <Input type="number" placeholder="Ej: 30" {...field} className="bg-slate-700 border-slate-600 text-white"/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bloodType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Tipo de Sangre</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: O+" {...field} className="bg-slate-700 border-slate-600 text-white"/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
               </div>
            </div>
            
            <div className="space-y-4 p-4 bg-slate-800/50 rounded-lg">
                <h2 className="font-bold text-lg text-white flex items-center"><HeartPulse className="mr-2"/>Historial Médico</h2>
                <FormField
                  control={form.control}
                  name="conditions"
                  render={() => (
                    <FormItem>
                       <FormLabel className="text-slate-300">Condiciones Médicas Pre-existentes</FormLabel>
                       <div className="space-y-2">
                         {defaultConditions.map((condition) => (
                           <FormField
                             key={condition}
                             control={form.control}
                             name="conditions"
                             render={({ field }) => (
                               <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2 bg-slate-700/50 rounded-md">
                                 <FormControl>
                                   <Checkbox
                                     className="border-slate-500"
                                     checked={field.value?.includes(condition)}
                                     onCheckedChange={(checked) => {
                                       return checked
                                         ? field.onChange([...(field.value || []), condition])
                                         : field.onChange(
                                             field.value?.filter(
                                               (value) => value !== condition
                                             )
                                           )
                                     }}
                                   />
                                 </FormControl>
                                 <FormLabel className="font-normal text-slate-300">
                                   {condition}
                                 </FormLabel>
                               </FormItem>
                             )}
                           />
                         ))}
                       </div>
                       <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="otherConditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Otras condiciones</FormLabel>
                      <FormControl>
                        <Input placeholder="Especifica otras condiciones..." {...field} className="bg-slate-700 border-slate-600 text-white"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>

            <div className="space-y-4 p-4 bg-slate-800/50 rounded-lg">
              <h3 className="font-bold text-lg text-white">Medicamentos Actuales</h3>
              {medFields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name={`medications.${index}.name`}
                    render={({ field }) => (
                      <FormItem className="flex-grow">
                        <FormControl>
                           <Input placeholder="Nombre del medicamento" {...field} className="bg-slate-700 border-slate-600 text-white"/>
                        </FormControl>
                         <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="destructive" size="icon" onClick={() => removeMed(index)} className="bg-red-800/80 hover:bg-red-700/80">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => appendMed({ name: "" })} className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                <Plus className="mr-2 h-4 w-4" /> Añadir Medicamento
              </Button>
            </div>
            
             <div className="space-y-4 p-4 bg-slate-800/50 rounded-lg">
              <h3 className="font-bold text-lg text-white">Contactos de Emergencia</h3>
              {contactFields.map((field, index) => (
                 <div key={field.id} className="p-3 bg-slate-700/50 rounded-lg space-y-2 relative">
                    <FormField control={form.control} name={`emergencyContacts.${index}.name`} render={({ field }) => (
                        <FormItem><FormLabel className="text-xs text-slate-400">Nombre</FormLabel><FormControl><Input {...field} placeholder="Nombre del contacto" className="bg-slate-700 border-slate-600 text-white"/></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name={`emergencyContacts.${index}.phone`} render={({ field }) => (
                        <FormItem><FormLabel className="text-xs text-slate-400">Teléfono</FormLabel><FormControl><Input {...field} type="tel" placeholder="Número de teléfono" className="bg-slate-700 border-slate-600 text-white"/></FormControl><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name={`emergencyContacts.${index}.relation`} render={({ field }) => (
                        <FormItem><FormLabel className="text-xs text-slate-400">Relación</FormLabel><FormControl><Input {...field} placeholder="Ej: Esposo, Madre..." className="bg-slate-700 border-slate-600 text-white"/></FormControl><FormMessage /></FormItem>
                    )}/>
                   {contactFields.length > 1 && <Button type="button" variant="destructive" size="icon" onClick={() => removeContact(index)} className="absolute top-2 right-2 h-7 w-7 bg-red-800/80 hover:bg-red-700/80"><Trash2 className="w-4 h-4"/></Button>}
                 </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => appendContact({ name: "", phone: "", relation: "" })} className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                <Plus className="mr-2 h-4 w-4" /> Añadir Contacto
              </Button>
              <FormField control={form.control} name="emergencyContacts" render={() => <FormMessage />} />
            </div>

            <div className="space-y-2 p-4 bg-slate-800/50 rounded-lg">
                <h3 className="font-bold text-lg text-white">Notas Adicionales</h3>
                <FormField
                  control={form.control}
                  name="additionalNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-400 text-sm">Cualquier otra información relevante para los paramédicos.</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Alergias severas, ubicación de llaves, etc." {...field} className="bg-slate-700 border-slate-600 text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
          </div>

          <footer className="p-4 bg-black/20 backdrop-blur-sm mt-auto flex-shrink-0">
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 h-14 text-lg" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : "Guardar Información"}
            </Button>
          </footer>
        </form>
      </FormProvider>
    </MobileAppContainer>
  );
}
