
'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { EnrichedAlert } from '@/app/(admin)/dashboard/admin/page'; // Ajustar ruta si es necesario

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

// Función para crear íconos personalizados
const createAlertIcon = (severity: string | undefined) => {
    let bgColor = '#6b7280'; // gris por defecto
    let size = 24;
    switch (severity?.toLowerCase()) {
        case 'crítica':
            bgColor = '#ef4444'; // red-500
            size = 32;
            break;
        case 'alta':
            bgColor = '#f97316'; // orange-500
            size = 28;
            break;
        case 'media':
            bgColor = '#f59e0b'; // amber-500
            size = 24;
            break;
    }
    
    return L.divIcon({
        html: `<div style="background-color: ${bgColor}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);" class="animate-pulse"></div>`,
        className: 'bg-transparent border-0',
        iconSize: [size, size],
        iconAnchor: [size / 2, size]
    });
};


interface AlertsMapProps {
    alerts: EnrichedAlert[];
    selectedAlert: EnrichedAlert | null;
}

export default function AlertsMap({ alerts, selectedAlert }: AlertsMapProps) {
    const mapRef = useRef<L.Map | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const markersRef = useRef<L.Marker[]>([]);

    // Inicializa el mapa
    useEffect(() => {
        if (containerRef.current && !mapRef.current) {
            const map = L.map(containerRef.current!).setView([14.6349, -90.5069], 13);
            
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            }).addTo(map);

            mapRef.current = map;
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Actualiza los marcadores cuando cambian las alertas
    useEffect(() => {
        if (!mapRef.current) return;

        // Limpiar marcadores antiguos
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        // Añadir nuevos marcadores
        alerts.forEach(alert => {
            if (alert.status !== 'resolved' && alert.status !== 'cancelled') {
                const marker = L.marker([alert.location.latitude, alert.location.longitude], {
                    icon: createAlertIcon(alert.severity)
                }).addTo(mapRef.current!);

                marker.bindPopup(`
                    <b>Alerta: ${alert.id.substring(0,8)}</b><br>
                    Usuario: ${alert.userInfo?.fullName || 'Anónimo'}<br>
                    Estado: ${alert.status}
                `);

                markersRef.current.push(marker);
            }
        });
    }, [alerts]);

    // Centra el mapa en la alerta seleccionada
    useEffect(() => {
        if (selectedAlert && mapRef.current) {
            mapRef.current.flyTo([selectedAlert.location.latitude, selectedAlert.location.longitude], 15, {
                animate: true,
                duration: 1
            });
            // Abrir popup del marcador correspondiente
             const marker = markersRef.current.find(m => {
                const latLng = m.getLatLng();
                return latLng.lat === selectedAlert.location.latitude && latLng.lng === selectedAlert.location.longitude;
            });
            marker?.openPopup();
        }
    }, [selectedAlert]);

    return (
        <div ref={containerRef} className="w-full h-full z-0" />
    );
}

