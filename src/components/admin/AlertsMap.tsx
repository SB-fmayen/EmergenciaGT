
'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { EnrichedAlert } from '@/app/(admin)/dashboard/admin/page'; // Ajustar ruta si es necesario
import type { AlertStatus } from '@/lib/types';

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

// Función para crear íconos personalizados basados en el estado
const createAlertIcon = (status: AlertStatus) => {
    let bgColor = '#6b7280'; // gris por defecto (cancelled/resolved)
    let size = 24;
    let pulsing = false;

    switch (status) {
        case 'new':
            bgColor = '#ef4444'; // red-500
            size = 32;
            pulsing = true;
            break;
        case 'assigned':
            bgColor = '#3b82f6'; // blue-500
            size = 28;
            break;
        case 'en_route':
            bgColor = '#f59e0b'; // amber-500
            size = 28;
            break;
        case 'on_scene':
            bgColor = '#8b5cf6'; // violet-500
            size = 28;
            break;
    }
    
    const pulseClass = pulsing ? 'animate-pulse' : '';

    return L.divIcon({
        html: `<div style="background-color: ${bgColor}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);" class="${pulseClass}"></div>`,
        className: 'bg-transparent border-0',
        iconSize: [size, size],
        iconAnchor: [size / 2, size]
    });
};


interface AlertsMapProps {
    alerts: EnrichedAlert[];
    selectedAlert: EnrichedAlert | null;
    theme: string;
}

const mapThemes = {
    light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
};

export default function AlertsMap({ alerts, selectedAlert, theme }: AlertsMapProps) {
    const mapRef = useRef<L.Map | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const markersRef = useRef<{ [key: string]: L.Marker }>({});
    const tileLayerRef = useRef<L.TileLayer | null>(null);

    // Inicializa el mapa
    useEffect(() => {
        if (containerRef.current && !mapRef.current) {
            const map = L.map(containerRef.current!).setView([14.6349, -90.5069], 13);
            
            tileLayerRef.current = L.tileLayer(mapThemes[theme as keyof typeof mapThemes] || mapThemes.dark, {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            }).addTo(map);

            mapRef.current = map;
        }
    }, [theme]);

    // Cambia el tema del mapa cuando el tema global cambia
    useEffect(() => {
        if (tileLayerRef.current) {
            tileLayerRef.current.setUrl(mapThemes[theme as keyof typeof mapThemes] || mapThemes.dark);
        }
    }, [theme]);

    // Actualiza los marcadores cuando cambian las alertas
    useEffect(() => {
        if (!mapRef.current) return;
        
        const currentMarkerIds = Object.keys(markersRef.current);
        const alertIds = alerts.map(a => a.id);

        // Remover marcadores de alertas que ya no están en la lista (resueltas, etc.)
        currentMarkerIds.forEach(markerId => {
            if (!alertIds.includes(markerId)) {
                if (markersRef.current[markerId]) {
                    markersRef.current[markerId].remove();
                    delete markersRef.current[markerId];
                }
            }
        });

        // Añadir o actualizar marcadores
        alerts.forEach(alert => {
             if (alert.status !== 'resolved' && alert.status !== 'cancelled') {
                const popupContent = `
                    <div style="color: #333;">
                        <b>Alerta: ${alert.id.substring(0,8)}</b><br>
                        Usuario: ${alert.isAnonymous ? 'Anónimo' : (alert.userInfo?.fullName || 'Registrado')}<br>
                        Estado: ${alert.status}
                    </div>
                `;

                if (markersRef.current[alert.id]) {
                    // Actualizar posición, ícono y popup si ya existe
                    markersRef.current[alert.id].setLatLng([alert.location.latitude, alert.location.longitude]);
                    markersRef.current[alert.id].setIcon(createAlertIcon(alert.status));
                    markersRef.current[alert.id].setPopupContent(popupContent);
                } else {
                    // Crear nuevo marcador si no existe
                    const marker = L.marker([alert.location.latitude, alert.location.longitude], {
                        icon: createAlertIcon(alert.status)
                    }).addTo(mapRef.current!);
                    marker.bindPopup(popupContent);
                    markersRef.current[alert.id] = marker;
                }
             } else {
                // Si la alerta está resuelta o cancelada y tiene un marcador, removerlo
                if (markersRef.current[alert.id]) {
                    markersRef.current[alert.id].remove();
                    delete markersRef.current[alert.id];
                }
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
            
            const marker = markersRef.current[selectedAlert.id];
            if (marker) {
                 // Pequeño delay para asegurar que el flyTo no sea interrumpido
                 setTimeout(() => {
                    marker.openPopup();
                }, 500);
            }
        }
    }, [selectedAlert]);

    return (
        <div ref={containerRef} className="w-full h-full z-0" />
    );
}
