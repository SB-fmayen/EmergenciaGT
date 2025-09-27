
"use client";

import { useEffect } from 'react';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useAuth } from '@/app/layout';

export function MobileTour() {
    const { user, loading: authLoading } = useAuth();

    useEffect(() => {
        if (authLoading || !user) return;
        
        const driverObj = driver({
            showProgress: true,
            popoverClass: 'driverjs-theme', // Clase personalizada para estilos
            nextBtnText: 'Siguiente',
            prevBtnText: 'Anterior',
            doneBtnText: 'Entendido',
            steps: [
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
            ]
        });

        setTimeout(() => {
            driverObj.drive();
        }, 1500);

    }, [authLoading, user]);

    return null;
}
