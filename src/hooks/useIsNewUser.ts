
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/layout';

/**
 * Hook para determinar si un usuario es "nuevo".
 * Un usuario se considera nuevo si su tiempo de creación y su último inicio de sesión
 * son muy cercanos (menos de 15 segundos de diferencia).
 * Esto usualmente solo ocurre en la primera sesión de un usuario.
 * @returns {boolean} - `true` si el usuario es considerado nuevo, `false` en caso contrario.
 */
export function useIsNewUser(): boolean {
    const { user, loading } = useAuth();
    const [isNew, setIsNew] = useState(false);

    useEffect(() => {
        if (loading || !user) {
            setIsNew(false);
            return;
        }

        const metadata = user.metadata;
        if (metadata.creationTime && metadata.lastSignInTime) {
            const creation = new Date(metadata.creationTime).getTime();
            const lastSignIn = new Date(metadata.lastSignInTime).getTime();
            
            // Si la diferencia es menor a 15 segundos, es muy probable que sea la primera sesión.
            const differenceInSeconds = (lastSignIn - creation) / 1000;
            if (differenceInSeconds < 15) {
                setIsNew(true);
            } else {
                setIsNew(false);
            }
        } else {
            setIsNew(false);
        }

    }, [user, loading]);

    return isNew;
}
