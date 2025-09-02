
"use client";

import { useState, useRef, useEffect } from "react";
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
import { updateUnit } from "@/app/(admin)/dashboard/stations/actions";
import type { UnitData } from "@/lib/types";

interface EditUnitModalProps {
    isOpen: boolean;
    onClose: () => void;
    unit: UnitData;
    stationId: string;
}

export function EditUnitModal({ isOpen, onClose, unit, stationId }: EditUnitModalProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({
        nombre: unit.nombre,
        tipo: unit.tipo.toString(),
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                nombre: unit.nombre,
                tipo: unit.tipo.toString(),
            });
        }
    }, [isOpen, unit]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }

    const handleSelectChange = (value: string) => {
        setFormData(prev => ({ ...prev, tipo: value }));
    }

    const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        
        const formPayload = new FormData();
        formPayload.append('nombre', formData.nombre);
        formPayload.append('tipo', formData.tipo);

        const result = await updateUnit(stationId, unit.id, formPayload);

        if (result.success) {
            toast({ title: "Éxito", description: "Unidad actualizada correctamente." });
            onClose();
        } else {
            toast({ title: "Error al actualizar", description: result.error, variant: "destructive" });
        }

        setIsSubmitting(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                 <form onSubmit={handleFormSubmit}>
                    <DialogHeader>
                        <DialogTitle>Editar Unidad</DialogTitle>
                        <DialogDescription>
                           Modifica los detalles de la unidad de emergencia.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="nombre" className="text-right">Nombre</label>
                            <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleInputChange} className="col-span-3" required/>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="tipo" className="text-right">Tipo</label>
                            <Select name="tipo" required onValueChange={handleSelectChange} value={formData.tipo}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue />
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
                            {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
