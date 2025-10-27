
"use client";

import { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';

interface LocationPickerProps {
    onLocationSelect: (location: { lat: number; lng: number }) => void;
    initialPosition?: { lat: number; lng: number };
    theme?: string;
}

// --- Componente Interno del Mapa ---
function PickerMap({ onLocationSelect, initialPosition, theme }: LocationPickerProps) {
    const [markerPos, setMarkerPos] = useState(initialPosition);
    const map = useMap();

    useEffect(() => {
        // Si se proporciona una posición inicial (modo de edición), mueve la cámara allí.
        if (initialPosition && map) {
            map.moveCamera({ center: initialPosition, zoom: 15 });
        }
    }, [initialPosition, map]);

    const handleMapClick = (event: google.maps.MapMouseEvent) => {
        if (event.detail.latLng) {
            const newPos = { lat: event.detail.latLng.lat, lng: event.detail.latLng.lng };
            setMarkerPos(newPos);
            onLocationSelect(newPos);
        }
    };
    
    const mapId = theme === 'dark' ? process.env.NEXT_PUBLIC_GM_DARK_MAP_ID : process.env.NEXT_PUBLIC_GM_LIGHT_MAP_ID;

    return (
        <Map
            defaultCenter={initialPosition || { lat: 14.6349, lng: -90.5069 }}
            defaultZoom={initialPosition ? 15 : 12}
            gestureHandling={'greedy'}
            disableDefaultUI
            mapId={mapId || process.env.NEXT_PUBLIC_GM_DEFAULT_MAP_ID}
            onClick={handleMapClick}
            className="w-full h-full rounded-md border border-border"
        >
            {markerPos && (
                <AdvancedMarker position={markerPos} />
            )}
        </Map>
    );
}

// --- Componente de Exportación Principal ---
export default function LocationPickerMap(props: LocationPickerProps) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        return (
            <div className="w-full h-48 bg-red-100 flex items-center justify-center rounded-md">
                <p className="text-red-700 font-bold">La clave de API de Google Maps no está configurada.</p>
            </div>
        );
    }

    return (
        <div className="w-full h-64 md:h-80 rounded-md overflow-hidden">
            <APIProvider apiKey={apiKey}>
                <PickerMap {...props} />
            </APIProvider>
        </div>
    );
}
