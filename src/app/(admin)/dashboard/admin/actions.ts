
'use server';

import { firestore } from '@/lib/firebase-admin';
import type { AlertData, MedicalData, UserProfile } from '@/lib/types';
import { Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { ServiceAccount } from 'firebase-admin';

// This is a type for the data we send to the client to avoid sending the whole UserRecord
export interface EnrichedAlert extends AlertData {
    userInfo?: MedicalData;
}


// --- Firebase Admin SDK Initialization ---
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
// --- End of Initialization ---

const checkAdminApp = () => {
    if (!adminApp) {
        throw new Error("Firebase Admin SDK no está inicializado. Verifica las credenciales del servidor.");
    }
    return getAuth(adminApp);
}


/**
 * Fetches alerts and enriches them with user medical data on the server.
 * This is a secure way to access medical info without exposing it to the client.
 * @param {string} idToken - The Firebase ID token of the user making the request.
 * @returns {Promise<{success: boolean, alerts?: EnrichedAlert[], error?: string}>}
 */
export async function getEnrichedAlerts(idToken: string): Promise<{ success: boolean; alerts?: EnrichedAlert[]; error?: string; }> {
    try {
        const adminAuth = checkAdminApp();
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        
        const userRole = decodedToken.admin ? 'admin' : decodedToken.unit ? 'unit' : 'operator';
        const stationId = decodedToken.stationId as string | undefined;

        const alertsRef = firestore.collection("alerts");
        let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData>;

        if (userRole === 'admin') {
            query = alertsRef.orderBy("timestamp", "desc");
        } else if (userRole === 'operator' && stationId) {
            query = alertsRef.where("assignedStationId", "==", stationId).orderBy("timestamp", "desc");
        } else {
             // Operador sin estación o rol no reconocido solo puede ver alertas nuevas
             query = alertsRef.where("status", "==", "new").orderBy("timestamp", "desc");
        }

        const snapshot = await query.get();
        const alertsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as AlertData[];
        
        // --- Enrichment step ---
        const userIds = [...new Set(
            alertsData
                .filter(alert => alert.userId && !alert.isAnonymous)
                .map(alert => alert.userId)
        )];

        let medicalInfoMap = new Map<string, MedicalData>();

        if (userIds.length > 0) {
            const chunks = [];
            for (let i = 0; i < userIds.length; i += 30) {
                chunks.push(userIds.slice(i, i + 30));
            }

            for (const chunk of chunks) {
                const medicalInfoQuery = firestore.collection("medicalInfo").where("uid", "in", chunk);
                const medicalInfoSnapshot = await medicalInfoQuery.get();
                medicalInfoSnapshot.forEach(doc => {
                    medicalInfoMap.set(doc.id, doc.data() as MedicalData);
                });
            }
        }

        const enrichedAlerts: EnrichedAlert[] = alertsData.map(alert => {
             const userInfo = alert.userId ? medicalInfoMap.get(alert.userId) : undefined;
             const { toMillis, ...timestamp } = alert.timestamp; // Avoid serializing methods

             return {
                ...alert,
                timestamp: { // Convert to a serializable format
                    _seconds: (alert.timestamp as Timestamp).seconds,
                    _nanoseconds: (alert.timestamp as Timestamp).nanoseconds,
                },
                userInfo,
             };
        });
        
        return { success: true, alerts: enrichedAlerts };

    } catch (error: any) {
        console.error("Error fetching enriched alerts:", error);
         if (error.code === 'auth/id-token-expired') {
            return { success: false, error: "Tu sesión ha expirado. Por favor, inicia sesión de nuevo." };
        }
        return { success: false, error: `Error del servidor: ${error.message}` };
    }
}
