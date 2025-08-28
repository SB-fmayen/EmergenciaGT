
'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

export default function AlertsMap() {
    // Coordenadas de ejemplo para centrar el mapa (Ciudad de Guatemala)
    const position: [number, number] = [14.634915, -90.506882];
    const mapRef = useRef<L.Map | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Inicializa el mapa solo si el contenedor existe y el mapa no ha sido creado.
        if (containerRef.current && !mapRef.current) {
            const map = L.map(containerRef.current!).setView(position, 13);
            
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            }).addTo(map);

            L.marker(position).addTo(map)
                .bindPopup('Una alerta de emergencia aparecería aquí.');

            mapRef.current = map;
        }

        // Función de limpieza para destruir la instancia del mapa cuando el componente se desmonte.
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // El array de dependencias vacío asegura que esto se ejecute solo una vez.


    return (
        <div ref={containerRef} className="w-full h-full z-0" />
    );
}

