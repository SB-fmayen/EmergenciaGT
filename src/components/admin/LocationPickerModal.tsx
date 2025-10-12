
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import L from "leaflet";

const LocationMap = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-muted flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
});

interface LocationPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLocationSelect: (coords: { lat: number; lng: number }) => void;
    initialPosition?: { lat: number; lng: number };
}

export function LocationPickerModal({ isOpen, onClose, onLocationSelect, initialPosition }: LocationPickerModalProps) {
    const [selectedLocation, setSelectedLocation] = useState<L.LatLng | null>(initialPosition ? L.latLng(initialPosition.lat, initialPosition.lng) : null);

    const handleConfirm = () => {
        if (selectedLocation) {
            onLocationSelect({ lat: selectedLocation.lat, lng: selectedLocation.lng });
        }
    };
    
    const handleMapClick = (e: L.LeafletMouseEvent) => {
        setSelectedLocation(e.latlng);
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Seleccionar Ubicación</DialogTitle>
                    <DialogDescription>
                        Haz clic en el mapa para seleccionar la ubicación exacta de la estación.
                    </DialogDescription>
                </DialogHeader>
                <div className="h-[50vh] w-full rounded-md overflow-hidden border">
                    <LocationMap 
                        onMapClick={handleMapClick}
                        markerPosition={selectedLocation}
                        initialPosition={initialPosition}
                    />
                </div>
                {selectedLocation && (
                    <div className="text-sm text-muted-foreground">
                        Coordenadas: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleConfirm} disabled={!selectedLocation}>
                        Confirmar Ubicación
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
