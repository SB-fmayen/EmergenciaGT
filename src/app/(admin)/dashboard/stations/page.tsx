
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, PlusCircle, Loader2, Edit, Trash2, MapPin, Ambulance } from "lucide-react";
import Link from "next/link";
import { firestore } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import type { StationData, UnitData } from "@/lib/types";
import { createStation, deleteStation } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/app/(admin)/layout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { EditStationModal } from "@/components/admin/EditStationModal";
import { AddUnitModal } from "@/components/admin/AddUnitModal";
import { EditUnitModal } from "@/components/admin/EditUnitModal";
import { UnitList } from "@/components/admin/UnitList";


export default function StationsPage() {
  const [stations, setStations] = useState<StationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { userRole } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);

  const [stationToDelete, setStationToDelete] = useState<StationData | null>(null);
  const [stationToEdit, setStationToEdit] = useState<StationData | null>(null);
  const [stationForNewUnit, setStationForNewUnit] = useState<StationData | null>(null);

  useEffect(() => {
    if (userRole !== 'admin') {
      setLoading(false);
      return;
    }

    setLoading(true);
    const stationsRef = collection(firestore, "stations");
    const q = query(stationsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const stationsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StationData[];
      setStations(stationsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching stations:", error);
      setLoading(false);
      if (error.code === 'permission-denied') {
        toast({ title: "Acceso Denegado", description: "No tienes permisos para ver las estaciones.", variant: "destructive"});
      } else {
        toast({ title: "Error", description: "No se pudieron cargar las estaciones.", variant: "destructive"});
      }
    });

    return () => unsubscribe();
  }, [toast, userRole]);

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (userRole !== 'admin') {
      toast({ title: "Acceso Denegado", description: "Solo los administradores pueden crear estaciones.", variant: "destructive"});
      return;
    }
    setIsSubmitting(true);
    
    const formData = new FormData(event.currentTarget);
    const result = await createStation(formData);

    if (result.success) {
      toast({ title: "Éxito", description: "Estación creada correctamente." });
      formRef.current?.reset();
    } else {
      toast({ title: "Error al crear la estación", description: result.error, variant: "destructive" });
    }

    setIsSubmitting(false);
  };
  
  const handleDeleteStation = async () => {
    if (!stationToDelete) return;
    if (userRole !== 'admin') {
      toast({ title: "Acceso Denegado", variant: "destructive"});
      return;
    }
    
    const result = await deleteStation(stationToDelete.id);
    
    if(result.success) {
        toast({ title: "Éxito", description: `La estación "${stationToDelete.name}" fue eliminada.`});
    } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    
    setStationToDelete(null); // Cierra el modal
  }

  return (
    <>
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="bg-card border-b border-border shadow-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/dashboard/admin">
                <Button variant="outline" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-foreground">Gestión de Estaciones</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 container mx-auto">
        {userRole !== 'admin' ? (
          <Card>
            <CardHeader>
              <CardTitle>Acceso Denegado</CardTitle>
              <CardDescription>No tienes permisos para gestionar estaciones. Por favor, contacta a un administrador.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><PlusCircle /> Nueva Estación</CardTitle>
                  <CardDescription>Añade una nueva estación de bomberos o paramédicos al sistema.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form ref={formRef} onSubmit={handleFormSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-1">Nombre de la Estación</label>
                      <Input id="name" name="name" type="text" placeholder="Ej: Estación Central Zona 1" required />
                    </div>
                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-muted-foreground mb-1">Dirección</label>
                      <Input id="address" name="address" type="text" placeholder="Ej: 1ra Avenida 1-23, Zona 1" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="latitude" className="block text-sm font-medium text-muted-foreground mb-1">Latitud</label>
                        <Input id="latitude" name="latitude" type="number" step="any" placeholder="14.6349" required />
                      </div>
                      <div>
                        <label htmlFor="longitude" className="block text-sm font-medium text-muted-foreground mb-1">Longitud</label>
                        <Input id="longitude" name="longitude" type="number" step="any" placeholder="-90.5069" required />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isSubmitting ? "Guardando..." : "Agregar Estación"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Estaciones Registradas</CardTitle>
                  <CardDescription>Lista de todas las estaciones y sus unidades.</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center items-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {stations.length > 0 ? stations.map((station) => (
                        <Card key={station.id} className="overflow-hidden">
                           <CardHeader className="flex flex-row items-center justify-between bg-muted/50 p-4">
                                <div>
                                    <CardTitle className="text-lg">{station.name}</CardTitle>
                                    <CardDescription>{station.address}</CardDescription>
                                </div>
                                <div className="space-x-1">
                                    <Button variant="outline" size="sm" onClick={() => setStationToEdit(station)}>
                                        <Edit className="h-3 w-3 mr-1"/> Editar Estación
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => setStationToDelete(station)}>
                                        <Trash2 className="h-3 w-3 mr-1"/> Eliminar
                                    </Button>
                                </div>
                           </CardHeader>
                           <CardContent className="p-4">
                                <div className="flex justify-between items-center mb-2">
                                     <h4 className="font-semibold text-muted-foreground flex items-center gap-2"><Ambulance className="h-4 w-4"/>Unidades</h4>
                                     <Button variant="default" size="sm" onClick={() => setStationForNewUnit(station)}>
                                        <PlusCircle className="h-3 w-3 mr-1"/> Añadir Unidad
                                     </Button>
                                </div>
                                <UnitList stationId={station.id} />
                           </CardContent>
                        </Card>
                      )) : (
                          <div className="text-center py-10 text-muted-foreground">
                            {userRole === 'admin' ? "No hay estaciones registradas." : "No tienes permisos para ver esta información."}
                          </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>

    {/* Modales */}
    {stationToEdit && (
        <EditStationModal 
            station={stationToEdit}
            isOpen={!!stationToEdit}
            onClose={() => setStationToEdit(null)}
        />
    )}

    {stationForNewUnit && (
        <AddUnitModal 
            station={stationForNewUnit}
            isOpen={!!stationForNewUnit}
            onClose={() => setStationForNewUnit(null)}
        />
    )}

    <AlertDialog open={!!stationToDelete} onOpenChange={() => setStationToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de que quieres eliminar esta estación?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta acción no se puede deshacer. La estación <span className="font-bold">"{stationToDelete?.name}"</span> y todas sus unidades asociadas serán eliminadas permanentemente.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStation} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    </>
  );
}
