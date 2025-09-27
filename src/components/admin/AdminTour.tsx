
"use client";

import { useEffect, useImperativeHandle, forwardRef } from 'react';
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

const adminTourSteps: DriveStep[] = [
    { 
        element: '#admin-header', 
        popover: { 
            title: 'Bienvenido a la Consola de Emergencias', 
            description: 'Este es tu centro de mando. Te daremos un breve recorrido por las funciones principales.' 
        } 
    },
    { 
        element: '#admin-nav-links', 
        popover: { 
            title: 'Navegación Principal', 
            description: 'Si eres administrador, aquí puedes acceder a las analíticas, gestión de estaciones y usuarios.' 
        } 
    },
    { 
        element: '#kpi-cards', 
        popover: { 
            title: 'Indicadores Clave (KPIs)', 
            description: 'Un vistazo rápido al estado actual de las operaciones: alertas activas, en progreso y finalizadas.' 
        } 
    },
    { 
        element: '#alerts-list-panel', 
        popover: { 
            title: 'Lista de Alertas', 
            description: 'Aquí aparecen todas las alertas en tiempo real. Puedes filtrarlas y buscarlas. Haz clic en una para ver los detalles y asignarla.' 
            } 
    },
    { 
        element: '#map-panel', 
        popover: { 
            title: 'Mapa de Incidentes', 
            description: 'Visualiza la ubicación de todas las alertas activas en el mapa.' 
        } 
    },
    {
        popover: {
            title: '¡Listo para Empezar!',
            description: 'Ya conoces lo básico. Puedes volver a ver este tour haciendo clic en el ícono de ayuda (?).',
        }
    }
];

export const AdminTour = forwardRef((props, ref) => {
    const driverObj = driver({
        showProgress: true,
        popoverClass: 'driverjs-theme',
        nextBtnText: 'Siguiente',
        prevBtnText: 'Anterior',
        doneBtnText: 'Finalizar',
        steps: adminTourSteps
    });

    const startTour = () => {
        driverObj.drive();
    };

    useImperativeHandle(ref, () => ({
        startTour
    }));

    useEffect(() => {
        const hasSeenTour = localStorage.getItem('hasSeenAdminTour');
        if (!hasSeenTour) {
            const timer = setTimeout(() => {
                startTour();
                localStorage.setItem('hasSeenAdminTour', 'true');
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    return null;
});

AdminTour.displayName = 'AdminTour';
