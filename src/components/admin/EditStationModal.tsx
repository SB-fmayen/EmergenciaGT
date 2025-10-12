
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
import { useToast } from "@/hooks/use-toast";
import { Loader2, Link as LinkIcon } from "lucide-react";
import { updateStation } from "@/app/(admin)/dashboard/stations/actions";
import type { StationData } from "@/lib/types";


interface EditStationModalProps {
    isOpen: boolean;
    onClose: () => void;
    station: StationData;
}

export function EditStationModal({ isOpen, onClose, station }: EditStationModalProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Sincronizar el estado del formulario si la estación cambia
    const [formData, setFormData] = useState({
        name: station.name,
        address: station.address,
        latitude: station.location.latitude.toString(),
        longitude: station.location.longitude.toString()
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: station.name,
                address: station.address,
                latitude: station.location.latitude.toString(),
                longitude: station.location.longitude.toString()
            });
        }
    }, [isOpen, station]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }

    const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        
        const formPayload = new FormData();
        formPayload.append('name', formData.name);
        formPayload.append('address', formData.address);
        formPayload.append('latitude', formData.latitude);
        formPayload.append('longitude', formData.longitude);

        const result = await updateStation(station.id, formPayload);

        if (result.success) {
            toast({ title: "Éxito", description: "Estación actualizada correctamente." });
            onClose();
        } else {
            toast({ title: "Error al actualizar", description: result.error, variant: "destructive" });
        }

        setIsSubmitting(false);
    }
    
    const handleMapLinkPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
        const pastedText = event.clipboardData.getData('text');
        const latLongMatch = pastedText.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (latLongMatch) {
          event.preventDefault();
          const lat = latLongMatch[1];
          const lng = latLongMatch[2];
          setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
          toast({ title: "Coordenadas extraídas", description: "Se han rellenado los campos de latitud y longitud." });
        }
      }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                 <form onSubmit={handleFormSubmit}>
                    <DialogHeader>
                        <DialogTitle>Editar Estación</DialogTitle>
                        <DialogDescription>
                            Modifica los detalles de la estación. Haz clic en guardar cuando termines.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="name" className="text-right">Nombre</label>
                            <Input id="name" name="name" value={formData.name} onChange={handleInputChange} className="col-span-3" required/>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="address" className="text-right">Dirección</label>
                            <Input id="address" name="address" value={formData.address} onChange={handleInputChange} className="col-span-3" required/>
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="mapLink" className="text-right">Enlace</label>
                             <Input
                                id="mapLink"
                                name="mapLink"
                                type="text"
                                placeholder="Pega enlace de Maps"
                                onPaste={handleMapLinkPaste}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="latitude" className="text-right">Latitud</label>
                            <Input id="latitude" name="latitude" type="number" step="any" value={formData.latitude} onChange={handleInputChange} className="col-span-3" required/>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="longitude" className="text-right">Longitud</label>
                            <Input id="longitude" name="longitude" type="number" step="any" value={formData.longitude} onChange={handleInputChange} className="col-span-3" required/>
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
