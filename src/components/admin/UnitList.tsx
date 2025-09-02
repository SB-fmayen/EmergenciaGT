
"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import type { UnitData } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Loader2, UserX, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { deleteUnit } from "@/app/(admin)/dashboard/stations/actions";
import { EditUnitModal } from "./EditUnitModal";
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

interface UnitListProps {
    stationId: string;
}

export function UnitList({ stationId }: UnitListProps) {
    const [units, setUnits] = useState<UnitData[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    // Estados para los modales
    const [unitToEdit, setUnitToEdit] = useState<UnitData | null>(null);
    const [unitToDelete, setUnitToDelete] = useState<UnitData | null>(null);

    useEffect(() => {
        setLoading(true);
        const unitsRef = collection(firestore, "stations", stationId, "unidades");
        const q = query(unitsRef, orderBy("nombre", "asc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const unitsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as UnitData[];
            setUnits(unitsData);
            setLoading(false);
        }, (error) => {
            console.error(`Error fetching units for station ${stationId}:`, error);
            toast({ title: "Error", description: "No se pudieron cargar las unidades.", variant: "destructive" });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [stationId, toast]);

    const handleDeleteUnit = async () => {
        if (!unitToDelete) return;

        const result = await deleteUnit(stationId, unitToDelete.id);
        if (result.success) {
            toast({ title: "Unidad Eliminada", description: `La unidad "${unitToDelete.nombre}" ha sido eliminada.` });
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
        setUnitToDelete(null);
    };

    if (loading) {
        return <div className="flex items-center justify-center p-4"><Loader2 className="h-5 w-5 animate-spin" /></div>;
    }

    return (
        <>
            <div className="border rounded-lg">
                 <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Asignada a</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {units.length > 0 ? units.map((unit) => (
                        <TableRow key={unit.id}>
                            <TableCell className="font-medium">{unit.nombre}</TableCell>
                            <TableCell>{unit.tipo}</TableCell>
                            <TableCell>
                                {unit.uid ? (
                                    <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                        <UserCheck className="h-3 w-3 text-green-500" /> Usuario Asignado
                                    </Badge>
                                ) : (
                                     <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                        <UserX className="h-3 w-3 text-muted-foreground" /> Sin asignar
                                    </Badge>
                                )}
                            </TableCell>
                            <TableCell className="text-right space-x-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setUnitToEdit(unit)}>
                                    <Edit className="h-4 w-4 text-yellow-500" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setUnitToDelete(unit)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </TableCell>
                        </TableRow>
                        )) : (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center h-24">
                            No hay unidades registradas para esta estación.
                            </TableCell>
                        </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Modal de Edición de Unidad */}
            {unitToEdit && (
                <EditUnitModal 
                    isOpen={!!unitToEdit}
                    onClose={() => setUnitToEdit(null)}
                    unit={unitToEdit}
                    stationId={stationId}
                />
            )}

            {/* Diálogo de Confirmación para Eliminar Unidad */}
            <AlertDialog open={!!unitToDelete} onOpenChange={() => setUnitToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>¿Seguro que quieres eliminar la unidad "{unitToDelete?.nombre}"?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción es permanente y no se puede deshacer.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteUnit} className="bg-destructive hover:bg-destructive/90">Eliminar Unidad</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
