
"use client";

import { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import type { EnrichedAlert, StationData } from "@/lib/types";

// --- Helper para normalizar la ubicación ---
// Crea siempre un objeto nuevo para evitar problemas con objetos de solo lectura.
const normalizeLocation = (location: any): { lat: number; lng: number } | null => {
    if (!location) return null;
    // Si el formato es correcto, crea un nuevo objeto para evitar la mutación de props.
    if (typeof location.lat === 'number' && typeof location.lng === 'number') {
        return { lat: location.lat, lng: location.lng }; 
    }
    if (typeof location.latitude === 'number' && typeof location.longitude === 'number') {
        return { lat: location.latitude, lng: location.longitude }; // Formato de Firestore
    }
    if (typeof location._lat === 'number' && typeof location._long === 'number') {
        return { lat: location._lat, lng: location._long }; // Otro formato común
    }
    console.warn("Formato de ubicación no reconocido:", location);
    return null;
};

// --- Estilos de Marcadores y Mapa ---
const markerStyles = {
    new: { bgColor: '#ef4444', zIndex: 100, pulsing: true },
    assigned: { bgColor: '#3b82f6', zIndex: 50, pulsing: false },
    en_route: { bgColor: '#3b82f6', zIndex: 50, pulsing: false },
    on_scene: { bgColor: '#3b82f6', zIndex: 50, pulsing: false },
    default: { bgColor: '#6b7280', zIndex: 10, pulsing: false }
};


// --- Componente Principal del Mapa ---
interface AlertsMapProps {
    alerts: EnrichedAlert[];
    stations: StationData[];
    selectedAlert: EnrichedAlert | null;
    theme?: string;
}

export default function AlertsMap({ alerts, stations, selectedAlert }: AlertsMapProps) {
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        // Unifica las librerías en todos los mapas para evitar errores.
        libraries: ['marker', 'places'],
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [activeMarker, setActiveMarker] = useState<{ type: 'alert' | 'station'; id: string; } | null>(null);

    const onMapLoad = useCallback((mapInstance: google.maps.Map) => setMap(mapInstance), []);
    const onMapUnmount = useCallback(() => setMap(null), []);

    // Centra el mapa cuando se selecciona una alerta
    useEffect(() => {
        if (selectedAlert && map) {
            const position = normalizeLocation(selectedAlert.location);
            if (position) {
                map.panTo(position);
                map.setZoom(15);
            }
        }
    }, [selectedAlert, map]);
    
    // Busca la data de la alerta o estación activa
    const activeAlertData = useMemo(() => activeMarker?.type === 'alert' ? alerts.find(a => a.id === activeMarker.id) : null, [activeMarker, alerts]);
    const activeStationData = useMemo(() => activeMarker?.type === 'station' ? stations.find(s => s.id === activeMarker.id) : null, [activeMarker, stations]);

    // Normaliza la posición para la InfoWindow
    const activeAlertPosition = activeAlertData ? normalizeLocation(activeAlertData.location) : null;
    const activeStationPosition = activeStationData ? normalizeLocation(activeStationData.location) : null;

    if (loadError) return <div className="flex items-center justify-center w-full h-full">Error al cargar el mapa.</div>;
    if (!isLoaded) return <div className="flex items-center justify-center w-full h-full">Cargando Mapa...</div>;

    // Se necesita una referencia a `google.maps` que solo está disponible después de cargar
    const StationMarkerIcon = {
        path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
        fillColor: "#16a34a",
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: "#ffffff",
        scale: 1.5,
        anchor: new google.maps.Point(12, 24),
    };

    return (
        <GoogleMap
            mapContainerClassName="w-full h-full"
            center={{ lat: 14.6349, lng: -90.5069 }}
            zoom={12}
            onLoad={onMapLoad}
            onUnmount={onMapUnmount}
            options={{ disableDefaultUI: true, gestureHandling: 'greedy' }}
        >
            {/* Renderizar Marcadores de Alertas */}
            {alerts.filter(a => !['resolved', 'cancelled', 'patient_attended'].includes(a.status)).map(alert => {
                const position = normalizeLocation(alert.location);
                if (!position) return null;

                const style = markerStyles[alert.status as keyof typeof markerStyles] || markerStyles.default;
                const icon = { path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: style.bgColor, fillOpacity: 1, strokeColor: 'white', strokeWeight: 2 };

                return (
                    <Fragment key={alert.id}>
                        {style.pulsing && (
                            <Marker
                                position={position}
                                clickable={false}
                                zIndex={style.zIndex - 1}
                                icon={{ ...icon, scale: 14, fillOpacity: 0.4, strokeWeight: 0 }}
                            />
                        )}
                        <Marker
                            position={position}
                            icon={icon}
                            zIndex={style.zIndex}
                            onClick={() => setActiveMarker({ type: 'alert', id: alert.id })}
                        />
                    </Fragment>
                );
            })}

            {/* Renderizar Marcadores de Estaciones */}
            {stations.map(station => {
                 const position = normalizeLocation(station.location);
                 if (!position) return null;
                 return <Marker key={station.id} position={position} icon={StationMarkerIcon} onClick={() => setActiveMarker({ type: 'station', id: station.id })} />;
            })}
            
            {/* Ventanas de Información */}
            {activeAlertData && activeAlertPosition && (
                <InfoWindow position={activeAlertPosition} onCloseClick={() => setActiveMarker(null)}>
                    <div className="p-1"><h3 className="font-bold">Alerta: {activeAlertData.id.substring(0, 8)}</h3><p>Estado: {activeAlertData.status}</p><p>Usuario: {activeAlertData.isAnonymous ? "Anónimo" : (activeAlertData.userInfo?.fullName || "Registrado")}</p></div>
                </InfoWindow>
            )}
            {activeStationData && activeStationPosition && (
                 <InfoWindow position={activeStationPosition} onCloseClick={() => setActiveMarker(null)}>
                    <div className="p-1"><h3 className="font-bold">Estación: {activeStationData.name}</h3><p>{activeStationData.address}</p></div>
                </InfoWindow>
            )}
        </GoogleMap>
    );
}
