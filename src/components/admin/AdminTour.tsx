
"use client";

import { useEffect } from 'react';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useIsNewUser } from '@/hooks/useIsNewUser';
import { useAuth } from '@/app/layout';

export function AdminTour() {
    const isNewUser = useIsNewUser();
    const { loading: authLoading } = useAuth();

    useEffect(() => {
        if (authLoading) return;
        
        // Solo corre el tour si el usuario es nuevo y no estamos en la carga inicial de auth.
        if (isNewUser) {
            const driverObj = driver({
                showProgress: true,
                popoverClass: 'driverjs-theme', // Clase personalizada para estilos
                nextBtnText: 'Siguiente',
                prevBtnText: 'Anterior',
                doneBtnText: 'Finalizar',
                showButtons: ['next', 'previous', 'close'],
                steps: [
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
                            description: 'Ya conoces lo básico. Puedes volver a ver este tour borrando los datos de tu navegador si lo necesitas.',
                            showButtons: ['close', 'previous'],
                        }
                    }
                ]
            });

            // Pequeño delay para asegurar que todos los elementos del DOM estén listos.
            setTimeout(() => {
                driverObj.drive();
            }, 1500);
        }
    }, [isNewUser, authLoading]);

    return null; // Este componente no renderiza nada visible.
}
