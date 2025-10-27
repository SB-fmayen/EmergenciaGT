
"use client";

import { useState, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';

// --- Helper para normalizar la ubicación ---
const normalizeLocation = (location: any): { lat: number; lng: number } | null => {
    if (!location) return null;
    if (typeof location.lat === 'number' && typeof location.lng === 'number') {
        return { lat: location.lat, lng: location.lng };
    }
    if (typeof location.latitude === 'number' && typeof location.longitude === 'number') {
        return { lat: location.latitude, lng: location.longitude };
    }
    if (typeof location._lat === 'number' && typeof location._long === 'number') {
        return { lat: location._lat, lng: location._long };
    }
    return null;
};

interface LocationPickerProps {
    onLocationSelect?: (location: { lat: number; lng: number }) => void;
    initialPosition?: any;
}

export default function LocationPickerMap({ onLocationSelect, initialPosition }: LocationPickerProps) {
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries: ['marker', 'places'], 
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
    const normalizedInitialPos = useMemo(() => normalizeLocation(initialPosition), [initialPosition]);
    const [markerPos, setMarkerPos] = useState(normalizedInitialPos);

    const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
            const newPos = { lat: event.latLng.lat(), lng: event.latLng.lng() };
            setMarkerPos(newPos);
            if (onLocationSelect) {
                onLocationSelect(newPos);
            }
        }
    }, [onLocationSelect]);

    const onAutocompleteLoad = useCallback((ac: google.maps.places.Autocomplete) => {
        setAutocomplete(ac);
    }, []);

    const onPlaceChanged = useCallback(() => {
        if (autocomplete) {
            const place = autocomplete.getPlace();
            if (place.geometry?.location) {
                const newPos = {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                };
                setMarkerPos(newPos);
                map?.panTo(newPos);
                map?.setZoom(17);
                if (onLocationSelect) {
                    onLocationSelect(newPos);
                }
            }
        }
    }, [autocomplete, map, onLocationSelect]);

    if (loadError) return <div className="flex items-center justify-center w-full h-full"><p className="text-red-700 font-bold">Error al cargar el mapa.</p></div>;

    // Se cambia la altura fija por h-full para que ocupe todo el espacio del contenedor padre.
    return (
        <div className="relative w-full h-full"> 
            {isLoaded && (
                 <Autocomplete
                    onLoad={onAutocompleteLoad}
                    onPlaceChanged={onPlaceChanged}
                    options={{ componentRestrictions: { country: 'gt' } }}
                 >
                    <input
                        type="text"
                        placeholder="Buscar una dirección o lugar..."
                        className="absolute top-3 left-1/2 -translate-x-1/2 z-10 w-[90%] max-w-md px-4 py-2 text-gray-800 bg-white border border-gray-300 rounded-md shadow-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                 </Autocomplete>
            )}

            <div className="w-full h-full rounded-md overflow-hidden border">
                {!isLoaded ? (
                     <div className="w-full h-full bg-gray-200 flex items-center justify-center"><p>Cargando mapa...</p></div>
                ) : (
                    <GoogleMap
                        mapContainerClassName="w-full h-full"
                        center={markerPos || { lat: 14.6349, lng: -90.5069 }}
                        zoom={markerPos ? 17 : 12}
                        onClick={handleMapClick}
                        onLoad={setMap}
                        options={{
                            disableDefaultUI: true,
                            gestureHandling: 'greedy',
                        }}
                    >
                        {markerPos && <Marker position={markerPos} draggable={true} onDragEnd={handleMapClick} />}
                    </GoogleMap>
                )}
            </div>
        </div>
    );
}
