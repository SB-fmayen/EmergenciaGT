
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
import { Loader2, MapPin } from "lucide-react";
import { updateStation } from "@/app/(admin)/dashboard/stations/actions";
import type { StationData } from "@/lib/types";
import { LocationPickerModal } from "./LocationPickerModal";


interface EditStationModalProps {
    isOpen: boolean;
    onClose: () => void;
    station: StationData;
}

export function EditStationModal({ isOpen, onClose, station }: EditStationModalProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    
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
    
    // 1. Renombrado para consistencia
    const handleLocationConfirm = (coords: { lat: number; lng: number }) => {
        setFormData(prev => ({
            ...prev,
            latitude: coords.lat.toString(),
            longitude: coords.lng.toString()
        }));
        // El modal del mapa ya se cierra solo, por lo que esta línea no es necesaria:
        // setIsPickerOpen(false); 
        toast({ title: "Ubicación Actualizada", description: "Las nuevas coordenadas han sido seleccionadas."});
    };


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
    

    return (
        <>
        <LocationPickerModal 
            isOpen={isPickerOpen}
            onClose={() => setIsPickerOpen(false)}
            onConfirm={handleLocationConfirm} // 2. Propiedad corregida
            initialPosition={{ lat: parseFloat(formData.latitude), lng: parseFloat(formData.longitude) }}
        />
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
                        <div>
                            <label className="text-sm font-medium text-right col-span-1 pr-4">Ubicación</label>
                            <div className="col-span-3">
                                 <Button type="button" variant="outline" className="w-full mt-2" onClick={() => setIsPickerOpen(true)}>
                                    <MapPin className="mr-2 h-4 w-4" />
                                    Cambiar Ubicación en Mapa
                                </Button>
                                <div className="mt-2 text-sm text-muted-foreground text-center bg-muted p-2 rounded-md">
                                     Lat: {parseFloat(formData.latitude).toFixed(5)}, Lon: {parseFloat(formData.longitude).toFixed(5)}
                                </div>
                            </div>
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
        </>
    )
}
