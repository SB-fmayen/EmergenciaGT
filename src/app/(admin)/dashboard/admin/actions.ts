
'use server';
/**
 * @fileoverview Este archivo contiene las Server Actions para el dashboard de administración.
 * Las Server Actions son funciones que se ejecutan de forma segura en el servidor en respuesta a interacciones del cliente,
 * como hacer clic en un botón. Permiten acceder a la base de datos y a otros recursos del lado del servidor sin
 * necesidad de crear endpoints de API explícitos.
 */

import { firestore } from '@/lib/firebase-admin';
import type { AlertData, MedicalData, UserProfile } from '@/lib/types';
import { Timestamp } from 'firebase-admin/firestore';

// Este es un tipo extendido para el objeto de alerta que incluye la información del usuario.
// Se usa para combinar los datos de la colección 'alerts' y 'medicalInfo'.
export interface EnrichedAlert extends AlertData {
    userInfo?: MedicalData;
}


/**
 * Server Action para obtener las alertas y enriquecerlas con los datos médicos del usuario.
 * Esta operación se realiza en el servidor por seguridad y eficiencia.
 * @returns {Promise<{success: boolean, alerts?: EnrichedAlert[], error?: string}>} Un objeto que indica el éxito de la operación y contiene las alertas enriquecidas o un mensaje de error.
 */
export async function getEnrichedAlerts(): Promise<{ success: boolean; alerts?: EnrichedAlert[]; error?: string; }> {
    try {
        const alertsRef = firestore.collection("alerts");
        const snapshot = await alertsRef.orderBy("timestamp", "desc").get();
        const alertsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as AlertData[];
        
        // --- Paso de Enriquecimiento ---
        // Recopila todos los IDs de usuario de las alertas (que no sean anónimas).
        const userIds = [...new Set(
            alertsData
                .filter(alert => alert.userId && !alert.isAnonymous)
                .map(alert => alert.userId)
        )];

        let medicalInfoMap = new Map<string, MedicalData>();

        // Si hay usuarios para buscar, realiza una consulta optimizada.
        if (userIds.length > 0) {
            const chunks = [];
            // Firestore tiene un límite de 30 valores en una cláusula 'in'. Dividimos los IDs en trozos (chunks).
            for (let i = 0; i < userIds.length; i += 30) {
                chunks.push(userIds.slice(i, i + 30));
            }

            // Ejecuta una consulta por cada trozo.
            for (const chunk of chunks) {
                const medicalInfoQuery = firestore.collection("medicalInfo").where("uid", "in", chunk);
                const medicalInfoSnapshot = await medicalInfoQuery.get();
                medicalInfoSnapshot.forEach(doc => {
                    medicalInfoMap.set(doc.id, doc.data() as MedicalData);
                });
            }
        }
        
        // **LA CORRECCIÓN CLAVE ESTÁ AQUÍ**
        // Next.js no puede pasar objetos complejos como `Timestamp` de Firestore desde el servidor al cliente.
        // Debemos convertir todos los timestamps a un formato serializable (un objeto simple).

        const enrichedAlerts: EnrichedAlert[] = alertsData.map(alert => {
             const userInfo = alert.userId ? medicalInfoMap.get(alert.userId) : undefined;
             
             // 1. Clonamos el objeto de alerta para no mutar el original.
             const serializableAlert: any = { ...alert };

             // 2. Convertimos el timestamp principal de la alerta.
             if (serializableAlert.timestamp instanceof Timestamp) {
                 serializableAlert.timestamp = {
                    _seconds: serializableAlert.timestamp.seconds,
                    _nanoseconds: serializableAlert.timestamp.nanoseconds,
                 };
             }

             // 3. Si existe userInfo, también convertimos cualquier timestamp que contenga.
             if (userInfo) {
                 const serializableUserInfo: any = { ...userInfo };
                 // Firestore no almacena timestamps en medicalInfo, pero lo hacemos por si acaso.
                 // Los campos como `createdAt` o `lastLogin` SÍ están en `users`.
                 for (const key in serializableUserInfo) {
                     if (serializableUserInfo[key] instanceof Timestamp) {
                         serializableUserInfo[key] = {
                             _seconds: serializableUserInfo[key].seconds,
                             _nanoseconds: serializableUserInfo[key].nanoseconds,
                         };
                     }
                 }
                 serializableAlert.userInfo = serializableUserInfo;
             }
             
             return serializableAlert as EnrichedAlert;
        });
        
        return { success: true, alerts: enrichedAlerts };

    } catch (error: any) {
        console.error("Error fetching enriched alerts:", error);
        // Devuelve un mensaje de error genérico para el cliente.
        return { success: false, error: `Error del servidor: ${error.message}` };
    }
}
