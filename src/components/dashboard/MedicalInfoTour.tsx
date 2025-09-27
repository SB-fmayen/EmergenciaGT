
"use client";

import { useEffect, useImperativeHandle, forwardRef } from 'react';
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

const tourSteps: DriveStep[] = [
    { 
        popover: { 
            title: 'Formulario de Información Médica', 
            description: 'Llenar esta información es crucial. Permite que los paramédicos sepan tus datos vitales antes de llegar, ahorrando tiempo valioso.' 
        } 
    },
    { 
        element: '#medical-info-personal', 
        popover: { 
            title: 'Datos Personales', 
            description: 'Ingresa tu nombre completo, edad y tipo de sangre. Son los datos básicos de identificación.' 
        } 
    },
    { 
        element: '#medical-info-history', 
        popover: { 
            title: 'Historial Médico', 
            description: 'Marca cualquier condición preexistente que tengas. Esto ayuda a los paramédicos a entender mejor tu situación.' 
        } 
    },
    { 
        element: '#medical-info-meds', 
        popover: { 
            title: 'Medicamentos', 
            description: 'Si tomas algún medicamento de forma regular, añádelo aquí.' 
        } 
    },
    { 
        element: '#medical-info-contacts', 
        popover: { 
            title: 'Contactos de Emergencia', 
            description: 'Agrega al menos una persona a quien podamos contactar en caso de una emergencia. Es muy importante.' 
        } 
    },
    { 
        element: '#medical-info-notes', 
        popover: { 
            title: 'Notas Adicionales', 
            description: 'Cualquier otra información que consideres importante, como alergias severas a medicamentos, puedes anotarla aquí.' 
        } 
    },
    {
        popover: {
            title: '¡Todo Listo!',
            description: 'Una vez completes el formulario, solo presiona "Guardar Información". Tus datos estarán seguros y solo serán accesibles en caso de una emergencia.',
        }
    }
];

export const MedicalInfoTour = forwardRef((props, ref) => {
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
        const hasSeenTour = localStorage.getItem('hasSeenMedicalInfoTour');
        if (!hasSeenTour) {
            const timer = setTimeout(() => {
                startTour();
                localStorage.setItem('hasSeenMedicalInfoTour', 'true');
            }, 1500);
            return () => clearTimeout(timer);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
});

MedicalInfoTour.displayName = 'MedicalInfoTour';

    