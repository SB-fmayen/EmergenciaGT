
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
});

interface LocationPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (coords: { lat: number; lng: number }) => void;
    initialPosition?: { lat: number; lng: number };
}

export function LocationPickerModal({ isOpen, onClose, onConfirm, initialPosition }: LocationPickerModalProps) {
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | undefined>(initialPosition);

    useEffect(() => {
        setSelectedLocation(initialPosition);
    }, [initialPosition]);

    const handleConfirm = () => {
        if (selectedLocation) {
            onConfirm(selectedLocation);
            onClose(); 
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            {/* Se toma control total del layout con flexbox */}
            <DialogContent className="max-w-4xl w-[90vw] h-[90vh] flex flex-col p-0">
                {/* 1. Cabecera con su propio padding */}
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Seleccionar Ubicación</DialogTitle>
                    <DialogDescription>
                        Usa el buscador o haz clic en el mapa para seleccionar la ubicación exacta.
                    </DialogDescription>
                </DialogHeader>

                {/* 2. Contenedor del mapa que crece para llenar el espacio */}
                <div className="flex-grow w-full relative">
                    <LocationPickerMap 
                        onLocationSelect={setSelectedLocation}
                        initialPosition={selectedLocation}
                    />
                </div>

                {/* 3. Pie de página con su propio padding */}
                <DialogFooter className="p-6 pt-4 flex-col sm:flex-col sm:justify-start items-stretch">
                     {selectedLocation && (
                        <div className="text-sm text-muted-foreground pb-4 text-center">
                            Coordenadas: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                        </div>
                    )}
                    <div className="flex w-full justify-end space-x-2">
                        <Button variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button onClick={handleConfirm} disabled={!selectedLocation}>
                            Confirmar Ubicación
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
