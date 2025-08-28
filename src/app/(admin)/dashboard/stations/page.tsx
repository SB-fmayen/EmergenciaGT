
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, PlusCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { firestore } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import type { StationData } from "@/lib/types";
import { createStation } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/app/(admin)/layout";

export default function StationsPage() {
  const [stations, setStations] = useState<StationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { userRole } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // No intentes cargar datos si el rol aún no es 'admin'
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
        toast({ title: "Acceso Denegado", description: "No tienes permisos para ver las estaciones. Contacta a un administrador.", variant: "destructive"});
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

  return (
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
                  <CardDescription>Lista de todas las estaciones activas en el sistema.</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center items-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Dirección</TableHead>
                          <TableHead>Coordenadas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stations.length > 0 ? stations.map((station) => (
                          <TableRow key={station.id}>
                            <TableCell className="font-medium">{station.name}</TableCell>
                            <TableCell>{station.address}</TableCell>
                            <TableCell className="font-mono text-xs">{station.location.latitude.toFixed(4)}, {station.location.longitude.toFixed(4)}</TableCell>
                          </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground">
                              {userRole === 'admin' ? "No hay estaciones registradas." : "No tienes permisos para ver esta información."}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
