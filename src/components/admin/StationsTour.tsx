
"use client";

import { useEffect, useImperativeHandle, forwardRef } from 'react';
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

const tourSteps: DriveStep[] = [
    { 
        element: '#stations-add-panel', 
        popover: { 
            title: 'Añadir Nueva Estación', 
            description: 'En este panel puedes registrar nuevas estaciones de bomberos o paramédicos en el sistema. Simplemente completa el formulario y haz clic en "Agregar Estación".' 
        } 
    },
    { 
        element: '#stations-list-panel', 
        popover: { 
            title: 'Lista de Estaciones', 
            description: 'Aquí se muestran todas las estaciones que has registrado. Para cada una, puedes ver sus detalles, editarla, eliminarla y gestionar sus unidades.' 
        } 
    },
    {
        popover: {
            title: '¡Gestión Completa!',
            description: 'Desde aquí controlas la infraestructura física de tu red de emergencias. Mantener esta información actualizada es clave.',
        }
    }
];

export const StationsTour = forwardRef((props, ref) => {
    const driverObj = driver({
        showProgress: true,
        popoverClass: 'driverjs-theme',
        nextBtnText: 'Siguiente',
        prevBtnText: 'Anterior',
        doneBtnText: 'Finalizar',
        steps: tourSteps
    });

    const startTour = () => {
        driverObj.drive();
    };

    useImperativeHandle(ref, () => ({
        startTour
    }));

    useEffect(() => {
        const hasSeenTour = localStorage.getItem('hasSeenStationsTour');
        if (!hasSeenTour) {
            const timer = setTimeout(() => {
                startTour();
                localStorage.setItem('hasSeenStationsTour', 'true');
            }, 1500);
            return () => clearTimeout(timer);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
});

StationsTour.displayName = 'StationsTour';

    