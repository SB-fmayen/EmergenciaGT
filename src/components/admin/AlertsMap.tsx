
'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { EnrichedAlert } from '@/app/(admin)/dashboard/admin/page';
import type { AlertStatus, StationData } from '@/lib/types';

// Arreglo para el ícono de Leaflet
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

// Ícono para Alertas
const createAlertIcon = (status: AlertStatus) => {
    let bgColor = '#6b7280'; // gris
    let size = 24;
    let pulsing = false;

    switch (status) {
        case 'new': bgColor = '#ef4444'; size = 32; pulsing = true; break;
        case 'assigned': bgColor = '#3b82f6'; size = 28; break;
        case 'en_route': bgColor = '#f59e0b'; size = 28; break;
        case 'on_scene': bgColor = '#8b5cf6'; size = 28; break;
    }
    
    return L.divIcon({
        html: `<div style="background-color: ${bgColor}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);" class="${pulsing ? 'animate-pulse' : ''}"></div>`,
        className: 'bg-transparent border-0',
        iconSize: [size, size],
        iconAnchor: [size / 2, size]
    });
};

// Ícono para Estaciones
const createStationIcon = () => {
  const size = 28;
  const bgColor = '#16a34a'; // green-600
  const iconHtml = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      background-color: ${bgColor};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      color: white;
      font-size: 18px;
      font-weight: bold;
      line-height: 1;
    ">
      H
    </div>`;

  return L.divIcon({
    html: iconHtml,
    className: 'bg-transparent border-0',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
};

const getStatusTextInSpanish = (status: AlertStatus) => {
    const statuses: Record<string, string> = {
        'new': 'Nueva',
        'assigned': 'Asignada',
        'en_route': 'En Ruta',
        'on_scene': 'En el Lugar',
        'attending': 'Atendiendo',
        'transporting': 'Trasladando',
        'patient_attended': 'Atendido en Lugar',
        'resolved': 'Finalizada en Hospital',
        'cancelled': 'Cancelada',
    };
    return statuses[status] || status;
};


interface AlertsMapProps {
    alerts: EnrichedAlert[];
    stations: StationData[];
    selectedAlert: EnrichedAlert | null;
    theme: string;
}

const mapThemes = {
    light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
};

export default function AlertsMap({ alerts, stations, selectedAlert, theme }: AlertsMapProps) {
    const mapRef = useRef<L.Map | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const alertMarkersRef = useRef<{ [key: string]: L.Marker }>({});
    const stationMarkersRef = useRef<{ [key: string]: L.Marker }>({});
    const tileLayerRef = useRef<L.TileLayer | null>(null);

    // Inicializa el mapa
    useEffect(() => {
        if (containerRef.current && !mapRef.current) {
            const map = L.map(containerRef.current!).setView([14.6349, -90.5069], 13);
            tileLayerRef.current = L.tileLayer(mapThemes[theme as keyof typeof mapThemes] || mapThemes.dark, {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            }).addTo(map);
            mapRef.current = map;
        }
    }, [theme]);

    // Cambia el tema del mapa
    useEffect(() => {
        if (tileLayerRef.current) {
            tileLayerRef.current.setUrl(mapThemes[theme as keyof typeof mapThemes] || mapThemes.dark);
        }
    }, [theme]);

    // Actualiza los marcadores de ALERTA
    useEffect(() => {
        if (!mapRef.current) return;
        const currentMarkerIds = Object.keys(alertMarkersRef.current);
        const alertIds = alerts.map(a => a.id);

        currentMarkerIds.forEach(markerId => {
            if (!alertIds.includes(markerId)) {
                alertMarkersRef.current[markerId]?.remove();
                delete alertMarkersRef.current[markerId];
            }
        });

        alerts.forEach(alert => {
            const isFinalState = ['resolved', 'cancelled', 'patient_attended'].includes(alert.status);
            if (isFinalState) {
                if (alertMarkersRef.current[alert.id]) {
                    alertMarkersRef.current[alert.id].remove();
                    delete alertMarkersRef.current[alert.id];
                }
                return;
            }

            const popupContent = `
                <div style="color: #333; font-family: sans-serif;">
                    <b>Alerta: ${alert.id.substring(0,8)}</b><br>
                    Tipo: ${alert.type || 'Pánico General'}<br>
                    Usuario: ${alert.isAnonymous ? 'Anónimo' : (alert.userInfo?.fullName || 'Registrado')}<br>
                    Estado: ${getStatusTextInSpanish(alert.status)}
                </div>
            `;

            if (alertMarkersRef.current[alert.id]) {
                alertMarkersRef.current[alert.id].setLatLng([alert.location.latitude, alert.location.longitude]);
                alertMarkersRef.current[alert.id].setIcon(createAlertIcon(alert.status));
                alertMarkersRef.current[alert.id].setPopupContent(popupContent);
            } else {
                const marker = L.marker([alert.location.latitude, alert.location.longitude], {
                    icon: createAlertIcon(alert.status),
                    zIndexOffset: 1000 // Las alertas siempre encima
                }).addTo(mapRef.current!);
                marker.bindPopup(popupContent);
                alertMarkersRef.current[alert.id] = marker;
            }
        });
    }, [alerts]);

    // Añade/actualiza los marcadores de ESTACIÓN
    useEffect(() => {
        if (!mapRef.current) return;

        stations.forEach(station => {
            if (!station.location?.latitude || !station.location?.longitude) return;

            const popupContent = `
                <div style="color: #333; font-family: sans-serif;">
                    <b>Estación: ${station.name}</b><br>
                    ${station.address || ''}
                </div>
            `;

            if (stationMarkersRef.current[station.id]) {
                stationMarkersRef.current[station.id].setLatLng([station.location.latitude, station.location.longitude]);
                stationMarkersRef.current[station.id].setPopupContent(popupContent);
            } else {
                const stationMarker = L.marker([station.location.latitude, station.location.longitude], {
                    icon: createStationIcon(),
                    zIndexOffset: 500 // Z-index más bajo para que no tapen las alertas
                }).addTo(mapRef.current!);
                
                stationMarker.bindPopup(popupContent);
                stationMarkersRef.current[station.id] = stationMarker;
            }
        });

    }, [stations]);

    // Centra el mapa en la alerta seleccionada
    useEffect(() => {
        if (selectedAlert && mapRef.current) {
            // Corrected typo: selected-alert → selectedAlert
            mapRef.current.flyTo([selectedAlert.location.latitude, selectedAlert.location.longitude], 15, { animate: true, duration: 1 });
            const marker = alertMarkersRef.current[selectedAlert.id];
            if (marker) {
                setTimeout(() => marker.openPopup(), 500);
            }
        }
    }, [selectedAlert]);

    return (
        <div ref={containerRef} className="w-full h-full z-0" />
    );
}
