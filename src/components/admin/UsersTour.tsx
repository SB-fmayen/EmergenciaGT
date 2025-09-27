
"use client";

import { useEffect, useImperativeHandle, forwardRef } from 'react';
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

const tourSteps: DriveStep[] = [
    { 
        element: '#users-table-card', 
        popover: { 
            title: 'Gestión de Usuarios', 
            description: 'Esta tabla muestra todos los usuarios del panel (administradores, operadores y unidades). Desde aquí puedes asignar roles y estaciones.' 
        } 
    },
    { 
        element: '#users-table-card > div > table > thead > tr > th:nth-child(2)', 
        popover: { 
            title: 'Asignación de Roles', 
            description: 'Usa este menú desplegable para cambiar el rol de un usuario. Los "Admins" tienen acceso a todo. Los "Operadores" solo ven alertas de su estación. Las "Unidades" tienen una interfaz de misión especial.' 
        } 
    },
    { 
        element: '#users-table-card > div > table > thead > tr > th:nth-child(3)', 
        popover: { 
            title: 'Asignación de Estaciones/Unidades', 
            description: 'Aquí asignas un operador o una unidad a una estación específica. Esto es crucial para filtrar las alertas que cada uno puede ver.' 
        } 
    },
    {
        popover: {
            title: '¡Control Total!',
            description: 'La correcta gestión de usuarios y roles es fundamental para la seguridad y eficiencia del sistema.',
        }
    }
];

export const UsersTour = forwardRef((props, ref) => {
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
        const hasSeenTour = localStorage.getItem('hasSeenUsersTour');
        if (!hasSeenTour) {
            const timer = setTimeout(() => {
                startTour();
                localStorage.setItem('hasSeenUsersTour', 'true');
            }, 1500);
            return () => clearTimeout(timer);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
});

UsersTour.displayName = 'UsersTour';

    