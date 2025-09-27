
"use client";

import { useEffect, useImperativeHandle, forwardRef } from 'react';
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

const tourSteps: DriveStep[] = [
    { 
        element: '#analytics-header', 
        popover: { 
            title: 'Página de Analíticas', 
            description: 'Esta sección te ofrece una vista detallada del rendimiento y las tendencias de las operaciones.' 
        } 
    },
    { 
        element: '#analytics-date-filter', 
        popover: { 
            title: 'Filtro por Fecha', 
            description: 'Puedes cambiar el rango de fechas para analizar los datos de un período específico, como los últimos 7 o 30 días.' 
        } 
    },
    { 
        element: '#analytics-kpis', 
        popover: { 
            title: 'Indicadores Clave', 
            description: 'Aquí encontrarás métricas importantes como el total de alertas, el tiempo promedio de respuesta y el tipo de emergencia más común.' 
        } 
    },
    { 
        element: '#analytics-activity-chart', 
        popover: { 
            title: 'Gráfico de Actividad', 
            description: 'Este gráfico muestra el volumen de alertas recibidas por día, ayudándote a identificar los días de mayor actividad.' 
            } 
    },
    { 
        element: '#analytics-type-chart', 
        popover: { 
            title: 'Gráfico por Tipo', 
            description: 'Visualiza la distribución de emergencias según su tipo, como accidentes, incendios o emergencias médicas.' 
        } 
    },
    {
        popover: {
            title: '¡Análisis Completo!',
            description: 'Has explorado la sección de analíticas. Usa esta información para tomar decisiones y mejorar la eficiencia.',
        }
    }
];

export const AnalyticsTour = forwardRef((props, ref) => {
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
        const hasSeenTour = localStorage.getItem('hasSeenAnalyticsTour');
        if (!hasSeenTour) {
            const timer = setTimeout(() => {
                startTour();
                localStorage.setItem('hasSeenAnalyticsTour', 'true');
            }, 1500);
            return () => clearTimeout(timer);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
});

AnalyticsTour.displayName = 'AnalyticsTour';

    