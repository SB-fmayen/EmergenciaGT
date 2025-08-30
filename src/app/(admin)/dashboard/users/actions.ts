
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
        // Option 1: Use environment variables (Best for deployment)
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) as ServiceAccount;
            adminApp = initializeApp({ credential: cert(serviceAccount) });
        } 
        // Option 2: Use Application Default Credentials (For Google Cloud environments)
        else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            adminApp = initializeApp();
        }
        else {
            throw new Error("Firebase Admin SDK credentials not found. Please set FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS.");
        }
    } catch (e: any) {
        console.error("Firebase Admin Init Error:", e.message);
        // Avoid crashing the server during build, the error will be caught in the actions.
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
 * Any authenticated user can perform this action to allow the first admin setup.
 * The UI layer should restrict access to this page for non-admins after setup.
 */
export async function getUsers(idToken: string | undefined): Promise<{ success: boolean, users?: UserRecordWithRole[], error?: string }> {
    try {
        const adminAuth = checkAdminApp();
        if (!idToken) {
            return { success: false, error: 'No se proporcionó token de autenticación. Acceso denegado.' };
        }

        await adminAuth.verifyIdToken(idToken);
        
        const userRecords = await adminAuth.listUsers();
        
        const users = await Promise.all(userRecords.users.map(async (user) => {
            let stationId: string | undefined;
            const userDoc = await firestore.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                stationId = userDoc.data()?.stationId;
            }

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
        if (error.code === 'permission-denied' || error.code === 'auth/insufficient-permission') {
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

        const listUsersResult = await adminAuth.listUsers(1000);
        const admins = listUsersResult.users.filter(user => user.customClaims?.admin === true);
        
        if (updates.role) {
            const isFirstAdminSetup = admins.length === 0 && decodedToken.uid === uid && updates.role === 'admin';
            if (decodedToken.admin !== true && !isFirstAdminSetup) {
                 return { success: false, error: 'No tienes permisos de administrador para cambiar roles.' };
            }
            if (admins.length === 1 && admins[0].uid === uid && updates.role === 'operator') {
                return { success: false, error: 'No puedes quitar el rol al último administrador.'}
            }
            await adminAuth.setCustomUserClaims(uid, { admin: updates.role === 'admin' });
        }
        
        if (typeof updates.stationId !== 'undefined') {
             if (decodedToken.admin !== true) {
                 return { success: false, error: 'No tienes permisos de administrador para asignar estaciones.' };
            }
            const userDocRef = firestore.collection('users').doc(uid);
            if (updates.stationId === null) {
                await userDocRef.update({ stationId: null });
            } else {
                await userDocRef.set({ stationId: updates.stationId }, { merge: true });
            }
        }

        return { success: true };

    } catch (error: any) {
        console.error(`Error updating user ${uid}:`, error);
        return { success: false, error: `Error del servidor: ${error.code || error.message}` };
    }
}
