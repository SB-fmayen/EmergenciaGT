
"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Arreglo para el ícono de Leaflet que a veces no se carga correctamente en Next.js
const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = defaultIcon;

interface LocationPickerMapProps {
    onMapClick: (event: L.LeafletMouseEvent) => void;
    markerPosition: L.LatLng | null;
    initialPosition?: { lat: number, lng: number };
}

export default function LocationPickerMap({ onMapClick, markerPosition, initialPosition }: LocationPickerMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);

    // Inicializar el mapa
    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            const map = L.map(mapContainerRef.current, {
                center: initialPosition ? [initialPosition.lat, initialPosition.lng] : [14.6349, -90.5069], // Guatemala City
                zoom: initialPosition ? 15 : 13,
            });

            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            }).addTo(map);
            
            map.on('click', onMapClick);
            mapRef.current = map;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialPosition]);

    // Actualizar el marcador
    useEffect(() => {
        if (mapRef.current && markerPosition) {
            if (!markerRef.current) {
                markerRef.current = L.marker(markerPosition).addTo(mapRef.current);
            } else {
                markerRef.current.setLatLng(markerPosition);
            }
        }
    }, [markerPosition]);

    return <div ref={mapContainerRef} className="w-full h-full z-0" />;
}
