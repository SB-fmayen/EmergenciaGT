
"use client";

import { useState, useEffect, useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import type { EnrichedAlert, AlertStatus, StationData } from "@/lib/types";

// Mapa de Estilos de Google Maps (los IDs se crean en la Google Cloud Console)
const MAP_STYLE_IDS = {
    light: 'YOUR_LIGHT_MODE_MAP_ID', // Reemplazar con tu ID de estilo de mapa claro
    dark: 'YOUR_DARK_MODE_MAP_ID'   // Reemplazar con tu ID de estilo de mapa oscuro
};
const DEFAULT_MAP_ID = 'YOUR_DEFAULT_MAP_ID'; // Un ID de mapa por defecto si los temas no están configurados

// --- Componente del Marcador de Alerta ---
const AlertMarker = ({ alert }: { alert: EnrichedAlert }) => {
    let bgColor = '#6b7280'; // gris por defecto
    let zIndex = 10;
    let pulsing = false;

    switch (alert.status) {
        case 'new':
            bgColor = '#ef4444'; // red-500
            zIndex = 100;
            pulsing = true;
            break;
        case 'assigned':
        case 'en_route':
        case 'on_scene':
            bgColor = '#3b82f6'; // blue-500
            zIndex = 50;
            break;
    }

    return (
        <div 
            className={`relative w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-lg`}
            style={{ backgroundColor: bgColor, zIndex: zIndex }}
        >
            {pulsing && <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse"></div>}
        </div>
    );
};

// --- Componente del Marcador de Estación ---
const StationMarker = () => (
    <div 
        className="relative w-7 h-7 bg-green-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg"
        style={{ zIndex: 5 }}
    >
        <p className="font-bold text-white text-sm">H</p>
    </div>
);

// --- Componente Principal del Mapa ---
interface AlertsMapProps {
    alerts: EnrichedAlert[];
    stations: StationData[];
    selectedAlert: EnrichedAlert | null;
    theme: string;
}

function MapWrapper({ alerts, stations, selectedAlert, theme }: AlertsMapProps) {
    const map = useMap();
    const [activeMarker, setActiveMarker] = useState<{ type: 'alert' | 'station'; id: string; } | null>(null);

    // Centra el mapa en la alerta seleccionada
    useEffect(() => {
        if (selectedAlert && map) {
            map.moveCamera({ center: selectedAlert.location, zoom: 15 });
        }
    }, [selectedAlert, map]);

    const activeAlert = useMemo(() => 
        (activeMarker?.type === 'alert') ? alerts.find(a => a.id === activeMarker.id) : null,
        [activeMarker, alerts]
    );

    const activeStation = useMemo(() => 
        (activeMarker?.type === 'station') ? stations.find(s => s.id === activeMarker.id) : null,
        [activeMarker, stations]
    );

    const mapId = theme === 'dark' ? MAP_STYLE_IDS.dark : MAP_STYLE_IDS.light;

    return (
        <Map
            defaultCenter={{ lat: 14.6349, lng: -90.5069 }}
            defaultZoom={12}
            gestureHandling={'greedy'}
            disableDefaultUI={true}
            mapId={mapId}
            className="w-full h-full border-none"
        >
            {/* Renderizar Marcadores de Alertas Activas */}
            {alerts.filter(a => !['resolved', 'cancelled', 'patient_attended'].includes(a.status)).map(alert => (
                <AdvancedMarker
                    key={alert.id}
                    position={alert.location}
                    onClick={() => setActiveMarker({ type: 'alert', id: alert.id })}
                >
                    <AlertMarker alert={alert} />
                </AdvancedMarker>
            ))}

            {/* Renderizar Marcadores de Estaciones */}
            {stations.map(station => (
                 station.location && (
                    <AdvancedMarker
                        key={station.id}
                        position={station.location}
                        onClick={() => setActiveMarker({ type: 'station', id: station.id })}
                    >
                        <StationMarker />
                    </AdvancedMarker>
                )
            ))}

            {/* Ventana de Información para Alerta Activa */}
            {activeAlert && (
                <InfoWindow
                    position={activeAlert.location}
                    onCloseClick={() => setActiveMarker(null)}
                >
                    <div className="p-2 bg-background text-foreground">
                        <h3 className="font-bold">Alerta: {activeAlert.id.substring(0,8)}</h3>
                        <p>Estado: {activeAlert.status}</p>
                        <p>Usuario: {activeAlert.isAnonymous ? "Anónimo" : (activeAlert.userInfo?.fullName || "Registrado")}</p>
                    </div>
                </InfoWindow>
            )}

            {/* Ventana de Información para Estación Activa */}
            {activeStation && activeStation.location && (
                 <InfoWindow
                    position={activeStation.location}
                    onCloseClick={() => setActiveMarker(null)}
                >
                    <div className="p-2 bg-background text-foreground">
                        <h3 className="font-bold">Estación: {activeStation.name}</h3>
                        <p>{activeStation.address}</p>
                    </div>
                </InfoWindow>
            )}
        </Map>
    );
}

// --- Proveedor de API y Componente de Exportación ---
export default function AlertsMap(props: AlertsMapProps) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        return (
            <div className="w-full h-full bg-red-100 flex items-center justify-center">
                <p className="text-red-700 font-bold">La clave de API de Google Maps no está configurada.</p>
            </div>
        );
    }

    return (
        <APIProvider apiKey={apiKey}>
            <MapWrapper {...props} />
        </APIProvider>
    );
}
