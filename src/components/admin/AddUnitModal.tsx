
"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { createUnit } from "@/app/(admin)/dashboard/stations/actions";
import type { StationData } from "@/lib/types";


interface AddUnitModalProps {
    isOpen: boolean;
    onClose: () => void;
    station: StationData;
}

export function AddUnitModal({ isOpen, onClose, station }: AddUnitModalProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);
    const [unitType, setUnitType] = useState<string>("");

    const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        
        const formPayload = new FormData(event.currentTarget);
        const result = await createUnit(station.id, formPayload);

        if (result.success) {
            toast({ title: "Éxito", description: "Nueva unidad añadida correctamente." });
            onClose();
        } else {
            toast({ title: "Error al añadir unidad", description: result.error, variant: "destructive" });
        }

        setIsSubmitting(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                 <form ref={formRef} onSubmit={handleFormSubmit}>
                    <DialogHeader>
                        <DialogTitle>Añadir Nueva Unidad a {station.name}</DialogTitle>
                        <DialogDescription>
                            Define los detalles de la nueva unidad de emergencia.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="nombre" className="text-right">Nombre</label>
                            <Input id="nombre" name="nombre" placeholder="Ej: Ambulancia A-123" className="col-span-3" required/>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="tipo" className="text-right">Tipo</label>
                             <Select name="tipo" required onValueChange={setUnitType} value={unitType}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Seleccionar tipo..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Ambulancia">Ambulancia</SelectItem>
                                    <SelectItem value="Motobomba">Motobomba</SelectItem>
                                    <SelectItem value="Unidad de Rescate">Unidad de Rescate</SelectItem>
                                    <SelectItem value="Otro">Otro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSubmitting ? "Guardando..." : "Añadir Unidad"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
