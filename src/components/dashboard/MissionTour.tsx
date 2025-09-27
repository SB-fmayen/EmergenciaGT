
"use client";

import { useEffect, useImperativeHandle, forwardRef } from 'react';
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

const tourSteps: DriveStep[] = [
    { 
        element: '#mission-waiting', 
        popover: { 
            title: 'Panel de Misión - En Espera', 
            description: 'Esta es tu pantalla de espera. Cuando la central te asigne una emergencia, aparecerá aquí automáticamente. No necesitas recargar.' 
        },
        onhighlighted: (element, step, options) => {
            if (!document.querySelector('#mission-waiting')) {
                options.driver.moveNext();
            }
        }
    },
    { 
        element: '#mission-map', 
        popover: { 
            title: 'Mapa de la Misión', 
            description: '¡Misión recibida! Aquí verás la ubicación exacta del incidente. Puedes usar el botón de navegación para abrir la ruta en Google Maps.' 
        },
    },
    { 
        element: '#mission-patient-info', 
        popover: { 
            title: 'Información del Paciente', 
            description: 'Estos son los datos médicos que el usuario ha proporcionado. Revísalos para prepararte antes de llegar a la escena.' 
        } 
    },
    { 
        element: '#mission-status-buttons', 
        popover: { 
            title: 'Actualización de Estado', 
            description: 'Usa estos botones para mantener a la central informada en tiempo real sobre el progreso de la misión: "En Ruta", "En el Lugar", etc. Esto es crucial para la coordinación.' 
        } 
    },
    {
        popover: {
            title: '¡Listo para la Acción!',
            description: 'Ya conoces tu panel de misión. Tu trabajo es vital. ¡Mantente seguro!',
        }
    }
];

export const MissionTour = forwardRef((props, ref) => {
    const driverObj = driver({
        showProgress: true,
        popoverClass: 'driverjs-theme',
        nextBtnText: 'Siguiente',
        prevBtnText: 'Anterior',
        doneBtnText: 'Finalizar',
        steps: tourSteps
    });

    const startTour = () => {
        // Check if there is an active mission to decide where to start
        const isWaiting = !!document.querySelector('#mission-waiting');
        driverObj.drive(isWaiting ? 0 : 1);
    };

    useImperativeHandle(ref, () => ({
        startTour
    }));

    useEffect(() => {
        const hasSeenTour = localStorage.getItem('hasSeenMissionTour');
        if (!hasSeenTour) {
            const timer = setTimeout(() => {
                startTour();
                localStorage.setItem('hasSeenMissionTour', 'true');
            }, 1500);
            return () => clearTimeout(timer);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
});

MissionTour.displayName = 'MissionTour';

    