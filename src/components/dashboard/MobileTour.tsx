
"use client";

import { useEffect, useImperativeHandle, forwardRef } from 'react';
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

const mobileTourSteps: DriveStep[] = [
    { 
        element: '#panic-button-section', 
        popover: { 
            title: '¡Bienvenido a EmergenciaGT!', 
            description: 'Este es tu botón de pánico principal. Mantenlo presionado por 2 segundos para enviar una alerta general de inmediato.' 
        } 
    },
    { 
        element: '#specific-emergencies-section', 
        popover: { 
            title: 'Emergencias Específicas', 
            description: 'Si tu emergencia es una de estas, presiona el botón correspondiente. Esto nos ayuda a enviar la ayuda adecuada más rápido.' 
        } 
    },
    { 
        element: '#quick-actions-section', 
        popover: { 
            title: 'Acciones Rápidas', 
            description: 'Desde aquí puedes consultar tu historial de alertas o registrar y actualizar tu información médica. ¡Es muy importante tenerla al día!' 
        } 
    },
    {
        popover: {
            title: '¡Estás listo!',
            description: 'Esperamos que nunca lo necesites, pero ahora sabes cómo usar la app. Mantente a salvo.',
        }
    }
];

export const MobileTour = forwardRef((props, ref) => {

    const driverObj = driver({
        showProgress: true,
        popoverClass: 'driverjs-theme',
        nextBtnText: 'Siguiente',
        prevBtnText: 'Anterior',
        doneBtnText: 'Entendido',
        steps: mobileTourSteps
    });

    const startTour = () => {
        driverObj.drive();
    }

    useImperativeHandle(ref, () => ({
        startTour
    }));

    useEffect(() => {
        const hasSeenTour = localStorage.getItem('hasSeenMobileTour');
        if (!hasSeenTour) {
            const timer = setTimeout(() => {
                startTour();
                localStorage.setItem('hasSeenMobileTour', 'true');
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    return null;
});

MobileTour.displayName = 'MobileTour';
