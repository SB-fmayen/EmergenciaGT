
"use server";

import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { ServiceAccount } from 'firebase-admin';
import { firestore } from '@/lib/firebase-admin';

// This is a type for the data we send to the client to avoid sending the whole UserRecord
export type UserRecordWithRole = {
    uid: string;
    email?: string;
    displayName?: string;
    role: 'admin' | 'operator';
    disabled: boolean;
    creationTime: string;
    lastSignInTime: string;
    stationId?: string;
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
 * A server action to get a list of all users from Firebase Authentication.
 */
export async function getUsers(idToken: string | undefined): Promise<{ success: boolean, users?: UserRecordWithRole[], error?: string }> {
    try {
        const adminAuth = checkAdminApp();
        if (!idToken) {
            return { success: false, error: 'No se proporcionó token de autenticación. Acceso denegado.' };
        }

        // Verify the user making the request is an admin
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        if (decodedToken.admin !== true) {
            return { success: false, error: 'Acción no autorizada. Se requieren privilegios de administrador.' };
        }
        
        const userRecords = await adminAuth.listUsers();
        
        const users = await Promise.all(userRecords.users.map(async (user) => {
            // The stationId from custom claims is the source of truth for filtering
            // The one from Firestore is for display/management in the admin panel
            const stationId = user.customClaims?.stationId as string | undefined;

            return {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                role: user.customClaims?.admin === true ? 'admin' : 'operator' as 'admin' | 'operator',
                disabled: user.disabled,
                creationTime: user.metadata.creationTime,
                lastSignInTime: user.metadata.lastSignInTime,
                stationId,
            };
        }));
        
        return { success: true, users };

    } catch (error: any) {
        console.error("Error fetching users:", error);
        if (error.code?.includes('permission-denied') || error.code?.includes('auth/insufficient-permission')) {
             return { success: false, error: 'La cuenta de servicio del servidor no tiene los permisos necesarios en IAM para listar usuarios.' };
        }
        return { success: false, error: `Error del servidor: ${error.message}` };
    }
}


/**
 * A server action to set a user's role and/or assigned station.
 * Only an admin can perform this action, with a special exception for the first admin.
 */
export async function updateUser(
    uid: string, 
    idToken: string | undefined, 
    updates: { role?: 'admin' | 'operator', stationId?: string | null }
): Promise<{ success: boolean, error?: string }> {
     try {
        const adminAuth = checkAdminApp();
        if (!idToken) {
            return { success: false, error: 'No se proporcionó token de autenticación. Acceso denegado.' };
        }

        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const targetUser = await adminAuth.getUser(uid);
        const currentClaims = targetUser.customClaims || {};

        // --- Role Update Logic ---
        if (updates.role) {
            const listUsersResult = await adminAuth.listUsers(1000);
            const admins = listUsersResult.users.filter(user => user.customClaims?.admin === true);
            
            const isFirstAdminSetup = admins.length === 0 && decodedToken.uid === uid && updates.role === 'admin';
            if (decodedToken.admin !== true && !isFirstAdminSetup) {
                 return { success: false, error: 'No tienes permisos de administrador para cambiar roles.' };
            }
            if (admins.length === 1 && admins[0].uid === uid && updates.role === 'operator') {
                return { success: false, error: 'No puedes quitar el rol al último administrador.'}
            }
            currentClaims.admin = updates.role === 'admin';
        }
        
        // --- Station Update Logic ---
        if (typeof updates.stationId !== 'undefined') {
             if (decodedToken.admin !== true) {
                 return { success: false, error: 'No tienes permisos de administrador para asignar estaciones.' };
            }
            const userDocRef = firestore.collection('users').doc(uid);

            if (updates.stationId === null) {
                delete currentClaims.stationId;
                await userDocRef.set({ stationId: null }, { merge: true });
            } else {
                currentClaims.stationId = updates.stationId;
                await userDocRef.set({ stationId: updates.stationId }, { merge: true });
            }
        }
        
        // Atomically set all claims
        await adminAuth.setCustomUserClaims(uid, currentClaims);
        
        // After setting claims, it's good practice to inform the client to refresh the token.
        // The client-side logic should handle this.
        return { success: true };

    } catch (error: any) {
        console.error(`Error updating user ${uid}:`, error);
        return { success: false, error: `Error del servidor: ${error.code || error.message}` };
    }
}
