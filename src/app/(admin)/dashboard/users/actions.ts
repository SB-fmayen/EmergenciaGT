
"use server";

import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { ServiceAccount } from 'firebase-admin';
import { firestore } from '@/lib/firebase-admin';
import type { UserRole } from '@/lib/types';

// This is a type for the data we send to the client to avoid sending the whole UserRecord
export type UserRecordWithRole = {
    uid: string;
    email?: string;
    displayName?: string;
    role: UserRole;
    disabled: boolean;
    creationTime: string;
    lastSignInTime: string;
    stationId?: string;
    unitId?: string; // ID de la unidad en la subcolección
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

const determineRole = (claims: { [key: string]: any }): UserRole => {
    if (claims.admin === true) return 'admin';
    if (claims.unit === true) return 'unit';
    return 'operator';
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
            const stationId = user.customClaims?.stationId as string | undefined;
            const unitId = user.customClaims?.unitId as string | undefined;

            return {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                role: determineRole(user.customClaims || {}),
                disabled: user.disabled,
                creationTime: user.metadata.creationTime,
                lastSignInTime: user.metadata.lastSignInTime,
                stationId,
                unitId
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
 * A server action to set a user's role and/or assigned station/unit.
 * Only an admin can perform this action, with a special exception for the first admin.
 */
export async function updateUser(
    uid: string, 
    idToken: string | undefined, 
    updates: { 
        role?: UserRole, 
        stationId?: string | null,
        unitId?: string | null
    }
): Promise<{ success: boolean, error?: string }> {
     try {
        const adminAuth = checkAdminApp();
        if (!idToken) {
            return { success: false, error: 'No se proporcionó token de autenticación. Acceso denegado.' };
        }

        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const targetUser = await adminAuth.getUser(uid);
        const currentClaims = targetUser.customClaims || {};
        const userDocRef = firestore.collection('users').doc(uid);
        const userDocSnap = await userDocRef.get();

        const updatesForFirestore: any = {};
        
        // Ensure base user profile exists
        if (!userDocSnap.exists) {
            updatesForFirestore.uid = targetUser.uid;
            updatesForFirestore.email = targetUser.email;
            updatesForFirestore.createdAt = targetUser.metadata.creationTime;
        }

        // --- Role Update Logic ---
        if (updates.role) {
            if (decodedToken.admin !== true) {
                 const listUsersResult = await adminAuth.listUsers(1);
                 const isFirstAdminSetup = listUsersResult.users.length === 0 && decodedToken.uid === uid && updates.role === 'admin';
                 if (!isFirstAdminSetup) {
                    return { success: false, error: 'No tienes permisos de administrador para cambiar roles.' };
                 }
            }
             
            if (currentClaims.admin === true && updates.role !== 'admin') {
                const listUsersResult = await adminAuth.listUsers(1000);
                const admins = listUsersResult.users.filter(user => user.customClaims?.admin === true);
                if (admins.length === 1 && admins[0].uid === uid) {
                     return { success: false, error: 'No puedes quitar el rol al último administrador.'}
                }
            }
            
            const newRole = updates.role;
            currentClaims.admin = newRole === 'admin';
            currentClaims.unit = newRole === 'unit';
            updatesForFirestore.role = newRole;

            if(newRole === 'operator') {
                delete currentClaims.admin;
                delete currentClaims.unit;
            }

            // If changing to operator or admin, assignments must be cleared.
            if (newRole === 'operator' || newRole === 'admin') {
                delete currentClaims.stationId;
                delete currentClaims.unitId;
                updatesForFirestore.stationId = null;
                updatesForFirestore.unitId = null;
            }
        }
        
        const finalStationId = updates.stationId ?? currentClaims.stationId;

        // --- Station Update Logic ---
        if (typeof updates.stationId !== 'undefined') {
             if (decodedToken.admin !== true) {
                 return { success: false, error: 'No tienes permisos de administrador para asignar estaciones.' };
            }
            if (updates.stationId === null) {
                delete currentClaims.stationId;
                delete currentClaims.unitId; // Can't have a unit without a station
                updatesForFirestore.stationId = null;
                updatesForFirestore.unitId = null;
            } else {
                currentClaims.stationId = updates.stationId;
                updatesForFirestore.stationId = updates.stationId;
                // If station is changing, unit must be cleared.
                if (updates.stationId !== currentClaims.stationId) {
                    delete currentClaims.unitId;
                    updatesForFirestore.unitId = null;
                }
            }
        }
        
        // --- Unit Update Logic ---
        if (typeof updates.unitId !== 'undefined') {
            if (decodedToken.admin !== true) {
                return { success: false, error: 'No tienes permisos de administrador para asignar unidades.' };
            }
            
            const isClearingUnit = updates.unitId === null;

            if (isClearingUnit) {
                delete currentClaims.unitId;
                updatesForFirestore.unitId = null;
            } else {
                 if (!finalStationId) {
                    return { success: false, error: 'Se debe asignar una estación antes de asignar una unidad.'};
                }
                currentClaims.unitId = updates.unitId;
                updatesForFirestore.unitId = updates.unitId;
            }
        }
        
        // Atomically set all claims
        await adminAuth.setCustomUserClaims(uid, currentClaims);

        // Update Firestore document with all gathered changes
        if (Object.keys(updatesForFirestore).length > 0) {
            await userDocRef.set(updatesForFirestore, { merge: true });
        }
        
        return { success: true };

    } catch (error: any) {
        console.error(`Error updating user ${uid}:`, error);
        return { success: false, error: `Error del servidor: ${error.code || error.message}` };
    }
}
