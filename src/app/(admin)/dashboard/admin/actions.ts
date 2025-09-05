
'use server';
/**
 * @fileoverview Este archivo contiene las Server Actions para el dashboard de administración.
 * Las Server Actions son funciones que se ejecutan de forma segura en el servidor en respuesta a interacciones del cliente,
 * como hacer clic en un botón. Permiten acceder a la base de datos y a otros recursos del lado del servidor sin
 * necesidad de crear endpoints de API explícitos.
 */

import { firestore } from '@/lib/firebase-admin';
import type { AlertData, MedicalData } from '@/lib/types';
import { Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { ServiceAccount } from 'firebase-admin';

// Este es un tipo extendido para el objeto de alerta que incluye la información del usuario.
// Se usa para combinar los datos de la colección 'alerts' y 'medicalInfo'.
export interface EnrichedAlert extends AlertData {
    userInfo?: MedicalData;
}


// --- Inicialización del SDK de Admin de Firebase ---
// Este bloque asegura que el SDK de Admin solo se inicialice una vez.
// Busca credenciales en las variables de entorno para autenticarse.
let adminApp: App;
if (!getApps().length) {
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) as ServiceAccount;
            adminApp = initializeApp({ credential: cert(serviceAccount) });
        } 
        else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            adminApp = initializeApp();
        }
        else {
            throw new Error("Firebase Admin SDK credentials not found. Please set FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS.");
        }
    } catch (e: any) {
        console.error("Firebase Admin Init Error:", e.message);
    }
} else {
    adminApp = getApps()[0];
}
// --- Fin de la Inicialización ---

/**
 * Función auxiliar para verificar si la app de admin está inicializada antes de usarla.
 * @returns La instancia de Auth del SDK de Admin.
 * @throws {Error} Si el SDK no está inicializado.
 */
const checkAdminApp = () => {
    if (!adminApp) {
        throw new Error("Firebase Admin SDK no está inicializado. Verifica las credenciales del servidor.");
    }
    return getAuth(adminApp);
}


/**
 * Server Action para obtener las alertas y enriquecerlas con los datos médicos del usuario.
 * Esta operación se realiza en el servidor por seguridad y eficiencia.
 * @param {string} idToken - El token de ID de Firebase del usuario que realiza la solicitud para verificar sus permisos.
 * @returns {Promise<{success: boolean, alerts?: EnrichedAlert[], error?: string}>} Un objeto que indica el éxito de la operación y contiene las alertas enriquecidas o un mensaje de error.
 */
export async function getEnrichedAlerts(idToken: string): Promise<{ success: boolean; alerts?: EnrichedAlert[]; error?: string; }> {
    try {
        const adminAuth = checkAdminApp();
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        
        const userRole = decodedToken.admin ? 'admin' : decodedToken.unit ? 'unit' : 'operator';
        const stationId = decodedToken.stationId as string | undefined;

        const alertsRef = firestore.collection("alerts");
        let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData>;

        // Construye la consulta a Firestore basándose en el rol del usuario.
        if (userRole === 'admin') {
            // El admin ve todas las alertas.
            query = alertsRef.orderBy("timestamp", "desc");
        } else if (userRole === 'operator' && stationId) {
            // Un operador solo ve las alertas asignadas a su estación.
            query = alertsRef.where("assignedStationId", "==", stationId).orderBy("timestamp", "desc");
        } else {
             // Por seguridad, un operador sin estación o un rol no reconocido solo ve alertas nuevas no asignadas.
             query = alertsRef.where("status", "==", "new").orderBy("timestamp", "desc");
        }

        const snapshot = await query.get();
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

        // Combina los datos de las alertas con la información médica.
        const enrichedAlerts: EnrichedAlert[] = alertsData.map(alert => {
             const userInfo = alert.userId ? medicalInfoMap.get(alert.userId) : undefined;
             
             // **LA CORRECCIÓN CLAVE ESTÁ AQUÍ**
             // El objeto Timestamp de Firestore no es un "objeto simple" (plain object) y no puede ser pasado
             // directamente de un Server Component (esta acción) a un Client Component (la página del dashboard).
             // Para solucionarlo, lo convertimos a un objeto simple que el cliente pueda entender.
             const serializableTimestamp = {
                _seconds: (alert.timestamp as Timestamp).seconds,
                _nanoseconds: (alert.timestamp as Timestamp).nanoseconds,
             };

             return {
                ...alert,
                timestamp: serializableTimestamp, // Usamos el objeto simple en lugar del objeto Timestamp de Firestore.
                userInfo,
             };
        });
        
        return { success: true, alerts: enrichedAlerts };

    } catch (error: any) {
        console.error("Error fetching enriched alerts:", error);
         if (error.code === 'auth/id-token-expired') {
            return { success: false, error: "Tu sesión ha expirado. Por favor, inicia sesión de nuevo." };
        }
        // Devuelve un mensaje de error genérico para el cliente.
        return { success: false, error: `Error del servidor: ${error.message}` };
    }
}
