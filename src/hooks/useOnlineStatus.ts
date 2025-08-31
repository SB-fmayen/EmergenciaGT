
"use client";

import { useState, useEffect } from 'react';

/**
 * Un hook personalizado que detecta y devuelve el estado de la conexión a internet del navegador.
 * Se actualiza automáticamente cuando el estado de la conexión cambia.
 * @returns {boolean} - `true` si el navegador está en línea, `false` si está sin conexión.
 */
export function useOnlineStatus() {
  // Inicializa el estado con el valor actual de navigator.onLine, 
  // o `true` como valor predeterminado seguro si el código se ejecuta en un entorno sin navegador (SSR).
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? window.navigator.onLine : true);

  useEffect(() => {
    // Si el código no se ejecuta en un navegador, no hacer nada.
    if (typeof window === 'undefined') {
      return;
    }

    // Funciones para actualizar el estado cuando el navegador se conecta o desconecta.
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Añade los event listeners para los eventos 'online' y 'offline'.
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Función de limpieza que se ejecuta cuando el componente se desmonta.
    // Elimina los event listeners para evitar fugas de memoria.
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []); // El array de dependencias vacío asegura que el efecto solo se ejecute una vez al montar el componente.

  return isOnline;
}
