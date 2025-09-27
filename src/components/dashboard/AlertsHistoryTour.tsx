
"use client";

import { useEffect, useImperativeHandle, forwardRef } from 'react';
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

const tourSteps: DriveStep[] = [
    { 
        element: '#alerts-history-list', 
        popover: { 
            title: 'Tu Historial de Alertas', 
            description: 'Aquí puedes ver todas las emergencias que has reportado. Cada tarjeta muestra el estado actual, la fecha y la ubicación.' 
        } 
    },
    {
        element: '#alert-card-example',
        popover: {
            title: 'Detalle de una Alerta',
            description: 'Verás el estado (como "En Camino" o "Finalizada"), la hora y un enlace para ver la ubicación en el mapa. Si la alerta aún está activa, puedes cancelarla desde aquí.'
        }
    },
    {
        popover: {
            title: '¡Listo!',
            description: 'Ahora sabes cómo consultar el estado de tus solicitudes de ayuda.',
        }
    }
];

export const AlertsHistoryTour = forwardRef((props, ref) => {
    const driverObj = driver({
        showProgress: true,
        popoverClass: 'driverjs-theme',
        nextBtnText: 'Siguiente',
        prevBtnText: 'Anterior',
        doneBtnText: 'Entendido',
        steps: tourSteps
    });

    const startTour = () => {
        driverObj.drive();
    };

    useImperativeHandle(ref, () => ({
        startTour
    }));

    useEffect(() => {
        const hasSeenTour = localStorage.getItem('hasSeenAlertsHistoryTour');
        if (!hasSeenTour) {
            const timer = setTimeout(() => {
                startTour();
                localStorage.setItem('hasSeenAlertsHistoryTour', 'true');
            }, 1500);
            return () => clearTimeout(timer);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
});

AlertsHistoryTour.displayName = 'AlertsHistoryTour';

    